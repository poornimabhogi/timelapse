import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { Observable } from 'zen-observable-ts';

// Create a GraphQL client
const client = generateClient();

// Define common types
export interface TimelapseItem {
  id?: string;
  userId: string;
  mediaUrl: string;
  type: 'photo' | 'video';
  createdAt: number;
  description?: string;
  likes: number;
  likedBy: string[];
  duration?: number;
}

// GraphQL queries and mutations
const createTimelapseItemMutation = `
  mutation CreateTimelapseItem(
    $userId: ID!
    $mediaUrl: String!
    $type: String!
    $createdAt: AWSTimestamp!
    $description: String
    $likes: Int!
    $likedBy: [String]
    $duration: Int
  ) {
    createTimelapseItem(input: {
      userId: $userId
      mediaUrl: $mediaUrl
      type: $type
      createdAt: $createdAt
      description: $description
      likes: $likes
      likedBy: $likedBy
      duration: $duration
    }) {
      id
      userId
      mediaUrl
      type
      createdAt
      description
      likes
      likedBy
      duration
    }
  }
`;

const listTimelapseItemsQuery = `
  query ListTimelapseItems(
    $userId: ID
    $limit: Int
    $nextToken: String
  ) {
    listTimelapseItems(
      userId: $userId
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        userId
        mediaUrl
        type
        createdAt
        description
        likes
        likedBy
        duration
      }
      nextToken
    }
  }
`;

const onCreateTimelapseItemSubscription = `
  subscription OnCreateTimelapseItem($userId: ID) {
    onCreateTimelapseItem(userId: $userId) {
      id
      userId
      mediaUrl
      type
      createdAt
      description
      likes
      likedBy
      duration
    }
  }
`;

const updateTimelapseItemMutation = `
  mutation UpdateTimelapseItem(
    $id: ID!
    $likes: Int
    $likedBy: [String]
    $description: String
  ) {
    updateTimelapseItem(input: {
      id: $id
      likes: $likes
      likedBy: $likedBy
      description: $description
    }) {
      id
      likes
      likedBy
      description
    }
  }
`;

const deleteTimelapseItemMutation = `
  mutation DeleteTimelapseItem($id: ID!) {
    deleteTimelapseItem(input: { id: $id }) {
      id
    }
  }
`;

// Service functions that replace Firestore operations
export const dynamodbService = {
  // Add a new timelapse item (replaces addDoc from Firestore)
  async createTimelapseItem(item: Omit<TimelapseItem, 'id'>): Promise<TimelapseItem> {
    try {
      const response = await client.graphql({
        query: createTimelapseItemMutation,
        variables: {
          userId: item.userId,
          mediaUrl: item.mediaUrl,
          type: item.type,
          createdAt: item.createdAt,
          description: item.description || '',
          likes: item.likes,
          likedBy: item.likedBy || [],
          duration: item.duration || 0
        }
      });

      return response.data.createTimelapseItem;
    } catch (error) {
      console.error('Error creating timelapse item:', error);
      throw error;
    }
  },

  // Get timelapse items for a user (replaces query + onSnapshot from Firestore)
  async getTimelapseItems(userId: string, limit = 100): Promise<TimelapseItem[]> {
    try {
      const response = await client.graphql({
        query: listTimelapseItemsQuery,
        variables: { userId, limit }
      });

      return response.data.listTimelapseItems.items;
    } catch (error) {
      console.error('Error getting timelapse items:', error);
      throw error;
    }
  },

  // Subscribe to new timelapse items (replaces onSnapshot from Firestore)
  subscribeToTimelapseItems(userId: string, onNext: (item: TimelapseItem) => void): { unsubscribe: () => void } {
    const subscription = client.graphql({
      query: onCreateTimelapseItemSubscription,
      variables: { userId }
    }).subscribe({
      next: (response) => {
        const newItem = response.data.onCreateTimelapseItem;
        onNext(newItem);
      },
      error: (error) => console.error('Subscription error:', error)
    });

    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  },

  // Update timelapse item (replaces updateDoc from Firestore)
  async updateTimelapseItem(id: string, data: Partial<TimelapseItem>): Promise<Partial<TimelapseItem>> {
    try {
      const response = await client.graphql({
        query: updateTimelapseItemMutation,
        variables: {
          id,
          ...data
        }
      });

      return response.data.updateTimelapseItem;
    } catch (error) {
      console.error('Error updating timelapse item:', error);
      throw error;
    }
  },

  // Delete timelapse item (replaces deleteDoc from Firestore)
  async deleteTimelapseItem(id: string): Promise<{ id: string }> {
    try {
      const response = await client.graphql({
        query: deleteTimelapseItemMutation,
        variables: { id }
      });

      return response.data.deleteTimelapseItem;
    } catch (error) {
      console.error('Error deleting timelapse item:', error);
      throw error;
    }
  },

  // Helper to get the current user ID
  async getCurrentUserId(): Promise<string> {
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }
}; 