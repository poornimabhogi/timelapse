// Enhanced Media Processing Service for automatic S3 operations and real-time updates
import { uploadToS3 } from '../utils/s3Upload';
import { apolloClient } from './aws-config';
import { gql } from '@apollo/client';
import { Alert } from 'react-native';

export interface MediaProcessingResult {
  success: boolean;
  processedUrl?: string;
  thumbnailUrls?: string[];
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    size?: number;
  };
}

export interface MediaItem {
  id: string;
  uri: string;
  type: 'photo' | 'video' | 'product' | 'document';
  category: 'timelapse' | 'feature_post' | 'product_image' | 'profile_image' | 'verification_doc';
  userId: string;
  metadata?: any;
}

export interface S3Object {
  bucket: string;
  key: string;
  url: string;
}

// GraphQL mutations for media operations
const DELETE_S3_OBJECT = gql`
  mutation DeleteS3Object($bucket: String!, $key: String!) {
    deleteS3Object(bucket: $bucket, key: $key) {
      success
      message
    }
  }
`;

const PROCESS_MEDIA = gql`
  mutation ProcessMedia($input: ProcessMediaInput!) {
    processMedia(input: $input) {
      success
      processedUrl
      thumbnailUrls
      metadata {
        width
        height
        duration
        format
        size
      }
    }
  }
`;

const UPDATE_MEDIA_STATUS = gql`
  mutation UpdateMediaStatus($mediaId: String!, $status: String!, $processedData: AWSJSON) {
    updateMediaStatus(mediaId: $mediaId, status: $status, processedData: $processedData) {
      success
      message
    }
  }
`;

class MediaProcessorService {
  private processingQueue: MediaItem[] = [];
  private isProcessing = false;
  private cleanupQueue: S3Object[] = [];

  /**
   * Process media upload with automatic optimization and thumbnail generation
   */
  async processMediaUpload(
    file: { uri: string; type: string; name: string },
    category: MediaItem['category'],
    userId: string,
    metadata?: any
  ): Promise<MediaProcessingResult> {
    try {
      console.log(`🔄 Processing ${category} upload for user ${userId}`);
      
      // 1. Upload original to S3
      const originalUrl = await uploadToS3(file, this.getFolderForCategory(category));
      console.log(`✅ Original uploaded: ${originalUrl}`);

      // 2. Trigger automatic processing via Lambda
      const processingResult = await this.triggerMediaProcessing({
        originalUrl,
        type: file.type,
        category,
        userId,
        metadata
      });

      if (processingResult.success) {
        console.log(`✅ Processing completed for ${category}`);
        return {
          success: true,
          processedUrl: processingResult.processedUrl,
          thumbnailUrls: processingResult.thumbnailUrls,
          metadata: processingResult.metadata
        };
      }

      // Fallback: return original if processing fails
      return {
        success: true,
        processedUrl: originalUrl,
        metadata: metadata
      };

    } catch (error) {
      console.error(`❌ Error processing ${category} upload:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle media updates (replace existing media with new versions)
   */
  async updateMedia(
    mediaId: string,
    newFile: { uri: string; type: string; name: string },
    oldMediaUrls: string[],
    category: MediaItem['category'],
    userId: string
  ): Promise<MediaProcessingResult> {
    try {
      console.log(`🔄 Updating ${category} media: ${mediaId}`);

      // 1. Process new media
      const uploadResult = await this.processMediaUpload(newFile, category, userId);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload new media');
      }

      // 2. Schedule cleanup of old media (async to avoid blocking UI)
      this.scheduleMediaCleanup(oldMediaUrls, `update-${mediaId}`);

      // 3. Update media status in database
      await this.updateMediaStatus(mediaId, 'updated', uploadResult);

      console.log(`✅ Media update completed: ${mediaId}`);
      return uploadResult;

    } catch (error) {
      console.error(`❌ Error updating media ${mediaId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Handle media deletion with S3 cleanup
   */
  async deleteMedia(
    mediaId: string,
    mediaUrls: string[],
    category: MediaItem['category']
  ): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting ${category} media: ${mediaId}`);

      // 1. Schedule S3 cleanup
      this.scheduleMediaCleanup(mediaUrls, `delete-${mediaId}`);

      // 2. Update media status to deleted
      await this.updateMediaStatus(mediaId, 'deleted', { deletedAt: new Date().toISOString() });

      console.log(`✅ Media deletion scheduled: ${mediaId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error deleting media ${mediaId}:`, error);
      return false;
    }
  }

  /**
   * Batch delete multiple media items (for profile screen bulk operations)
   */
  async batchDeleteMedia(
    mediaItems: { id: string; urls: string[]; category: MediaItem['category'] }[]
  ): Promise<{ success: boolean; failed: string[] }> {
    console.log(`🗑️ Batch deleting ${mediaItems.length} media items`);
    
    const failed: string[] = [];
    
    // Process deletions in parallel for better performance
    const deletePromises = mediaItems.map(async (item) => {
      try {
        const success = await this.deleteMedia(item.id, item.urls, item.category);
        if (!success) {
          failed.push(item.id);
        }
      } catch (error) {
        console.error(`Failed to delete ${item.id}:`, error);
        failed.push(item.id);
      }
    });

    await Promise.allSettled(deletePromises);

    console.log(`✅ Batch deletion completed. Failed: ${failed.length}/${mediaItems.length}`);
    return {
      success: failed.length === 0,
      failed
    };
  }

  /**
   * Process inventory updates for local shop (product images don't change, just metadata)
   */
  async updateInventory(
    productId: string,
    inventoryData: {
      oldInventory: number;
      newInventory: number;
      change: number;
      reason?: string;
    }
  ): Promise<boolean> {
    try {
      console.log(`📦 Updating inventory for product ${productId}: ${inventoryData.oldInventory} → ${inventoryData.newInventory}`);

      // Trigger real-time notification without changing media files
      const updateData = {
        productId,
        ...inventoryData,
        timestamp: new Date().toISOString()
      };

      await this.updateMediaStatus(productId, 'inventory_updated', updateData);
      
      console.log(`✅ Inventory update processed: ${productId}`);
      return true;

    } catch (error) {
      console.error(`❌ Error updating inventory for ${productId}:`, error);
      return false;
    }
  }

  /**
   * Schedule cleanup of S3 objects (async to avoid blocking UI)
   */
  private scheduleMediaCleanup(mediaUrls: string[], operation: string) {
    const s3Objects = mediaUrls.map(url => this.parseS3Url(url)).filter(obj => obj !== null) as S3Object[];
    
    if (s3Objects.length === 0) {
      console.log(`⚠️ No valid S3 URLs to cleanup for operation: ${operation}`);
      return;
    }

    console.log(`📋 Scheduled cleanup of ${s3Objects.length} S3 objects for: ${operation}`);
    this.cleanupQueue.push(...s3Objects);
    
    // Process cleanup queue asynchronously
    this.processCleanupQueue();
  }

  /**
   * Process S3 cleanup queue
   */
  private async processCleanupQueue() {
    if (this.cleanupQueue.length === 0) return;

    console.log(`🧹 Processing S3 cleanup queue: ${this.cleanupQueue.length} objects`);
    
    // Process in batches to avoid overwhelming AWS
    const batchSize = 10;
    while (this.cleanupQueue.length > 0) {
      const batch = this.cleanupQueue.splice(0, batchSize);
      
      await Promise.allSettled(
        batch.map(async (s3Object) => {
          try {
            await this.deleteS3Object(s3Object);
            console.log(`✅ Deleted S3 object: ${s3Object.key}`);
          } catch (error) {
            console.error(`❌ Failed to delete S3 object ${s3Object.key}:`, error);
          }
        })
      );

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ S3 cleanup queue processed`);
  }

  /**
   * Trigger media processing via GraphQL mutation to Lambda
   */
  private async triggerMediaProcessing(input: {
    originalUrl: string;
    type: string;
    category: string;
    userId: string;
    metadata?: any;
  }) {
    try {
      const response = await apolloClient.mutate({
        mutation: PROCESS_MEDIA,
        variables: { input }
      });

             return response.data?.processMedia || { success: false };
     } catch (error) {
       console.error('Error triggering media processing:', error);
       return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update media status in database
   */
  private async updateMediaStatus(mediaId: string, status: string, processedData: any) {
    try {
      await apolloClient.mutate({
        mutation: UPDATE_MEDIA_STATUS,
        variables: {
          mediaId,
          status,
          processedData: JSON.stringify(processedData)
        }
      });
    } catch (error) {
      console.error('Error updating media status:', error);
      throw error;
    }
  }

  /**
   * Delete S3 object via GraphQL
   */
  private async deleteS3Object(s3Object: S3Object) {
    try {
      await apolloClient.mutate({
        mutation: DELETE_S3_OBJECT,
        variables: {
          bucket: s3Object.bucket,
          key: s3Object.key
        }
      });
    } catch (error) {
      console.error(`Error deleting S3 object ${s3Object.key}:`, error);
      throw error;
    }
  }

  /**
   * Parse S3 URL to extract bucket and key
   */
  private parseS3Url(url: string): S3Object | null {
    try {
      const urlObj = new URL(url);
      
      // Handle both s3://bucket/key and https://bucket.s3.region.amazonaws.com/key formats
      if (url.startsWith('s3://')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        return {
          bucket: urlObj.hostname,
          key: pathParts.join('/'),
          url
        };
      } else if (url.includes('.s3.') && url.includes('.amazonaws.com')) {
        const bucket = urlObj.hostname.split('.')[0];
        const key = urlObj.pathname.substring(1); // Remove leading slash
        return {
          bucket,
          key,
          url
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing S3 URL:', url, error);
      return null;
    }
  }

  /**
   * Get S3 folder name based on media category
   */
  private getFolderForCategory(category: MediaItem['category']): string {
    const folderMap = {
      'timelapse': 'timelapses',
      'feature_post': 'feature_posts',
      'product_image': 'products',
      'profile_image': 'profiles',
      'verification_doc': 'verification'
    };
    
    return folderMap[category] || 'media';
  }

  /**
   * Get processing status of media item
   */
  async getProcessingStatus(mediaId: string): Promise<{
    status: string;
    progress?: number;
    error?: string;
  }> {
    try {
      const query = gql`
        query GetMediaStatus($mediaId: String!) {
          getMediaStatus(mediaId: $mediaId) {
            status
            progress
            error
            processedAt
          }
        }
      `;

      const response = await apolloClient.query({
        query,
        variables: { mediaId },
        fetchPolicy: 'network-only'
      });

             return response.data?.getMediaStatus || { status: 'unknown' };
     } catch (error) {
       console.error('Error getting processing status:', error);
       return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Clean up orphaned media files (files without database references)
   */
  async cleanupOrphanedMedia(userId: string): Promise<void> {
    try {
      console.log(`🧹 Starting orphaned media cleanup for user: ${userId}`);
      
      const mutation = gql`
        mutation CleanupOrphanedMedia($userId: String!) {
          cleanupOrphanedMedia(userId: $userId) {
            success
            deletedCount
            message
          }
        }
      `;

      const response = await apolloClient.mutate({
        mutation,
        variables: { userId }
      });

      const result = response.data?.cleanupOrphanedMedia;
      if (result?.success) {
        console.log(`✅ Cleaned up ${result.deletedCount} orphaned media files`);
      } else {
        console.log(`⚠️ Orphaned media cleanup completed with warnings`);
      }
    } catch (error) {
      console.error('Error during orphaned media cleanup:', error);
    }
  }
}

// Export singleton instance
export const mediaProcessor = new MediaProcessorService();

// Export utility functions for use in Profile Screen
export const ProfileMediaProcessor = {
  /**
   * Process timelapse upload/update/delete
   */
  async processTimelapseOperation(
    operation: 'upload' | 'update' | 'delete',
    data: {
      id?: string;
      file?: { uri: string; type: string; name: string };
      existingUrls?: string[];
      userId: string;
      metadata?: any;
    }
  ): Promise<MediaProcessingResult | boolean> {
    switch (operation) {
      case 'upload':
        if (!data.file) throw new Error('File required for upload');
        return await mediaProcessor.processMediaUpload(
          data.file,
          'timelapse',
          data.userId,
          data.metadata
        );
      
      case 'update':
        if (!data.id || !data.file || !data.existingUrls) {
          throw new Error('ID, file, and existing URLs required for update');
        }
        return await mediaProcessor.updateMedia(
          data.id,
          data.file,
          data.existingUrls,
          'timelapse',
          data.userId
        );
      
      case 'delete':
        if (!data.id || !data.existingUrls) {
          throw new Error('ID and existing URLs required for delete');
        }
        return await mediaProcessor.deleteMedia(data.id, data.existingUrls, 'timelapse');
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },

  /**
   * Process feature post upload/update/delete
   */
  async processFeaturePostOperation(
    operation: 'upload' | 'update' | 'delete',
    data: {
      id?: string;
      files?: { uri: string; type: string; name: string }[];
      existingUrls?: string[];
      userId: string;
      metadata?: any;
    }
  ): Promise<MediaProcessingResult[] | boolean> {
    if (operation === 'upload' && data.files) {
      // Process multiple files for feature posts
      const results = await Promise.all(
        data.files.map(file => 
          mediaProcessor.processMediaUpload(file, 'feature_post', data.userId, data.metadata)
        )
      );
      return results;
    }
    
         // Handle update/delete similar to timelapses
     const result = await ProfileMediaProcessor.processTimelapseOperation(operation, data);
     return Array.isArray(result) ? result : [result as MediaProcessingResult];
  },

  /**
   * Process local shop operations (product images and inventory)
   */
  async processLocalShopOperation(
    operation: 'product_upload' | 'product_update' | 'product_delete' | 'inventory_update',
    data: {
      productId?: string;
      files?: { uri: string; type: string; name: string }[];
      existingUrls?: string[];
      userId: string;
      inventoryData?: any;
      metadata?: any;
    }
  ): Promise<MediaProcessingResult[] | boolean> {
    switch (operation) {
      case 'product_upload':
        if (!data.files) throw new Error('Files required for product upload');
        const uploadResults = await Promise.all(
          data.files.map(file => 
            mediaProcessor.processMediaUpload(file, 'product_image', data.userId, data.metadata)
          )
        );
        return uploadResults;
      
      case 'product_update':
        if (!data.productId || !data.files || !data.existingUrls) {
          throw new Error('Product ID, files, and existing URLs required');
        }
        // For products with multiple images, we need to handle this differently
        const updateResults = await Promise.all(
          data.files.map(file => 
            mediaProcessor.processMediaUpload(file, 'product_image', data.userId, data.metadata)
          )
        );
        // Schedule cleanup of old images
        if (data.existingUrls.length > 0) {
          await mediaProcessor.deleteMedia(data.productId, data.existingUrls, 'product_image');
        }
        return updateResults;
      
      case 'product_delete':
        if (!data.productId || !data.existingUrls) {
          throw new Error('Product ID and existing URLs required');
        }
        return await mediaProcessor.deleteMedia(data.productId, data.existingUrls, 'product_image');
      
      case 'inventory_update':
        if (!data.productId || !data.inventoryData) {
          throw new Error('Product ID and inventory data required');
        }
        return await mediaProcessor.updateInventory(data.productId, data.inventoryData);
      
      default:
        throw new Error(`Unknown local shop operation: ${operation}`);
    }
  },

  /**
   * Batch operations for profile screen bulk actions
   */
  async batchDeleteTimelapses(
    timelapseItems: { id: string; urls: string[] }[]
  ): Promise<{ success: boolean; failed: string[] }> {
    const mediaItems = timelapseItems.map(item => ({
      id: item.id,
      urls: item.urls,
      category: 'timelapse' as const
    }));
    
    return await mediaProcessor.batchDeleteMedia(mediaItems);
  }
}; 