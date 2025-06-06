import awsConfig, { 
  graphqlClient, 
  apolloClient, 
  graphqlQuery, 
  graphqlMutation, 
  graphqlSubscription 
} from './aws-config';
import { EventEmitter } from 'events';
import { Observable } from 'zen-observable-ts';
import { gql } from '@apollo/client';
interface GraphQLResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}



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

// Use the properly configured GraphQL client from AWS config
const client = graphqlClient;
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
  type: 'photo' | 'video';
  createdAt: number;
  description?: string;
  likes: number;
  likedBy: string[];
  duration?: number;
}

export interface UpdateTimelapseItemInput {
  id: string;
  userId?: string;
  mediaUrl?: string;
  type?: 'photo' | 'video';
  createdAt?: number;
  description?: string;
  likes?: number;
  likedBy?: string[];
  duration?: number;
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

// Define queries for user operations
const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      username
      following
    }
  }
`;

const CREATE_USER_MUTATION = `
  mutation CreateUser($username: String!, $name: String, $bio: String, $avatar: String) {
    createUser(username: $username, name: $name, bio: $bio, avatar: $avatar) {
      id
      username
      name
    }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      following
    }
  }
`;

// BatchGet GraphQL queries
const batchGetTimelapseItemsQuery = `
  query BatchGetTimelapseItems($ids: [ID!]!) {
    getTimelapsesByIds(ids: $ids) {
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

const batchGetUsersQuery = `
  query BatchGetUsers($ids: [ID!]!) {
    getUsersByIds(ids: $ids) {
      id
      username
      name
      bio
      avatar
      following
      followers
      createdAt
    }
  }
`;

// Service functions that replace Firestore operations
export const dynamodbService = {
  // Add a new timelapse item (replaces addDoc from Firestore)
  async createTimelapseItem(item: Omit<TimelapseItem, 'id'>): Promise<TimelapseItem> {
    try {
      console.log('Creating timelapse with data:', JSON.stringify(item, null, 2));
      
      // Make sure we have all the required fields for the input
      const input = {
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
      
      const response = await client.mutate({
        mutation: gql(createTimelapseItemMutation),
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
        }
        
        // Create a fallback item with a temporary ID for local use
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
        
        console.warn('Using fallback item with temporary ID');
        return fallbackItem;
      }

      // Create a properly structured item with ID to ensure consistency
      const createdItem: TimelapseItem = {
        id: response.data.createTimelapseItem.id,
        userId: item.userId,
        mediaUrl: item.mediaUrl, 
        type: item.type,
        createdAt: item.createdAt,
        description: item.description || '',
        likes: item.likes || 0,
        likedBy: item.likedBy || [],
        duration: item.duration || 0
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
      
      const response = await client.query({
        query: gql(listTimelapseItemsQuery),
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
      
      const response = await client.mutate({
        mutation: gql(updateTimelapseItemMutation),
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
      
      const response = await client.mutate({
        mutation: gql(deleteTimelapseItemMutation),
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
      const user = await awsConfig.getCurrentUser();
      return user.uid;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  // Add a function to get timelapses from user's followed accounts
  async getFollowingTimelapseItems(userId: string): Promise<TimelapseItem[]> {
    try {
      // First, get the list of users that the current user follows
      const userResponse = await client.query({
        query: gql(GET_USER_QUERY),
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
      const response = await client.query({
        query: gql(`
          query ListTimelapseItemsByUsers($filter: ModelTimelapseItemFilterInput!) {
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
        `),
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
      const userResponse = await client.query({
        query: gql(GET_USER_QUERY),
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
      const updateResponse = await client.mutate({
        mutation: gql(UPDATE_USER_MUTATION),
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
      const userResponse = await client.query({
        query: gql(GET_USER_QUERY),
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
      const updateResponse = await client.mutate({
        mutation: gql(UPDATE_USER_MUTATION),
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
      
      const variables = {
        username: finalUsername,
        name: displayName,
        bio: '',
        avatar: ''
      };
      
      console.log('Executing createUser mutation with variables:', JSON.stringify(variables, null, 2));
      
      const createUserResponse = await client.mutate({
        mutation: gql(CREATE_USER_MUTATION),
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
    
    const response = await client.query({
      query: gql(GET_USER_QUERY),
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
    console.log('GraphQL endpoint:', 'AppSync endpoint URL');
    
    // Use Apollo client query
    const result = await client.query({
      query: gql(`query { __schema { queryType { name } } }`),
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

    const variables = {
      input: createUserInput,
    };

    const response = await client.mutate({
      mutation: gql(`
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
      `),
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

// Extend dynamodbService with batch processing functions
export const batchOperations = {
  // Batch get timelapse items by IDs
  async batchGetTimelapseItems(ids: string[]): Promise<TimelapseItem[]> {
    if (!ids || ids.length === 0) {
      console.log('No IDs provided for batch get operation');
      return [];
    }

    try {
      console.log(`Batch getting ${ids.length} timelapse items`);
      
      // Process in chunks of 100 items (DynamoDB limit)
      const results: TimelapseItem[] = [];
      
      // Process ids in chunks to avoid exceeding service limits
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        
        const response = await client.query({
          query: gql(batchGetTimelapseItemsQuery),
          variables: { ids: chunk }
        }) as GraphQLResult<{
          getTimelapsesByIds: TimelapseItem[];
        }>;

        if (response?.data?.getTimelapsesByIds) {
          results.push(...response.data.getTimelapsesByIds);
        } else if (response?.errors) {
          console.error('GraphQL errors in batch get:', JSON.stringify(response.errors, null, 2));
        }
      }
      
      console.log(`Successfully batch retrieved ${results.length} items`);
      return results;
    } catch (error) {
      console.error('Error in batch get timelapse items:', error);
      return [];
    }
  },
  
  // Batch get users by IDs
  async batchGetUsers(ids: string[]): Promise<User[]> {
    if (!ids || ids.length === 0) {
      console.log('No IDs provided for batch user get operation');
      return [];
    }

    try {
      console.log(`Batch getting ${ids.length} users`);
      
      // Process in chunks of 100 items (DynamoDB limit)
      const results: User[] = [];
      
      // Process ids in chunks to avoid exceeding service limits
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        
        const response = await client.query({
          query: gql(batchGetUsersQuery),
          variables: { ids: chunk }
        }) as GraphQLResult<{
          getUsersByIds: User[];
        }>;

        if (response?.data?.getUsersByIds) {
          results.push(...response.data.getUsersByIds);
        } else if (response?.errors) {
          console.error('GraphQL errors in batch get users:', JSON.stringify(response.errors, null, 2));
        }
      }
      
      console.log(`Successfully batch retrieved ${results.length} users`);
      return results;
    } catch (error) {
      console.error('Error in batch get users:', error);
      return [];
    }
  },
  
  // Get user timelines efficiently by aggregating followed users' timelapses
  async getUserTimeline(userId: string, limit = 100): Promise<TimelapseItem[]> {
    try {
      console.log(`Getting timeline for user ${userId}`);
      
      // 1. Get user's following list
      const userResponse = await client.query({
        query: gql(GET_USER_QUERY),
        variables: { id: userId }
      }) as GraphQLResult<{
        getUser: { following: string[] };
      }>;
      
      if (!userResponse?.data?.getUser?.following) {
        console.log('User not found or has no following list');
        return [];
      }
      
      const followingIds = userResponse.data.getUser.following;
      console.log(`User is following ${followingIds.length} accounts`);
      
      if (followingIds.length === 0) {
        return [];
      }
      
      // 2. Get recent timelapses for all followed users in one query
      const timelapseIds: string[] = [];
      const seenIds = new Set<string>();
      
      // Process users in chunks to stay within limits
      const chunks = [];
      for (let i = 0; i < followingIds.length; i += 25) {
        chunks.push(followingIds.slice(i, i + 25));
      }
      
      for (const chunk of chunks) {
        try {
          const response = await client.query({
            query: gql(`
              query RecentUserTimelapses($userIds: [ID!]!, $limit: Int) {
                getMultipleUserTimelapses(userIds: $userIds, limit: $limit) {
                  userId
                  timelapseIds
                }
              }
            `),
            variables: {
              userIds: chunk,
              limit: Math.floor(limit / followingIds.length) + 5 // Add buffer
            }
          }) as GraphQLResult<{
            getMultipleUserTimelapses: Array<{
              userId: string;
              timelapseIds: string[];
            }>;
          }>;
          
          if (response?.data?.getMultipleUserTimelapses) {
            for (const result of response.data.getMultipleUserTimelapses) {
              for (const id of result.timelapseIds) {
                if (!seenIds.has(id)) {
                  timelapseIds.push(id);
                  seenIds.add(id);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error fetching chunk of user timelapses:', err);
        }
      }
      
      if (timelapseIds.length === 0) {
        console.log('No timelapses found from followed users');
        return [];
      }
      
      console.log(`Found ${timelapseIds.length} timelapse IDs from followed users`);
      
      // 3. Batch get the actual timelapse items
      const timelapses = await this.batchGetTimelapseItems(timelapseIds);
      
      // 4. Sort by creation date (newest first)
      return timelapses.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
    } catch (error) {
      console.error('Error getting user timeline:', error);
      return [];
    }
  },
  
  // Function to fetch multiple user metadata in a single request
  async getUsersMetadata(userIds: string[]): Promise<Record<string, {
    username: string;
    avatar?: string;
    followers: number;
  }>> {
    if (!userIds || userIds.length === 0) {
      return {};
    }
    
    try {
      const uniqueIds = [...new Set(userIds)]; // Remove duplicates
      console.log(`Fetching metadata for ${uniqueIds.length} users`);
      
      const users = await this.batchGetUsers(uniqueIds);
      const result: Record<string, { username: string; avatar?: string; followers: number }> = {};
      
      for (const user of users) {
        result[user.id] = {
          username: user.username,
          avatar: user.avatar,
          followers: user.followers?.length || 0
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching users metadata:', error);
      return {};
    }
  },
  
  // Process interactions (likes, comments) in bulk
  async processInteractionsBatch(interactions: Array<{
    userId: string;
    targetId: string;
    type: 'like' | 'comment' | 'view';
    value?: string | number;
  }>): Promise<boolean> {
    if (!interactions || interactions.length === 0) {
      return true;
    }
    
    try {
      console.log(`Processing batch of ${interactions.length} interactions`);
      
      // Group interactions by type for efficient processing
      const likes: Array<{userId: string; targetId: string}> = [];
      const comments: Array<{userId: string; targetId: string; value: string}> = [];
      const views: Array<{targetId: string}> = [];
      
      for (const interaction of interactions) {
        if (interaction.type === 'like') {
          likes.push({userId: interaction.userId, targetId: interaction.targetId});
        } else if (interaction.type === 'comment' && typeof interaction.value === 'string') {
          comments.push({
            userId: interaction.userId, 
            targetId: interaction.targetId,
            value: interaction.value
          });
        } else if (interaction.type === 'view') {
          views.push({targetId: interaction.targetId});
        }
      }
      
      // Process each type in parallel
      await Promise.all([
        this.processBatchLikes(likes),
        this.processBatchComments(comments),
        this.processBatchViews(views)
      ]);
      
      return true;
    } catch (error) {
      console.error('Error processing interactions batch:', error);
      return false;
    }
  },
  
  // Helper methods for batch processing
  async processBatchLikes(likes: Array<{userId: string; targetId: string}>): Promise<void> {
    if (likes.length === 0) return;
    
    try {
      console.log(`Processing ${likes.length} likes in batch`);
      
      // Group likes by targetId for efficient updates
      const likesByTarget: Record<string, string[]> = {};
      
      for (const like of likes) {
        if (!likesByTarget[like.targetId]) {
          likesByTarget[like.targetId] = [];
        }
        likesByTarget[like.targetId].push(like.userId);
      }
      
      // Process in batches of 25 items
      const targetIds = Object.keys(likesByTarget);
      const chunks = [];
      for (let i = 0; i < targetIds.length; i += 25) {
        chunks.push(targetIds.slice(i, i + 25));
      }
      
      for (const chunk of chunks) {
        try {
          await client.mutate({
            mutation: gql(`
              mutation BatchUpdateLikes($inputs: [BatchLikeInput!]!) {
                batchUpdateLikes(inputs: $inputs) {
                  successCount
                  failedIds
                }
              }
            `),
            variables: {
              inputs: chunk.map(targetId => ({
                targetId,
                userIds: likesByTarget[targetId]
              }))
            }
          });
        } catch (err) {
          console.error('Error processing chunk of likes:', err);
        }
      }
    } catch (error) {
      console.error('Error in batch likes processing:', error);
    }
  },
  
  async processBatchComments(comments: Array<{userId: string; targetId: string; value: string}>): Promise<void> {
    if (comments.length === 0) return;
    
    try {
      console.log(`Processing ${comments.length} comments in batch`);
      
      // Process in batches of 25 comments
      const chunks = [];
      for (let i = 0; i < comments.length; i += 25) {
        chunks.push(comments.slice(i, i + 25));
      }
      
      for (const chunk of chunks) {
        try {
          await client.mutate({
            mutation: gql(`
              mutation BatchCreateComments($inputs: [CommentInput!]!) {
                batchCreateComments(inputs: $inputs) {
                  successCount
                  failedComments
                }
              }
            `),
            variables: {
              inputs: chunk.map(comment => ({
                targetId: comment.targetId,
                userId: comment.userId,
                content: comment.value
              }))
            }
          });
        } catch (err) {
          console.error('Error processing chunk of comments:', err);
        }
      }
    } catch (error) {
      console.error('Error in batch comments processing:', error);
    }
  },
  
  async processBatchViews(views: Array<{targetId: string}>): Promise<void> {
    if (views.length === 0) return;
    
    try {
      console.log(`Processing ${views.length} views in batch`);
      
      // Process in batches of 25 views
      const chunks = [];
      for (let i = 0; i < views.length; i += 25) {
        chunks.push(views.slice(i, i + 25));
      }
      
      for (const chunk of chunks) {
        try {
          await client.mutate({
            mutation: gql(`
              mutation BatchIncrementViews($targetIds: [ID!]!) {
                batchIncrementViews(targetIds: $targetIds) {
                  successCount
                  failedIds
                }
              }
            `),
            variables: {
              targetIds: chunk.map(view => view.targetId)
            }
          });
        } catch (err) {
          console.error('Error processing chunk of views:', err);
        }
      }
    } catch (error) {
      console.error('Error in batch views processing:', error);
    }
  }
}; 