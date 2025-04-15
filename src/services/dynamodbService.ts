import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import awsconfig from '../aws-exports';
import { EventEmitter } from 'events';
import { Observable } from 'zen-observable-ts';
import { GraphQLResult } from '@aws-amplify/api';
import { Amplify } from 'aws-amplify';

// Ensure Amplify is configured with the correct settings
   // In your configuration
   Amplify.configure(awsconfig);

// Define the User type
export type User = {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  following?: string[];
  followers?: string[];
  createdAt?: string;
};

// Create a GraphQL client
const client = generateClient();

// Define types for GraphQL responses
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Global event manager for data updates
type DataUpdateListener = () => void;
interface DataUpdateManager {
  listeners: Map<string, Set<DataUpdateListener>>;
  addListener: (eventType: string, listener: DataUpdateListener) => void;
  removeListener: (eventType: string, listener: DataUpdateListener) => void;
  notifyListeners: (eventType: string) => void;
}

// Global cache for last created items to ensure consistency between screens
const lastCreatedItems: Record<string, TimelapseItem> = {};

// Helper function to safely add item to the cache
function addItemToCache(item: TimelapseItem) {
  if (item && item.id) {
    lastCreatedItems[item.id] = item;
    
    // Only keep the last 20 items in cache
    const keys = Object.keys(lastCreatedItems);
    if (keys.length > 20) {
      delete lastCreatedItems[keys[0]];
    }
  }
}

export const dataUpdateManager: DataUpdateManager = {
  listeners: new Map<string, Set<DataUpdateListener>>(),
  
  addListener(eventType: string, listener: DataUpdateListener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(listener);
    console.log(`Added listener for ${eventType}, total: ${this.listeners.get(eventType)?.size}`);
    
    // Immediately send any cached updates for this event type
    // This ensures screens get the latest data when they mount
    if (eventType === 'timelapses-updated' && Object.keys(lastCreatedItems).length > 0) {
      console.log(`Sending cached updates to new listener for ${eventType}`);
      setTimeout(() => {
        listener();
      }, 100);
    }
  },
  
  removeListener(eventType: string, listener: DataUpdateListener) {
    this.listeners.get(eventType)?.delete(listener);
    console.log(`Removed listener for ${eventType}, remaining: ${this.listeners.get(eventType)?.size}`);
  },
  
  notifyListeners(eventType: string) {
    console.log(`Notifying listeners for ${eventType}, count: ${this.listeners.get(eventType)?.size || 0}`);
    
    // Add a small delay to ensure the database has time to update
    setTimeout(() => {
      this.listeners.get(eventType)?.forEach(listener => {
        try {
          console.log(`Executing listener for ${eventType}`);
          listener();
        } catch (error) {
          console.error(`Error in listener for ${eventType}:`, error);
        }
      });
    }, 300);
  }
};

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

// Define input types to match GraphQL schema
export interface CreateTimelapseItemInput {
  userId: string;
  mediaUrl: string;
  type: string;
  createdAt: number;
  description?: string;
  likes: number;
  likedBy: string[];
  duration?: number;
}

export interface UpdateTimelapseItemInput {
  id: string;
  likes?: number;
  likedBy?: string[];
  description?: string;
}

export interface DeleteTimelapseItemInput {
  id: string;
}

// GraphQL queries and mutations
const createTimelapseItemMutation = `
  mutation CreateTimelapseItem($input: CreateTimelapseItemInput!) {
    createTimelapseItem(input: $input) {
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
  query ListTimelapseItems($userId: ID!, $limit: Int, $nextToken: String) {
    listTimelapseItems(userId: $userId, limit: $limit, nextToken: $nextToken) {
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

const updateTimelapseItemMutation = `
  mutation UpdateTimelapseItem($input: UpdateTimelapseItemInput!) {
    updateTimelapseItem(input: $input) {
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

const deleteTimelapseItemMutation = `
  mutation DeleteTimelapseItem($input: DeleteTimelapseItemInput!) {
    deleteTimelapseItem(input: $input) {
      id
    }
  }
`;

// Service functions that replace Firestore operations
export const dynamodbService = {
  // Add a new timelapse item (replaces addDoc from Firestore)
  async createTimelapseItem(item: Omit<TimelapseItem, 'id'>): Promise<TimelapseItem> {
    try {
      console.log('Creating timelapse with data:', JSON.stringify(item, null, 2));
      
      // Validate required fields before sending to API
      if (!item.userId) {
        console.error('Error: Missing required field userId');
        throw new Error('userId is required');
      }
      
      if (!item.mediaUrl) {
        console.error('Error: Missing required field mediaUrl');
        throw new Error('mediaUrl is required');
      }
      
      if (!item.type) {
        console.error('Error: Missing required field type');
        throw new Error('type is required');
      }
      
      if (!item.createdAt) {
        console.error('Error: Missing required field createdAt');
        throw new Error('createdAt is required');
      }
      
      // Make sure we have all the required fields for the input
      const input: CreateTimelapseItemInput = {
        userId: item.userId,
        mediaUrl: item.mediaUrl,
        type: item.type,
        createdAt: item.createdAt,
        description: item.description || '',
        likes: item.likes || 0,
        likedBy: item.likedBy || [],
        duration: item.duration || 0
      };
      
      console.log('Formatted input:', JSON.stringify(input, null, 2));
      
      // First check if the user exists to avoid reference errors
      const userExists = await checkUserExists(item.userId);
      if (!userExists) {
        console.warn('User does not exist in DynamoDB, creating a minimal user record first');
        try {
          // Create a minimal user record
          await client.graphql({
            query: `
              mutation CreateUser($username: String!, $name: String, $bio: String, $avatar: String) {
                createUser(username: $username, name: $name, bio: $bio, avatar: $avatar) {
                  id
                  username
                }
              }
            `,
            variables: {
              username: `user_${item.userId.substring(0, 8)}`,
              name: `User ${item.userId.substring(0, 5)}`,
              bio: '',
              avatar: ''
            }
          });
          console.log('Created minimal user record');
        } catch (userError) {
          console.error('Failed to create user record:', userError);
          // Continue with the timelapse creation anyway
        }
      }
      
      const response = await client.graphql({
        query: createTimelapseItemMutation,
        variables: {
          input
        }
      }) as GraphQLResult<{
        createTimelapseItem: TimelapseItem;
      }>;

      console.log('Create timelapse response:', JSON.stringify(response, null, 2));
      
      // Add null check and validation
      if (!response?.data?.createTimelapseItem) {
        console.error('Invalid response from createTimelapseItem mutation:', response);
        
        if (response?.errors) {
          console.error('GraphQL errors:', JSON.stringify(response.errors, null, 2));
          
          // If there are specific errors, throw with details
          if (response.errors.length > 0) {
            throw new Error(`GraphQL error: ${response.errors[0].message}`);
          }
        }
        
        throw new Error('Failed to create timelapse item');
      }

      // Create a properly structured item with ID to ensure consistency
      const createdItem: TimelapseItem = {
        id: response.data.createTimelapseItem.id,
        userId: response.data.createTimelapseItem.userId,
        mediaUrl: response.data.createTimelapseItem.mediaUrl, 
        type: response.data.createTimelapseItem.type,
        createdAt: response.data.createTimelapseItem.createdAt,
        description: response.data.createTimelapseItem.description || '',
        likes: response.data.createTimelapseItem.likes || 0,
        likedBy: response.data.createTimelapseItem.likedBy || [],
        duration: response.data.createTimelapseItem.duration || 0
      };

      // Store the created item in our cache
      addItemToCache(createdItem);
      
      console.log('Created new timelapse item with ID:', createdItem.id);
      
      // Notify for general timelapses
      dataUpdateManager.notifyListeners('timelapses-updated');
      
      // Notify for user-specific timelapses
      dataUpdateManager.notifyListeners(`user-timelapses-${item.userId}`);

      return createdItem;
    } catch (error) {
      console.error('Error creating timelapse item:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      } else {
        console.error('Unknown error type:', error);
      }
      
      // Create a fallback item with a temporary ID
      const fallbackItem: TimelapseItem = {
        id: `temp-${Date.now()}`,
        userId: item.userId,
        mediaUrl: item.mediaUrl,
        type: item.type,
        createdAt: item.createdAt,
        description: item.description || '',
        likes: item.likes || 0,
        likedBy: item.likedBy || [],
        duration: item.duration || 0
      };
      
      console.warn('Error in DynamoDB, using fallback item with temporary ID');
      return fallbackItem;
    }
  },

  // Get timelapse items for a user (replaces query + onSnapshot from Firestore)
  async getTimelapseItems(userId: string, limit = 100): Promise<TimelapseItem[]> {
    if (!userId) {
      console.error('Error: No userId provided to getTimelapseItems');
      return [];
    }
    
    try {
      console.log(`Fetching timelapse items for user ${userId}, limit: ${limit}`);
      
      const response = await client.graphql({
        query: listTimelapseItemsQuery,
        variables: { userId, limit }
      }) as GraphQLResult<{
        listTimelapseItems: {
          items: TimelapseItem[];
          nextToken?: string;
        }
      }>;

      if (response?.data?.listTimelapseItems?.items) {
        const items = response.data.listTimelapseItems.items;
        console.log(`Successfully fetched ${items.length} timelapse items for user ${userId}`);
        return items;
      } else {
        console.log(`No items found in response for user ${userId}`);
        if (response?.errors) {
          console.error('GraphQL errors:', JSON.stringify(response.errors, null, 2));
        }
        return [];
      }
    } catch (error) {
      console.error(`Error getting timelapse items for user ${userId}:`, error);
      // Try to extract useful error message
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      } else {
        console.error('Unknown error type:', JSON.stringify(error, null, 2));
      }
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  // Update timelapse item (replaces updateDoc from Firestore)
  async updateTimelapseItem(id: string, data: Partial<Omit<TimelapseItem, 'id'>>): Promise<Partial<TimelapseItem>> {
    try {
      console.log('Updating timelapse:', id, 'with data:', JSON.stringify(data, null, 2));
      
      const input: UpdateTimelapseItemInput = {
        id,
        ...data
      };
      
      const response = await client.graphql({
        query: updateTimelapseItemMutation,
        variables: {
          input
        }
      }) as GraphQLResult<{
        updateTimelapseItem: Partial<TimelapseItem>;
      }>;

      console.log('Update response:', JSON.stringify(response, null, 2));
      if (!response.data?.updateTimelapseItem) {
        throw new Error('Failed to update timelapse item');
      }
      
      return response.data.updateTimelapseItem;
    } catch (error) {
      console.error('Error updating timelapse item:', error);
      throw error;
    }
  },

  // Subscribe to new timelapse items with polling instead of GraphQL subscriptions
  subscribeToTimelapseItems(userId: string, onNext: (item: TimelapseItem) => void): { unsubscribe: () => void } {
    console.log('Setting up polling for timelapse items for user:', userId);
    
    // Track the last timelapse ID we've seen to detect new ones
    let lastKnownItems: Record<string, boolean> = {};
    let isPolling = true;
    
    // Initialize with current items
    this.getTimelapseItems(userId)
      .then(items => {
        if (items && items.length > 0) {
          // Mark all existing items as known
          items.forEach(item => {
            if (item.id) {
              lastKnownItems[item.id] = true;
            }
          });
        }
      })
      .catch(err => console.error('Error initializing timelapse polling:', err));
    
    // Set up polling
    const pollInterval = setInterval(async () => {
      if (!isPolling) {
        clearInterval(pollInterval);
        return;
      }
      
      try {
        const items = await this.getTimelapseItems(userId);
        
        // Check for new items
        if (items && items.length > 0) {
          items.forEach(item => {
            if (item.id && !lastKnownItems[item.id]) {
              // This is a new item we haven't seen before
              lastKnownItems[item.id] = true;
              onNext(item);
            }
          });
        }
      } catch (error) {
        console.error('Error polling for timelapse items:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    // Return unsubscribe function
    return {
      unsubscribe: () => {
        console.log('Stopping timelapse polling for user:', userId);
        isPolling = false;
        clearInterval(pollInterval);
      }
    };
  },

  // Delete timelapse item (replaces deleteDoc from Firestore)
  async deleteTimelapseItem(id: string): Promise<{ id: string }> {
    try {
      console.log('Deleting timelapse:', id);
      
      const input: DeleteTimelapseItemInput = { id };
      
      const response = await client.graphql({
        query: deleteTimelapseItemMutation,
        variables: {
          input
        }
      }) as GraphQLResult<{
        deleteTimelapseItem: { id: string };
      }>;
      
      console.log('Delete response:', JSON.stringify(response, null, 2));
      if (!response.data?.deleteTimelapseItem) {
        throw new Error('Failed to delete timelapse item');
      }
      
      return { id: response.data.deleteTimelapseItem.id };
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
  },

  // Add a function to get timelapses from user's followed accounts
  async getFollowingTimelapseItems(userId: string): Promise<TimelapseItem[]> {
    try {
      // First, get the list of users that the current user follows
      const userResponse = await client.graphql({
        query: `
          query GetUser($id: ID!) {
            getUser(id: $id) {
              id
              following
            }
          }
        `,
        variables: {
          id: userId,
        },
      }) as GraphQLResult<{
        getUser: {
          id: string;
          following: string[];
        } | null;
      }>;

      if (!userResponse.data?.getUser) {
        console.log("User not found or has no following list");
        return [];
      }

      const followingIds = userResponse.data.getUser.following || [];
      
      if (followingIds.length === 0) {
        console.log("User is not following anyone");
        return [];
      }

      // Now get timelapses from these users
      const response = await client.graphql({
        query: `
          query ListTimelapseItems($filter: ModelTimelapseItemFilterInput!) {
            listTimelapseItems(filter: $filter) {
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
            }
          }
        `,
        variables: {
          filter: {
            userId: {
              in: followingIds
            }
          },
        },
      }) as GraphQLResult<{
        listTimelapseItems: {
          items: TimelapseItem[];
        };
      }>;

      if (!response.data?.listTimelapseItems?.items) {
        return [];
      }

      return response.data.listTimelapseItems.items;
    } catch (error) {
      console.error('Error fetching following timelapses:', error);
      throw error;
    }
  },

  // Function to follow a user
  async followUser(currentUserId: string, userToFollowId: string): Promise<boolean> {
    try {
      // First get current user to update their following list
      const userResponse = await client.graphql({
        query: `
          query GetUser($id: ID!) {
            getUser(id: $id) {
              id
              following
            }
          }
        `,
        variables: {
          id: currentUserId,
        },
      }) as GraphQLResult<{
        getUser: {
          id: string;
          following: string[];
        } | null;
      }>;

      if (!userResponse.data?.getUser) {
        console.log("Current user not found");
        return false;
      }

      const currentFollowing = userResponse.data.getUser.following || [];
      
      // Check if already following
      if (currentFollowing.includes(userToFollowId)) {
        console.log("Already following this user");
        return true;
      }
      
      // Update the following list
      const updatedFollowing = [...currentFollowing, userToFollowId];
      
      // Update user record
      const updateResponse = await client.graphql({
        query: `
          mutation UpdateUser($input: UpdateUserInput!) {
            updateUser(input: $input) {
              id
              following
            }
          }
        `,
        variables: {
          input: {
            id: currentUserId,
            following: updatedFollowing
          }
        },
      }) as GraphQLResult<{
        updateUser: {
          id: string;
          following: string[];
        };
      }>;
      
      console.log("Follow successful:", updateResponse.data?.updateUser);
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  },

  // Function to unfollow a user
  async unfollowUser(currentUserId: string, userToUnfollowId: string): Promise<boolean> {
    try {
      // First get current user to update their following list
      const userResponse = await client.graphql({
        query: `
          query GetUser($id: ID!) {
            getUser(id: $id) {
              id
              following
            }
          }
        `,
        variables: {
          id: currentUserId,
        },
      }) as GraphQLResult<{
        getUser: {
          id: string;
          following: string[];
        } | null;
      }>;

      if (!userResponse.data?.getUser) {
        console.log("Current user not found");
        return false;
      }

      const currentFollowing = userResponse.data.getUser.following || [];
      
      // Check if not following
      if (!currentFollowing.includes(userToUnfollowId)) {
        console.log("Not following this user");
        return true;
      }
      
      // Update the following list
      const updatedFollowing = currentFollowing.filter(id => id !== userToUnfollowId);
      
      // Update user record
      const updateResponse = await client.graphql({
        query: `
          mutation UpdateUser($input: UpdateUserInput!) {
            updateUser(input: $input) {
              id
              following
            }
          }
        `,
        variables: {
          input: {
            id: currentUserId,
            following: updatedFollowing
          }
        },
      }) as GraphQLResult<{
        updateUser: {
          id: string;
          following: string[];
        };
      }>;
      
      console.log("Unfollow successful:", updateResponse.data?.updateUser);
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }
};

// Add a function to initialize a new user in DynamoDB
export const initializeUserInDynamoDB = async (userId: string, username: string, email: string): Promise<User | null> => {
  try {
    console.log('Initializing user in DynamoDB with:', { userId, username, email });
    
    // Test GraphQL connection first
    const isConnected = await testGraphQLConnection();
    if (!isConnected) {
      console.error('GraphQL connection test failed, cannot create user');
      return null;
    }
    
    // First check if user already exists
    const userExists = await checkUserExists(userId);
    if (userExists) {
      console.log('User already exists in DynamoDB, skipping creation');
      return null;
    }
    
    // Use email as part of username if no username is provided
    const displayUsername = username || email.split('@')[0];
    const displayName = username || `User ${userId.substring(0, 5)}`;
    
    console.log('Creating user with username:', displayUsername);
    
    try {
      // Use the original username directly if possible to maintain the user's chosen name
      // This will be the username they entered during registration
      const finalUsername = username || `user_${userId.substring(0, 8)}`;
      
      console.log('Using final username for creation:', finalUsername);
      
      const createUserQuery = `
        mutation CreateUser($username: String!, $name: String, $bio: String, $avatar: String) {
          createUser(username: $username, name: $name, bio: $bio, avatar: $avatar) {
            id
            username
            name
          }
        }
      `;
      
      const variables = {
        username: finalUsername,
        name: displayName,
        bio: '',
        avatar: ''
      };
      
      console.log('Executing createUser mutation with variables:', JSON.stringify(variables, null, 2));
      
      const createUserResponse = await client.graphql({
        query: createUserQuery,
        variables: variables
      }) as GraphQLResult<{
        createUser: User;
      }>;
      
      console.log('Create user response full:', JSON.stringify(createUserResponse, null, 2));
      
      const data = createUserResponse.data as GraphQLResponse<{
        createUser: User;
      }>;
      
      if (createUserResponse.data?.createUser) {
        const createdUser = createUserResponse.data.createUser;
        console.log('Successfully created user:', createdUser);
        
        return createdUser;
      } else {
        console.error('Failed to create user:', createUserResponse.errors);
        
        // Log full error details
        if (createUserResponse.errors) {
          console.error('GraphQL errors:', JSON.stringify(createUserResponse.errors, null, 2));
        }
        
        return null;
      }
    } catch (graphQlError) {
      console.error('GraphQL error creating user:', graphQlError);
      
      // Log detailed error
      if (graphQlError instanceof Error) {
        console.error('Error details:', graphQlError.message, graphQlError.stack);
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error initializing user in DynamoDB:', error);
    
    // Log detailed error
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    } else {
      console.error('Unknown error type:', error);
    }
    
    return null;
  }
};

// Helper function to check if a user exists in DynamoDB
async function checkUserExists(userId: string): Promise<boolean> {
  if (!userId) {
    console.error('checkUserExists called with invalid userId:', userId);
    return false;
  }
  
  try {
    console.log(`Checking if user exists with ID: ${userId}`);
    
    const getUserQuery = `
      query GetUser($id: ID!) {
        getUser(id: $id) {
          id
          username
        }
      }
    `;
    
    const response = await client.graphql({
      query: getUserQuery,
      variables: {
        id: userId
      }
    }) as GraphQLResult<{
      getUser: {
        id: string;
        username: string;
      } | null;
    }>;
    
    const exists = !!response.data?.getUser;
    console.log(`User ${userId} exists: ${exists}`, response.data?.getUser);
    return exists;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return false to continue with user creation attempt
    return false;
  }
}

// Function to test GraphQL connection
async function testGraphQLConnection() {
  try {
    console.log('Testing GraphQL connection...');
    console.log('GraphQL endpoint:', awsconfig.aws_appsync_graphqlEndpoint);
    
    const testQuery = `
      query {
        __schema {
          queryType {
            name
          }
        }
      }
    `;
    
    const result = await client.graphql({
      query: testQuery,
    });
    
    console.log('GraphQL connection successful:', result);
    return true;
  } catch (error) {
    console.error('GraphQL connection test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
}

export const createUser = async (
  userId: string,
  username?: string,
  email?: string
): Promise<User | null> => {
  try {
    // Use the provided username if available, or generate one from userId
    const finalUsername = username || `user_${userId.substring(0, 8)}`;
    
    console.log(`Creating user in DynamoDB: ${userId} with username: ${finalUsername}`);
    
    // Create the user in DynamoDB
    const createUserInput = {
      id: userId,
      username: finalUsername,
      email: email || '',
      bio: '',
      createdAt: new Date().toISOString(),
      following: [],
    };

    const mutation = /* GraphQL */ `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          username
          email
          bio
          createdAt
          following
        }
      }
    `;

    const variables = {
      input: createUserInput,
    };

    const response = await client.graphql({
      query: mutation,
      variables,
    }) as GraphQLResult<{ createUser: User }>;

    if (response.data?.createUser) {
      console.log('User created successfully:', response.data.createUser);
      return response.data.createUser;
    } else {
      console.error('Failed to create user - empty response:', response);
      return null;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}; 