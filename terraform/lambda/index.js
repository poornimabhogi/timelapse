import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import sharp from 'sharp';
import path from 'path';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);

const THUMBNAIL_SIZES = process.env.THUMBNAIL_SIZES 
  ? process.env.THUMBNAIL_SIZES.split(',').map(size => parseInt(size, 10))
  : [200, 400, 800];

/**
 * Enhanced Lambda function to process media files and handle CRUD operations
 */
exports.handler = async (event) => {
  try {
    console.log('Processing event:', JSON.stringify(event, null, 2));
    
    // Handle different event types
    if (event.Records) {
      // S3 upload event - process uploaded media
      return await handleS3Upload(event);
    } else if (event.operation) {
      // Direct invocation for media operations
      return await handleMediaOperation(event);
    } else {
      console.log('Unknown event type:', event);
      return { status: 'skipped', message: 'Unknown event type' };
    }
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    return {
      status: 'error',
      message: error.message,
      stack: error.stack
    };
  }
};

/**
 * Handle S3 upload events (automatic processing)
 */
async function handleS3Upload(event) {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    
    // Validate the file is in the uploads folder
    if (!key.startsWith('uploads/')) {
      console.log('Not processing file outside of uploads folder:', key);
      return { status: 'skipped', message: 'File not in uploads folder' };
    }
    
    // Extract user ID and file name from the key
    const keyParts = key.split('/');
    if (keyParts.length < 3) {
      console.log('Invalid key format:', key);
      return { status: 'error', message: 'Invalid key format' };
    }
    
    const userId = keyParts[1];
    const fileName = keyParts[keyParts.length - 1];
    const fileExt = path.extname(fileName).toLowerCase();
    const fileNameWithoutExt = path.basename(fileName, fileExt);
  const category = determineCategoryFromPath(key);
    
  // Check if the file is a supported media type
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExt);
    const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(fileExt);
    
    if (!isImage && !isVideo) {
      console.log('Not processing non-media file:', fileName);
      return { status: 'skipped', message: 'Not a media file' };
    }
    
    // Get the original file from S3
  const s3Object = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
  }));
    
    let metadata;
    let processedKey;
  let thumbnailKeys = [];
    
    if (isImage) {
      // Process image and create thumbnails
    const result = await processImage(s3Object.Body, bucket, userId, fileNameWithoutExt, fileExt, category);
    metadata = result.metadata;
    processedKey = result.processedKey;
    thumbnailKeys = result.thumbnailKeys;
    } else if (isVideo) {
    // Process video
    const result = await processVideo(s3Object.Body, bucket, userId, fileNameWithoutExt, fileExt, category);
    metadata = result.metadata;
    processedKey = result.processedKey;
    thumbnailKeys = result.thumbnailKeys;
    }
    
  // Update the appropriate DynamoDB table based on category
  await updateDatabase(category, {
    userId,
    originalKey: key,
    processedKey,
    thumbnailKeys,
    metadata,
    bucket
  });
    
    return {
      status: 'success',
      message: 'Media processed successfully',
      data: {
        userId,
      originalUrl: `s3://${bucket}/${key}`,
      processedUrl: `s3://${bucket}/${processedKey}`,
      thumbnailUrls: thumbnailKeys.map(tk => `s3://${bucket}/${tk}`),
      metadata
      }
    };
}

/**
 * Handle direct media operations (delete, update status, etc.)
 */
async function handleMediaOperation(event) {
  const { operation, data } = event;
  
  switch (operation) {
    case 'deleteS3Object':
      return await deleteS3Object(data.bucket, data.key);
    
    case 'processMedia':
      return await processMediaFromUrl(data);
    
    case 'updateMediaStatus':
      return await updateMediaStatus(data.mediaId, data.status, data.processedData);
    
    case 'cleanupOrphanedMedia':
      return await cleanupOrphanedMedia(data.userId);
    
    case 'batchDeleteMedia':
      return await batchDeleteMedia(data.mediaItems);
    
    default:
      return { status: 'error', message: `Unknown operation: ${operation}` };
  }
}

/**
 * Determine media category from S3 key path
 */
function determineCategoryFromPath(key) {
  if (key.includes('/timelapses/')) return 'timelapse';
  if (key.includes('/feature_posts/')) return 'feature_post';
  if (key.includes('/products/')) return 'product_image';
  if (key.includes('/profiles/')) return 'profile_image';
  if (key.includes('/verification/')) return 'verification_doc';
  return 'media'; // default
}

/**
 * Enhanced image processing with category-specific optimization
 */
async function processImage(imageBuffer, bucket, userId, fileName, fileExt, category) {
  const metadata = await sharp(imageBuffer).metadata();
  
  // Category-specific optimization settings
  const optimizationSettings = getOptimizationSettings(category);
  
  // Optimize original image
  let sharpInstance = sharp(imageBuffer);
  
  if (optimizationSettings.maxWidth && metadata.width > optimizationSettings.maxWidth) {
    sharpInstance = sharpInstance.resize(optimizationSettings.maxWidth);
  }
  
  const optimizedImageBuffer = await sharpInstance
    .jpeg({ quality: optimizationSettings.quality })
    .withMetadata()
    .toBuffer();
  
  // Upload optimized original to processed folder
  const processedKey = `processed/${category}/${userId}/${fileName}${fileExt}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: processedKey,
    Body: optimizedImageBuffer,
    ContentType: `image/${fileExt.replace('.', '')}`,
    CacheControl: 'max-age=31536000', // 1 year cache
    Metadata: {
      'original-width': metadata.width?.toString() || '',
      'original-height': metadata.height?.toString() || '',
      'category': category,
      'user-id': userId
    }
  }));
  
  // Create and upload thumbnails
  const thumbnailKeys = [];
  for (const size of THUMBNAIL_SIZES) {
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const thumbnailKey = `thumbnails/${category}/${userId}/${fileName}_${size}${fileExt}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: `image/${fileExt.replace('.', '')}`,
      CacheControl: 'max-age=31536000'
    }));
    
    thumbnailKeys.push(thumbnailKey);
  }
  
  return {
    metadata: {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
      size: optimizedImageBuffer.length,
      category
    },
    processedKey,
    thumbnailKeys
  };
}

/**
 * Enhanced video processing
 */
async function processVideo(videoBuffer, bucket, userId, fileName, fileExt, category) {
  // Upload processed video (in real implementation, you'd use ffmpeg for optimization)
  const processedKey = `processed/${category}/${userId}/${fileName}${fileExt}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: processedKey,
    Body: videoBuffer,
    ContentType: `video/${fileExt.replace('.', '')}`,
    CacheControl: 'max-age=31536000',
    Metadata: {
      'category': category,
      'user-id': userId
    }
  }));
  
  // Create video thumbnail (placeholder implementation)
  const thumbnailKey = `thumbnails/${category}/${userId}/${fileName}_thumbnail.jpg`;
  const placeholderThumbnail = await generateVideoThumbnail(videoBuffer);
  
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: thumbnailKey,
    Body: placeholderThumbnail,
    ContentType: 'image/jpeg',
    CacheControl: 'max-age=31536000'
  }));
  
  return {
    metadata: {
    format: fileExt.replace('.', ''),
      size: videoBuffer.length,
      duration: 0, // In real implementation, extract from video
      category
    },
    processedKey,
    thumbnailKeys: [thumbnailKey]
  };
}

/**
 * Get optimization settings based on media category
 */
function getOptimizationSettings(category) {
  const settings = {
    'product_image': { maxWidth: 1200, quality: 90 },
    'timelapse': { maxWidth: 1080, quality: 85 },
    'feature_post': { maxWidth: 1080, quality: 85 },
    'profile_image': { maxWidth: 500, quality: 90 },
    'verification_doc': { maxWidth: 1600, quality: 95 },
    'default': { maxWidth: 1080, quality: 85 }
  };
  
  return settings[category] || settings.default;
}

/**
 * Update database based on category
 */
async function updateDatabase(category, data) {
  const timestamp = Date.now();
  
  try {
    switch (category) {
      case 'timelapse':
        await dynamoDB.send(new PutCommand({
          TableName: process.env.TIMELAPSES_TABLE || 'timelapses',
          Item: {
            id: `timelapse_${timestamp}_${data.userId}`,
            userId: data.userId,
            mediaUrl: `https://${data.bucket}.s3.amazonaws.com/${data.processedKey}`,
            thumbnailUrl: `https://${data.bucket}.s3.amazonaws.com/${data.thumbnailKeys[0]}`,
            type: data.metadata.format === 'video' ? 'video' : 'photo',
            createdAt: timestamp,
            metadata: data.metadata,
            status: 'PROCESSED'
          }
        }));
        break;
      
      case 'product_image':
        // Products are handled differently - this is just processing notification
        await dynamoDB.send(new PutCommand({
          TableName: process.env.MEDIA_PROCESSING_TABLE || 'media_processing',
          Item: {
            id: `product_media_${timestamp}_${data.userId}`,
            userId: data.userId,
            category: 'product_image',
            originalUrl: `https://${data.bucket}.s3.amazonaws.com/${data.originalKey}`,
            processedUrl: `https://${data.bucket}.s3.amazonaws.com/${data.processedKey}`,
            thumbnailUrls: data.thumbnailKeys.map(tk => `https://${data.bucket}.s3.amazonaws.com/${tk}`),
            metadata: data.metadata,
            status: 'PROCESSED',
            createdAt: timestamp
          }
        }));
        break;
      
      default:
        console.log(`No database update configured for category: ${category}`);
    }
  } catch (error) {
    console.error('Error updating database:', error);
    // Don't throw - processing was successful even if DB update failed
  }
}

/**
 * Delete S3 object
 */
async function deleteS3Object(bucket, key) {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    }));
    
    console.log(`Successfully deleted S3 object: ${key}`);
    return { success: true, message: `Deleted ${key}` };
  } catch (error) {
    console.error(`Error deleting S3 object ${key}:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * Process media from URL (for direct processing requests)
 */
async function processMediaFromUrl(data) {
  try {
    const { originalUrl, type, category, userId, metadata } = data;
    const urlObj = new URL(originalUrl);
    const key = urlObj.pathname.substring(1); // Remove leading slash
    const bucket = urlObj.hostname.split('.')[0];
    
    // Get the file from S3
    const s3Object = await s3Client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));
    
    const fileName = path.basename(key, path.extname(key));
    const fileExt = path.extname(key);
    
    let result;
    if (type.startsWith('image/')) {
      result = await processImage(s3Object.Body, bucket, userId, fileName, fileExt, category);
    } else if (type.startsWith('video/')) {
      result = await processVideo(s3Object.Body, bucket, userId, fileName, fileExt, category);
    } else {
      throw new Error(`Unsupported media type: ${type}`);
    }
    
    return {
      success: true,
      processedUrl: `https://${bucket}.s3.amazonaws.com/${result.processedKey}`,
      thumbnailUrls: result.thumbnailKeys.map(tk => `https://${bucket}.s3.amazonaws.com/${tk}`),
      metadata: result.metadata
    };
  } catch (error) {
    console.error('Error processing media from URL:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update media status in DynamoDB
 */
async function updateMediaStatus(mediaId, status, processedData) {
  try {
    // Try to update in multiple possible tables
    const tables = [
      process.env.TIMELAPSES_TABLE || 'timelapses',
      process.env.PRODUCTS_TABLE || 'products',
      process.env.MEDIA_PROCESSING_TABLE || 'media_processing'
    ];
    
    for (const table of tables) {
      try {
        await dynamoDB.send(new UpdateCommand({
          TableName: table,
          Key: { id: mediaId },
          UpdateExpression: 'SET #status = :status, #processedData = :processedData, #updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#processedData': 'processedData',
            '#updatedAt': 'updatedAt'
          },
          ExpressionAttributeValues: {
            ':status': status,
            ':processedData': processedData,
            ':updatedAt': Date.now()
          }
        }));
        break; // Success, exit loop
      } catch (tableError) {
        // Continue to next table if this one fails
        console.log(`Failed to update ${table}, trying next...`);
      }
    }
    
    return { success: true, message: 'Media status updated' };
  } catch (error) {
    console.error('Error updating media status:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Clean up orphaned media files
 */
async function cleanupOrphanedMedia(userId) {
  try {
    console.log(`Starting orphaned media cleanup for user: ${userId}`);
    
    // List all S3 objects for the user
    const listParams = {
      Bucket: process.env.S3_BUCKET,
      Prefix: `uploads/${userId}/`
    };
    
    const s3Objects = await s3Client.send(new ListObjectsV2Command(listParams));
    let deletedCount = 0;
    
    // In a real implementation, you'd cross-reference with database
    // For now, we'll just clean up very old files (> 30 days with no processing record)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const obj of s3Objects.Contents || []) {
      if (obj.LastModified && obj.LastModified.getTime() < thirtyDaysAgo) {
        // Check if there's a corresponding processed file
        const processedKey = obj.Key.replace('uploads/', 'processed/');
        
        try {
          await s3Client.send(new HeadObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: processedKey
          }));
          // Processed file exists, keep the original
        } catch (headError) {
          // No processed file, this might be orphaned
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: obj.Key
          }));
          deletedCount++;
          console.log(`Deleted orphaned file: ${obj.Key}`);
        }
      }
    }
    
    return {
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} orphaned files`
    };
  } catch (error) {
    console.error('Error cleaning up orphaned media:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Batch delete media items
 */
async function batchDeleteMedia(mediaItems) {
  const results = [];
  
  for (const item of mediaItems) {
    try {
      for (const url of item.urls) {
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1);
        const bucket = urlObj.hostname.split('.')[0];
        
        await deleteS3Object(bucket, key);
      }
      
      results.push({ id: item.id, success: true });
    } catch (error) {
      console.error(`Error deleting media item ${item.id}:`, error);
      results.push({ id: item.id, success: false, error: error.message });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount === mediaItems.length,
    processed: mediaItems.length,
    successful: successCount,
    failed: mediaItems.length - successCount,
    results
  };
}

/**
 * Generate video thumbnail (placeholder implementation)
 */
async function generateVideoThumbnail(videoBuffer) {
  // In a real implementation, you'd use ffmpeg to extract a frame
  // For now, return a placeholder SVG
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#1a1a1a"/>
      <circle cx="200" cy="150" r="30" fill="white" opacity="0.8"/>
      <polygon points="190,135 190,165 215,150" fill="#1a1a1a"/>
    </svg>
  `;
  
  return Buffer.from(svg);
} 