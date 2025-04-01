const AWS = require('aws-sdk');
const sharp = require('sharp');
const path = require('path');
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const THUMBNAIL_SIZES = process.env.THUMBNAIL_SIZES 
  ? process.env.THUMBNAIL_SIZES.split(',').map(size => parseInt(size, 10))
  : [200, 400, 800];

/**
 * Lambda function to process media files uploaded to S3
 */
exports.handler = async (event) => {
  try {
    console.log('Processing event:', JSON.stringify(event, null, 2));
    
    // Get the S3 bucket and key from the event
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    
    // Validate the file is in the uploads folder
    if (!key.startsWith('uploads/')) {
      console.log('Not processing file outside of uploads folder:', key);
      return { status: 'skipped', message: 'File not in uploads folder' };
    }
    
    // Extract user ID and file name from the key
    // Expected format: uploads/USER_ID/FILE_NAME
    const keyParts = key.split('/');
    if (keyParts.length < 3) {
      console.log('Invalid key format:', key);
      return { status: 'error', message: 'Invalid key format' };
    }
    
    const userId = keyParts[1];
    const fileName = keyParts[keyParts.length - 1];
    const fileExt = path.extname(fileName).toLowerCase();
    const fileNameWithoutExt = path.basename(fileName, fileExt);
    
    // Check if the file is an image (for this example, we'll only process images)
    const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExt);
    const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(fileExt);
    
    if (!isImage && !isVideo) {
      console.log('Not processing non-media file:', fileName);
      return { status: 'skipped', message: 'Not a media file' };
    }
    
    // Get the original file from S3
    const s3Object = await s3.getObject({
      Bucket: bucket,
      Key: key
    }).promise();
    
    let metadata;
    let processedKey;
    let thumbnailKey;
    
    if (isImage) {
      // Process image and create thumbnails
      metadata = await processImage(s3Object.Body, bucket, userId, fileNameWithoutExt, fileExt);
      processedKey = `processed/${userId}/${fileNameWithoutExt}${fileExt}`;
      thumbnailKey = `thumbnails/${userId}/${fileNameWithoutExt}_${THUMBNAIL_SIZES[0]}${fileExt}`;
    } else if (isVideo) {
      // For videos, we would use a more sophisticated pipeline
      // For this example, we'll just copy the video to the processed folder
      metadata = await processVideo(s3Object.Body, bucket, userId, fileNameWithoutExt, fileExt);
      processedKey = `processed/${userId}/${fileNameWithoutExt}${fileExt}`;
      thumbnailKey = `thumbnails/${userId}/${fileNameWithoutExt}_thumbnail.jpg`;
    }
    
    // Update the DynamoDB table with the media information
    const timestamp = new Date().getTime();
    const postId = `post_${timestamp}_${userId}`;
    
    await dynamoDB.put({
      TableName: process.env.POSTS_TABLE,
      Item: {
        postId: postId,
        userId: userId,
        createdAt: timestamp,
        type: 'TIMELAPSE', // or FEATURE, depending on your app's logic
        mediaUrl: `s3://${bucket}/${processedKey}`,
        thumbnailUrl: `s3://${bucket}/${thumbnailKey}`,
        hasVideo: isVideo,
        metadata: metadata,
        status: 'PROCESSED'
      }
    }).promise();
    
    return {
      status: 'success',
      message: 'Media processed successfully',
      data: {
        postId,
        userId,
        mediaUrl: `s3://${bucket}/${processedKey}`,
        thumbnailUrl: `s3://${bucket}/${thumbnailKey}`
      }
    };
  } catch (error) {
    console.error('Error processing media:', error);
    return {
      status: 'error',
      message: error.message,
      stack: error.stack
    };
  }
};

/**
 * Process an image file, create thumbnails, and optimize for web
 */
async function processImage(imageBuffer, bucket, userId, fileName, fileExt) {
  const metadata = await sharp(imageBuffer).metadata();
  
  // Optimize original image
  const optimizedImageBuffer = await sharp(imageBuffer)
    .withMetadata()
    .toBuffer();
  
  // Upload optimized original to processed folder
  await s3.putObject({
    Bucket: bucket,
    Key: `processed/${userId}/${fileName}${fileExt}`,
    Body: optimizedImageBuffer,
    ContentType: `image/${fileExt.replace('.', '')}`
  }).promise();
  
  // Create and upload thumbnails
  for (const size of THUMBNAIL_SIZES) {
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(size)
      .withMetadata()
      .toBuffer();
    
    await s3.putObject({
      Bucket: bucket,
      Key: `thumbnails/${userId}/${fileName}_${size}${fileExt}`,
      Body: thumbnailBuffer,
      ContentType: `image/${fileExt.replace('.', '')}`
    }).promise();
  }
  
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size
  };
}

/**
 * Process a video file (placeholder for actual video processing)
 */
async function processVideo(videoBuffer, bucket, userId, fileName, fileExt) {
  // In a real-world scenario, you'd use ffmpeg or a video processing service
  // For this example, we'll just copy the video to the processed folder
  
  await s3.putObject({
    Bucket: bucket,
    Key: `processed/${userId}/${fileName}${fileExt}`,
    Body: videoBuffer,
    ContentType: `video/${fileExt.replace('.', '')}`
  }).promise();
  
  // In a real implementation, you'd extract a thumbnail from the video
  // Here we'll create a placeholder thumbnail
  const placeholderThumbnail = Buffer.from(
    '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#333"/><text x="50%" y="50%" font-family="Arial" font-size="24" fill="#fff" text-anchor="middle">Video Thumbnail</text></svg>'
  );
  
  await s3.putObject({
    Bucket: bucket,
    Key: `thumbnails/${userId}/${fileName}_thumbnail.jpg`,
    Body: placeholderThumbnail,
    ContentType: 'image/svg+xml'
  }).promise();
  
  return {
    format: fileExt.replace('.', ''),
    duration: 0, // In a real implementation, you'd extract the duration
    size: videoBuffer.length
  };
} 