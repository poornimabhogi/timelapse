// React Native compatible AWS configuration
// This file provides a clean implementation without problematic Node.js dependencies

import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration from environment variables
const config = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
  userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
  identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID || '',
  appsyncApiUrl: process.env.REACT_APP_APPSYNC_ENDPOINT || '',
  appsyncApiKey: process.env.REACT_APP_APPSYNC_API_KEY || '',
  s3Bucket: process.env.REACT_APP_S3_BUCKET || '',
  apiGatewayEndpoint: process.env.REACT_APP_API_GATEWAY_ENDPOINT || '',
};

// GraphQL response interface
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Storage keys
const ID_TOKEN_KEY = 'timelapse_id_token';
const REFRESH_TOKEN_KEY = 'timelapse_refresh_token';
const USER_KEY = 'timelapse_user';

// Initialize Apollo Client for GraphQL
const httpLink = createHttpLink({
  uri: config.appsyncApiUrl,
  fetch: fetch,
});

// Auth link to add tokens to requests
const authLink = setContext(async (_, { headers }) => {
  const token = await getIdToken();
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      "x-api-key": config.appsyncApiKey,
    }
  };
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// Auth utility functions
export async function signIn(username: string, password: string) {
  console.log('Mock signIn called with:', username);
  
  // Store mock user data
  const mockUser = {
    uid: 'mock-user-123',
    username: username,
    email: `${username}@example.com`
  };
  
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));
  await AsyncStorage.setItem(ID_TOKEN_KEY, 'mock-id-token');
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, 'mock-refresh-token');
  
  return { 
    user: mockUser,
    isSignedIn: true
  };
}

export async function signUp(username: string, password: string, email: string) {
  console.log('Mock signUp called with:', username, email);
  return { success: true };
}

export async function confirmSignUp(username: string, code: string) {
  console.log('Mock confirmSignUp called with:', username, code);
  
  // Store mock user data after confirmation
  const mockUser = {
    uid: 'mock-user-123',
    username: username,
    email: `${username}@example.com`
  };
  
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));
  await AsyncStorage.setItem(ID_TOKEN_KEY, 'mock-id-token');
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, 'mock-refresh-token');
  
  return { 
    user: mockUser,
    success: true 
  };
}

export async function resetPassword(username: string) {
  console.log('Mock resetPassword called with:', username);
  return { success: true };
}

export async function confirmResetPassword(username: string, code: string, newPassword: string) {
  console.log('Mock confirmResetPassword called with:', username, code);
  return { success: true };
}

export async function signOut() {
  console.log('Mock signOut called');
  
  // Clear stored data
  await AsyncStorage.removeItem(USER_KEY);
  await AsyncStorage.removeItem(ID_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.log('Error getting current user:', error);
    return null;
  }
}

export async function getIdToken() {
  try {
    return await AsyncStorage.getItem(ID_TOKEN_KEY);
  } catch (error) {
    console.log('Error getting ID token:', error);
    return null;
  }
}

// S3 and media functions
export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export async function generatePresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResponse> {
  console.log('Mock generatePresignedUrl called with:', fileName, fileType);
  
  const mockKey = `uploads/mock-user-123/${Date.now()}-${fileName}`;
  
  return {
    uploadUrl: `https://mock-upload.example.com/${mockKey}`,
    fileUrl: `https://mock-cdn.example.com/${mockKey}`,
    key: mockKey
  };
}

export async function uploadToS3(file: { uri: string; type: string; name: string }, folder: string): Promise<string> {
  console.log('Mock uploadToS3 called with:', file.name, folder);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockUrl = `https://mock-cdn.example.com/${folder}/${Date.now()}-${file.name}`;
  return mockUrl;
}

export async function getMediaUrl(key: string): Promise<string> {
  console.log('Mock getMediaUrl called with:', key);
  return `https://mock-cdn.example.com/${key}`;
}

// GraphQL operations
export async function graphqlQuery(query: string, variables?: any) {
  try {
    console.log('GraphQL Query:', query);
    console.log('Variables:', variables);
    
    if (query.includes('getFeaturePosts')) {
      return {
        data: {
          getFeaturePosts: []
        }
      };
    }
    
    return {
      data: {
        listTimelapses: {
          items: []
        }
      }
    };
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

export async function graphqlMutation<T = any>(mutation: string, variables?: any): Promise<GraphQLResponse<T>> {
  try {
    console.log('GraphQL Mutation:', mutation);
    console.log('Variables:', variables);
    
    if (mutation.includes('generatePresignedUrl')) {
      const mockKey = `uploads/mock-user/${Date.now()}-${variables.fileName}`;
      return {
        data: {
          generatePresignedUrl: {
            uploadUrl: `https://mock-upload.example.com/${mockKey}`,
            fileUrl: `https://mock-cdn.example.com/${mockKey}`,
            key: mockKey
          }
        }
      } as unknown as GraphQLResponse<T>;
    } 
    else if (mutation.includes('CreateFeaturePost')) {
      return {
        data: {
          createFeaturePost: {
            id: `post-${Date.now()}`,
            text: variables.text,
            mediaUrls: variables.mediaUrls,
            likes: 0,
            createdAt: new Date().toISOString(),
          }
        }
      } as unknown as GraphQLResponse<T>;
    }
    
    return {
      data: {}
    } as GraphQLResponse<T>;
  } catch (error) {
    console.error('GraphQL mutation error:', error);
    throw error;
  }
}

// Feature post functions
export async function createFeaturePost(text: string, mediaUrls: string[]) {
  console.log('Mock createFeaturePost called with:', text, mediaUrls);
  
  return {
    id: `post-${Date.now()}`,
    text,
    mediaUrls,
    likes: 0,
    createdAt: new Date().toISOString(),
  };
}

// Seller verification functions
export async function saveSellerVerification(data: any, userId: string) {
  console.log('Mock saveSellerVerification called with:', data, userId);
  return { success: true };
}

export async function sendSellerVerificationEmail(data: any) {
  console.log('Mock sendSellerVerificationEmail called with:', data);
  return { success: true };
}

// Timelapse interaction functions
export async function likeTimelapseItem(timelapseId: string) {
  console.log('Mock likeTimelapseItem called with:', timelapseId);
  return { success: true };
}

export async function unlikeTimelapseItem(timelapseId: string) {
  console.log('Mock unlikeTimelapseItem called with:', timelapseId);
  return { success: true };
}

export async function deleteTimelapseItem(timelapseId: string) {
  console.log('Mock deleteTimelapseItem called with:', timelapseId);
  return { success: true };
}

// Default export
const awsConfig = {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  signOut,
  getCurrentUser,
  getIdToken,
  generatePresignedUrl,
  uploadToS3,
  getMediaUrl,
  graphqlQuery,
  graphqlMutation,
  createFeaturePost,
  saveSellerVerification,
  sendSellerVerificationEmail,
  likeTimelapseItem,
  unlikeTimelapseItem,
  deleteTimelapseItem,
};

export default awsConfig; 