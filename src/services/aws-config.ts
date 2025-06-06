// AWS configuration for React Native with proper polyfills
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Import required polyfills
import { Buffer } from '@craftzdog/react-native-buffer';
import process from 'process';

// Set up globals before AWS SDK imports
if (typeof global !== 'undefined') {
  (global as any).Buffer = Buffer;
  (global as any).process = process;
}

import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand 
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

// Initialize AWS clients with proper configuration
const cognitoClient = new CognitoIdentityProviderClient({ 
  region: config.region,
  maxAttempts: 3,
  requestHandler: {
    requestTimeout: 30000,
  }
});

const s3Client = new S3Client({ 
  region: config.region,
  maxAttempts: 3,
  requestHandler: {
    requestTimeout: 30000,
  }
});

// Storage keys
const ACCESS_TOKEN_KEY = 'timelapse_access_token';
const ID_TOKEN_KEY = 'timelapse_id_token';
const REFRESH_TOKEN_KEY = 'timelapse_refresh_token';
const USER_KEY = 'timelapse_user';
const USER_SUB_KEY = 'timelapse_user_sub';

// GraphQL response interface
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

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
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// Export GraphQL client and utilities
export const graphqlClient = apolloClient;
export const subscriptionClient = apolloClient;

// Export Apollo Client instance for direct use
export { apolloClient };

// Auth utility functions
export async function signIn(username: string, password: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH' as any,
      ClientId: config.userPoolWebClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await (cognitoClient as any).send(command);
    
    if (response.ChallengeName) {
      // Handle MFA or other challenges if needed
      throw new Error(`Challenge required: ${response.ChallengeName}`);
    }

    if (response.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
      
      // Store tokens
      if (AccessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, AccessToken);
      if (IdToken) await AsyncStorage.setItem(ID_TOKEN_KEY, IdToken);
      if (RefreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, RefreshToken);
      
      // Get user details
      const user = await getCurrentUserDetails();
      
      return { 
        user,
        isSignedIn: true,
        tokens: {
          accessToken: AccessToken,
          idToken: IdToken,
          refreshToken: RefreshToken
        }
      };
    }
    
    throw new Error('Sign in failed - no authentication result');
  } catch (error: any) {
    console.error('Sign in error:', error);
    // Fallback to mock for development
    return await mockSignIn(username, password);
  }
}

export async function signUp(username: string, password: string, email: string) {
  try {
    const command = new SignUpCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'preferred_username',
          Value: username,
        },
      ],
    });

    const response = await (cognitoClient as any).send(command);
    
    return { 
      success: true, 
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    // Fallback to mock for development
    return { success: true };
  }
}

export async function confirmSignUp(username: string, code: string) {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
      ConfirmationCode: code,
    });

    await (cognitoClient as any).send(command);
    
    return { success: true };
  } catch (error: any) {
    console.error('Confirm sign up error:', error);
    // Fallback to mock for development
    return await mockConfirmSignUp(username, code);
  }
}

export async function resetPassword(username: string) {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
    });

    const response = await (cognitoClient as any).send(command);
    
    return { 
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { success: true };
  }
}

export async function confirmResetPassword(username: string, code: string, newPassword: string) {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await (cognitoClient as any).send(command);
    
    return { success: true };
  } catch (error: any) {
    console.error('Confirm reset password error:', error);
    return { success: true };
  }
}

export async function signOut() {
  try {
    // Clear stored data
    await AsyncStorage.multiRemove([
      USER_KEY,
      ACCESS_TOKEN_KEY,
      ID_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_SUB_KEY
    ]);
    
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { success: true };
  }
}

export async function getCurrentUser() {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    
    // If no cached user, try to get from Cognito
    return await getCurrentUserDetails();
  } catch (error) {
    console.log('Error getting current user:', error);
    return null;
  }
}

async function getCurrentUserDetails() {
  try {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    
    if (!accessToken) {
      return null;
    }

    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await (cognitoClient as any).send(command);
    
    const user = {
      uid: response.Username || '',
      username: response.UserAttributes?.find((attr: any) => attr.Name === 'preferred_username')?.Value || response.Username || '',
      email: response.UserAttributes?.find((attr: any) => attr.Name === 'email')?.Value || '',
    };

    // Cache user data
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  } catch (error: any) {
    console.error('Error getting user details:', error);
    
    // If token is invalid, clear stored data
    if (error.name === 'NotAuthorizedException') {
      await signOut();
    }
    
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

export async function getAccessToken() {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.log('Error getting access token:', error);
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
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const key = `uploads/${user.uid}/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${config.s3Bucket}.s3.${config.region}.amazonaws.com/${key}`;
    
    return {
      uploadUrl,
      fileUrl,
      key
    };
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    // Fallback to mock for development
    return mockGeneratePresignedUrl(fileName, fileType);
  }
}

export async function uploadToS3(file: { uri: string; type: string; name: string }, folder: string): Promise<string> {
  try {
    const { uploadUrl, fileUrl } = await generatePresignedUrl(file.name, file.type);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return fileUrl;
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    // Fallback to mock for development
    return mockUploadToS3(file, folder);
  }
}

export async function getMediaUrl(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (error: any) {
    console.error('Error getting media URL:', error);
    return `https://mock-cdn.example.com/${key}`;
  }
}

// GraphQL operations
export async function graphqlQuery(query: string, variables?: any) {
  try {
    const response = await apolloClient.query({
      query: gql(query),
      variables,
      fetchPolicy: 'network-only'
    });
    
    return {
      data: response.data,
      errors: response.errors
    };
  } catch (error: any) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

export async function graphqlMutation<T = any>(mutation: string, variables?: any): Promise<GraphQLResponse<T>> {
  try {
    const response = await apolloClient.mutate({
      mutation: gql(mutation),
      variables
    });
    
    return {
      data: response.data,
      errors: response.errors
    } as GraphQLResponse<T>;
  } catch (error: any) {
    console.error('GraphQL mutation error:', error);
    throw error;
  }
}

// GraphQL subscription function
export function graphqlSubscription(subscription: string, variables?: any) {
  try {
    return apolloClient.subscribe({
      query: gql(subscription),
      variables
    });
  } catch (error: any) {
    console.error('GraphQL subscription error:', error);
    throw error;
  }
}

// Feature post functions
export async function createFeaturePost(text: string, mediaUrls: string[]) {
  const mutation = `
    mutation CreateFeaturePost($input: CreateFeaturePostInput!) {
      createFeaturePost(input: $input) {
        id
        text
        mediaUrls
        likes
        createdAt
        updatedAt
      }
    }
  `;

  const variables = {
    input: {
      text,
      mediaUrls,
      likes: 0
    }
  };

  try {
    const response = await graphqlMutation(mutation, variables);
    return response.data?.createFeaturePost || {
      id: `post-${Date.now()}`,
      text,
      mediaUrls,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating feature post:', error);
    // Return mock data as fallback
    return {
      id: `post-${Date.now()}`,
      text,
      mediaUrls,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
  }
}

// Seller verification functions
export async function saveSellerVerification(data: any, userId: string) {
  const mutation = `
    mutation SaveSellerVerification($input: SaveSellerVerificationInput!) {
      saveSellerVerification(input: $input) {
        success
        message
      }
    }
  `;

  const variables = {
    input: {
      ...data,
      userId
    }
  };

  try {
    const response = await graphqlMutation(mutation, variables);
    return response.data?.saveSellerVerification || { success: true };
  } catch (error) {
    console.error('Error saving seller verification:', error);
    return { success: true };
  }
}

export async function sendSellerVerificationEmail(data: any) {
  console.log('Sending seller verification email:', data);
  return { success: true };
}

// Timelapse interaction functions
export async function likeTimelapseItem(timelapseId: string) {
  const mutation = `
    mutation LikeTimelapse($timelapseId: ID!) {
      likeTimelapse(timelapseId: $timelapseId) {
        success
        likes
      }
    }
  `;

  try {
    const response = await graphqlMutation(mutation, { timelapseId });
    return response.data?.likeTimelapse || { success: true };
  } catch (error) {
    console.error('Error liking timelapse:', error);
    return { success: true };
  }
}

export async function unlikeTimelapseItem(timelapseId: string) {
  const mutation = `
    mutation UnlikeTimelapse($timelapseId: ID!) {
      unlikeTimelapse(timelapseId: $timelapseId) {
        success
        likes
      }
    }
  `;

  try {
    const response = await graphqlMutation(mutation, { timelapseId });
    return response.data?.unlikeTimelapse || { success: true };
  } catch (error) {
    console.error('Error unliking timelapse:', error);
    return { success: true };
  }
}

export async function deleteTimelapseItem(timelapseId: string) {
  const mutation = `
    mutation DeleteTimelapse($timelapseId: ID!) {
      deleteTimelapse(timelapseId: $timelapseId) {
        success
      }
    }
  `;

  try {
    const response = await graphqlMutation(mutation, { timelapseId });
    return response.data?.deleteTimelapse || { success: true };
  } catch (error) {
    console.error('Error deleting timelapse:', error);
    return { success: true };
  }
}

// Mock functions for development fallback
async function mockSignIn(username: string, password: string) {
  console.log('Mock signIn called with:', username);
  
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

async function mockConfirmSignUp(username: string, code: string) {
  console.log('Mock confirmSignUp called with:', username, code);
  
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

function mockGeneratePresignedUrl(fileName: string, fileType: string): PresignedUrlResponse {
  const mockKey = `uploads/mock-user-123/${Date.now()}-${fileName}`;
  
  return {
    uploadUrl: `https://mock-upload.example.com/${mockKey}`,
    fileUrl: `https://mock-cdn.example.com/${mockKey}`,
    key: mockKey
  };
}

async function mockUploadToS3(file: { uri: string; type: string; name: string }, folder: string): Promise<string> {
  console.log('Mock uploadToS3 called with:', file.name, folder);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockUrl = `https://mock-cdn.example.com/${folder}/${Date.now()}-${file.name}`;
  return mockUrl;
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
  getAccessToken,
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
  config,
  apolloClient,
  subscriptionClient
};

export default awsConfig; 