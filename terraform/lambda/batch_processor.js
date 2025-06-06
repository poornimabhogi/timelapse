// lambda/batch_processor.js
const { DynamoDBClient, BatchGetItemCommand, BatchWriteItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDB = new DynamoDBClient({ region: process.env.REGION || 'us-east-1' });
const TIMELAPSE_TABLE = process.env.TIMELAPSE_TABLE || 'timelapseItems';
const INTERACTIONS_TABLE = process.env.INTERACTIONS_TABLE || 'interactions';
const COMMENT_TABLE = process.env.COMMENT_TABLE || 'comments';

/**
 * Handles batched operations for DynamoDB to improve performance and reduce costs
 */
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  // Extract operation type from the event
  const { operation, ...params } = event;
  
  try {
    switch (operation) {
      case 'batchGetTimelapses':
        return await batchGetTimelapses(params.ids);
      case 'batchGetUsers':
        return await batchGetUsers(params.ids);
      case 'batchUpdateLikes':
        return await batchUpdateLikes(params.inputs);
      case 'batchCreateComments':
        return await batchCreateComments(params.inputs);
      case 'batchIncrementViews':
        return await batchIncrementViews(params.targetIds);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Error in batch ${operation}:`, error);
    throw error;
  }
};

/**
 * Batch retrieve timelapse items by their IDs
 */
async function batchGetTimelapses(ids) {
  if (!ids || ids.length === 0) {
    return { items: [] };
  }
  
  console.log(`Batch getting ${ids.length} timelapse items`);
  
  // DynamoDB has a limit of 100 items per BatchGetItem
  const results = [];
  
  // Process in chunks of 100
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    
    const params = {
      RequestItems: {
        [TIMELAPSE_TABLE]: {
          Keys: chunk.map(id => marshall({ id }))
        }
      }
    };
    
    try {
      const response = await dynamoDB.send(new BatchGetItemCommand(params));
      
      if (response.Responses && response.Responses[TIMELAPSE_TABLE]) {
        const items = response.Responses[TIMELAPSE_TABLE].map(item => unmarshall(item));
        results.push(...items);
      }
      
      // Handle unprocessed keys if any
      if (response.UnprocessedKeys && 
          Object.keys(response.UnprocessedKeys).length > 0 &&
          response.UnprocessedKeys[TIMELAPSE_TABLE]) {
        console.warn('Some items were not processed. Consider implementing retry logic.');
      }
    } catch (error) {
      console.error('Error in BatchGetItem:', error);
    }
  }
  
  return { items: results };
}

/**
 * Batch retrieve users by their IDs
 */
async function batchGetUsers(ids) {
  if (!ids || ids.length === 0) {
    return { items: [] };
  }
  
  console.log(`Batch getting ${ids.length} users`);
  
  // Implementation similar to batchGetTimelapses, but for the User table
  // ...
  
  // Placeholder return until you implement the actual DynamoDB call
  return { 
    items: ids.map(id => ({
      id,
      username: `user_${id.substring(0, 8)}`,
      // Other default user fields...
    }))
  };
}

/**
 * Process batch likes updates efficiently
 */
async function batchUpdateLikes(inputs) {
  if (!inputs || inputs.length === 0) {
    return { successCount: 0, failedIds: [] };
  }
  
  console.log(`Processing ${inputs.length} like batches`);
  
  const successCount = 0;
  const failedIds = [];
  
  // Process each batch input (targetId and list of userIds)
  for (const input of inputs) {
    const { targetId, userIds } = input;
    
    if (!targetId || !userIds || userIds.length === 0) {
      failedIds.push(targetId || 'unknown');
      continue;
    }
    
    try {
      // Update the timelapse item's likes and likedBy fields
      const params = {
        TableName: TIMELAPSE_TABLE,
        Key: marshall({ id: targetId }),
        UpdateExpression: 'ADD likes :incr SET likedBy = list_append(if_not_exists(likedBy, :empty), :users)',
        ExpressionAttributeValues: marshall({
          ':incr': userIds.length,
          ':users': userIds,
          ':empty': []
        }),
        ReturnValues: 'UPDATED_NEW'
      };
      
      await dynamoDB.send(new UpdateItemCommand(params));
      successCount++;
    } catch (error) {
      console.error(`Error updating likes for target ${targetId}:`, error);
      failedIds.push(targetId);
    }
  }
  
  return { successCount, failedIds };
}

/**
 * Create comments in batch
 */
async function batchCreateComments(inputs) {
  if (!inputs || inputs.length === 0) {
    return { successCount: 0, failedComments: [] };
  }
  
  console.log(`Processing ${inputs.length} comments`);
  
  let successCount = 0;
  const failedComments = [];
  
  // Prepare batches of 25 (DynamoDB BatchWrite limit)
  for (let i = 0; i < inputs.length; i += 25) {
    const chunk = inputs.slice(i, i + 25);
    
    const putRequests = chunk.map(comment => {
      const { targetId, userId, content } = comment;
      
      // Create a new comment
      return {
        PutRequest: {
          Item: marshall({
            id: `comment_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            targetId,
            userId,
            content,
            createdAt: Date.now()
          })
        }
      };
    });
    
    try {
      const params = {
        RequestItems: {
          [COMMENT_TABLE]: putRequests
        }
      };
      
      const response = await dynamoDB.send(new BatchWriteItemCommand(params));
      
      // Count successful operations
      successCount += chunk.length;
      
      // Handle unprocessed items
      if (response.UnprocessedItems && 
          Object.keys(response.UnprocessedItems).length > 0 &&
          response.UnprocessedItems[COMMENT_TABLE]) {
        // Add unprocessed items to failed list
        const unprocessed = response.UnprocessedItems[COMMENT_TABLE];
        for (const item of unprocessed) {
          const originalItem = unmarshall(item.PutRequest.Item);
          failedComments.push({
            targetId: originalItem.targetId,
            userId: originalItem.userId,
            reason: 'Unprocessed in batch operation'
          });
        }
        
        // Reduce success count
        successCount -= unprocessed.length;
      }
    } catch (error) {
      console.error('Error in batch comment creation:', error);
      
      // Mark all items in this batch as failed
      for (const comment of chunk) {
        failedComments.push({
          targetId: comment.targetId,
          userId: comment.userId,
          reason: 'Batch operation failed'
        });
      }
      
      // No successful operations in this batch
      successCount -= chunk.length;
    }
  }
  
  return { successCount, failedComments };
}

/**
 * Increment view counts in batch
 */
async function batchIncrementViews(targetIds) {
  if (!targetIds || targetIds.length === 0) {
    return { successCount: 0, failedIds: [] };
  }
  
  console.log(`Incrementing views for ${targetIds.length} items`);
  
  let successCount = 0;
  const failedIds = [];
  
  // Process each item individually (could be optimized with a transaction)
  for (const targetId of targetIds) {
    try {
      const params = {
        TableName: TIMELAPSE_TABLE,
        Key: marshall({ id: targetId }),
        UpdateExpression: 'ADD views :incr',
        ExpressionAttributeValues: marshall({
          ':incr': 1
        })
      };
      
      await dynamoDB.send(new UpdateItemCommand(params));
      successCount++;
    } catch (error) {
      console.error(`Error incrementing views for ${targetId}:`, error);
      failedIds.push(targetId);
    }
  }
  
  return { successCount, failedIds };
}