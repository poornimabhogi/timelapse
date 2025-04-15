
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from 'graphql-ws';
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { fetch } from 'cross-fetch';
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, ForgotPasswordCommand, ConfirmForgotPasswordCommand, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

// Load config from environment variables
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

// Initialize clients
const cognitoClient = new CognitoIdentityProviderClient({ region: config.region });
const s3Client = new S3Client({ region: config.region });

// Initialize Apollo Client for GraphQL
const httpLink = createHttpLink({
  uri: config.appsyncApiUrl,
  fetch,
});

// Auth link to add tokens to requests
const authLink = setContext(async (_, { headers }) => {
  // Get the token
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

// Set up subscriptions client for real-time data
const subscriptionClient = createClient({
  url: config.appsyncApiUrl.replace('https://', 'wss://'),
  connectionParams: async () => {
    const token = await getIdToken();
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  },
});

// Local storage keys
const ID_TOKEN_KEY = 'timelapse_id_token';
const REFRESH_TOKEN_KEY = 'timelapse_refresh_token';
const USER_KEY = 'timelapse_user';

// Auth utility functions
export async function signIn(username: string, password: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: config.userPoolWebClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    
    if (response.AuthenticationResult) {
      const { IdToken, RefreshToken } = response.AuthenticationResult;
      
      // Store tokens
      localStorage.setItem(ID_TOKEN_KEY, IdToken || '');
      localStorage.setItem(REFRESH_TOKEN_KEY, RefreshToken || '');
      
      // Get user attributes
      const userCommand = new GetUserCommand({
        AccessToken: response.AuthenticationResult.AccessToken,
      });
      
      const userResponse = await cognitoClient.send(userCommand);
      const attributes = userResponse.UserAttributes || [];
      
      // Create user object
      const user = {
        uid: attributes.find(attr => attr.Name === 'sub')?.Value || '',
        username: userResponse.Username || '',
        email: attributes.find(attr => attr.Name === 'email')?.Value || '',
      };
      
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return { 
        user,
        isSignedIn: true
      };
    }
    
    return { isSignedIn: false };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
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
      ],
    });

    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

export async function confirmSignUp(username: string, code: string) {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
      ConfirmationCode: code,
    });

    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error('Error confirming sign up:', error);
    throw error;
  }
}

export async function resetPassword(username: string) {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
    });

    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
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

    const response = await cognitoClient.send(command);
    return response;
  } catch (error) {
    console.error('Error confirming password reset:', error);
    throw error;
  }
}

export async function signOut() {
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  return { success: true };
}

export async function getCurrentUser() {
  const userString = localStorage.getItem(USER_KEY);
  if (!userString) {
    throw new Error('No authenticated user');
  }
  
  try {
    return JSON.parse(userString);
  } catch (e) {
    throw new Error('Invalid user data');
  }
}

export async function getIdToken() {
  return localStorage.getItem(ID_TOKEN_KEY) || '';
}

// GraphQL operations
export async function graphqlQuery(query: string, variables?: any) {
  try {
    const response = await apolloClient.query({
      query: gql(query),
      variables,
    });
    
    return response;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

export async function graphqlMutation(mutation: string, variables?: any) {
  try {
    const response = await apolloClient.mutate({
      mutation: gql(mutation),
      variables,
    });
    
    return response;
  } catch (error) {
    console.error('GraphQL mutation error:', error);
    throw error;
  }
}

// S3 operations
export async function getMediaUrl(key: string): Promise<string> {
  try {
    console.log('Getting media URL for key:', key);

    // Extract cache buster if present but don't include in the S3 key
    let cacheBuster = '';
    if (key.includes('?cb=')) {
      const parts = key.split('?cb=');
      key = parts[0];
      cacheBuster = parts[1];
      console.log('Extracted cache buster:', cacheBuster);
    }
    
    // If it's already a full URL, just return it
    if (key.startsWith('http://') || key.startsWith('https://')) {
      if (!key.includes('amazonaws.com')) {
        console.log('Key is already a non-S3 URL, using directly:', key);
        return key;
      }
      
      console.log('Key is an S3 URL, extracting path');
    }
    
    // If it's an S3 path with the bucket name, extract just the key
    if (key.includes('s3.amazonaws.com')) {
      try {
        const url = new URL(key);
        const pathParts = url.pathname.split('/');
        // Remove the first empty element and bucket name
        key = pathParts.slice(2).join('/');
        console.log('Extracted key from S3 URL:', key);
      } catch (e) {
        console.log('Unable to extract key, using URL as is');
        return key;
      }
    }
    
    // Remove any existing query parameters before adding new ones
    if (key.includes('?')) {
      key = key.split('?')[0];
      console.log('Removed query parameters from key:', key);
    }
    
    try {
      // Create a GetObject command
      const command = new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
      });
      
      // Generate a signed URL
      const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 86400 // URL valid for 24 hours
      });
      
      // Add cache buster if one was provided
      let url = signedUrl;
      if (cacheBuster) {
        url = url.includes('?') 
          ? `${url}&cb=${cacheBuster}` 
          : `${url}?cb=${cacheBuster}`;
        console.log('Added cache buster to URL:', url);
      }
      
      console.log('Final URL:', url);
      return url;
    } catch (s3Error) {
      console.error('S3 getSignedUrl error:', s3Error);
      
      // If we can't get a proper URL, return the placeholder
      if (key.toLowerCase().endsWith('.mp4') || key.toLowerCase().endsWith('.mov')) {
        return 'https://via.placeholder.com/400?text=Video+Unavailable';
      } else {
        return 'https://via.placeholder.com/400?text=Image+Unavailable';
      }
    }
  } catch (error) {
    console.error('Error getting media URL:', error);
    // Return a placeholder image URL if there's an error
    return 'https://via.placeholder.com/400?text=Media+Unavailable';
  }
}

// Upload file to S3
export async function uploadToS3(file: { uri: string; type: string; name: string }, folder: string): Promise<string> {
  try {
    if (!file || !file.uri) {
      console.error('Invalid file object provided to uploadToS3');
      throw new Error('Invalid file: missing required properties');
    }
    
    console.log('Starting S3 upload process for file:', file.name);
    console.log('Upload destination folder:', folder);
    
    // Get presigned URL for upload
    const response = await fetch(`${config.apiGatewayEndpoint}/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getIdToken()}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder: folder,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}`);
    }
    
    const { uploadUrl, fileUrl } = await response.json();
    
    // Fetch the file content as blob
    const fileResponse = await fetch(file.uri);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file content: ${fileResponse.status}`);
    }
    const blob = await fileResponse.blob();
    
    // Upload to S3 using the presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    return fileUrl;
  } catch (error) {
    console.error('Error in S3 upload process:', error);
    throw error;
  }
}

// GraphQL mutations
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

const updateTimelapseItemMutation = `
  mutation UpdateTimelapseItem($id: ID!, $likes: Int, $likedBy: [String]) {
    updateTimelapseItem(input: {
      id: $id,
      likes: $likes,
      likedBy: $likedBy
    }) {
      id
      likes
      likedBy
    }
  }
`;

const deleteTimelapseItemMutation = `
  mutation DeleteTimelapseItem($id: ID!) {
    deleteTimelapseItem(input: {
      id: $id
    }) {
      id
    }
  }
`;

// GraphQL queries
const getTimelapseItemQuery = `
  query GetTimelapseItem($id: ID!) {
    getTimelapseItem(id: $id) {
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

// Feature post operations
export async function createFeaturePost(text: string, mediaUrls: string[]) {
  try {
    const user = await getCurrentUser();
    
    const mutation = `
      mutation CreateFeaturePost(
        $userId: ID!,
        $text: String!,
        $mediaUrls: [String!]!,
        $likes: Int!,
        $createdAt: String!
      ) {
        createFeaturePost(input: {
          userId: $userId,
          text: $text,
          mediaUrls: $mediaUrls,
          likes: $likes,
          createdAt: $createdAt
        }) {
          id
          text
          mediaUrls
          likes
          createdAt
        }
      }
    `;
    
    const response = await graphqlMutation(mutation, {
      userId: user.uid,
      text,
      mediaUrls,
      likes: 0,
      createdAt: new Date().toISOString(),
    });
    
    return response;
  } catch (error) {
    console.error('Error creating feature post:', error);
    throw error;
  }
}

// Timelapses like/unlike operations
export async function likeTimelapseItem(timelapseId: string) {
  try {
    // Get current user ID
    const currentUser = await getCurrentUser();
    const userId = currentUser.uid;
    
    // First, get the current timelapse item
    const getResult = await graphqlQuery(getTimelapseItemQuery, {
      id: timelapseId,
    });
    
    if (!getResult.data || !getResult.data.getTimelapseItem) {
      return { 
        likes: 0,
        success: false,
        message: 'Timelapse item not found',
      };
    }
    
    // Extract current likes and likedBy
    const item = getResult.data.getTimelapseItem;
    const currentLikes = item.likes || 0;
    const currentLikedBy = item.likedBy || [];
    
    // Check if user already liked this item
    if (currentLikedBy.includes(userId)) {
      return {
        likes: currentLikes,
        success: true,
        message: 'Already liked',
      };
    }
    
    // Update likes count and likedBy array
    const newLikes = currentLikes + 1;
    const newLikedBy = [...currentLikedBy, userId];
    
    // Update the item
    const response = await graphqlMutation(updateTimelapseItemMutation, {
      id: timelapseId,
      likes: newLikes,
      likedBy: newLikedBy,
    });
    
    if (!response.data || !response.data.updateTimelapseItem) {
      return { 
        likes: currentLikes,
        success: false,
        message: 'Failed to update timelapse item',
      };
    }
    
    return { 
      likes: newLikes,
      success: true,
      message: 'Liked successfully',
    };
  } catch (error) {
    console.error('Error liking timelapse:', error);
    return { 
      likes: 0,
      success: false,
      error: true,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function unlikeTimelapseItem(timelapseId: string) {
  try {
    // Get current user ID
    const currentUser = await getCurrentUser();
    const userId = currentUser.uid;
    
    // First, get the current timelapse item
    const getResult = await graphqlQuery(getTimelapseItemQuery, {
      id: timelapseId,
    });
    
    if (!getResult.data || !getResult.data.getTimelapseItem) {
      return { 
        likes: 0,
        success: false,
        message: 'Timelapse item not found',
      };
    }
    
    // Extract current likes and likedBy
    const item = getResult.data.getTimelapseItem;
    const currentLikes = item.likes || 0;
    const currentLikedBy = item.likedBy || [];
    
    // Check if user has already liked this item
    if (!currentLikedBy.includes(userId)) {
      return {
        likes: currentLikes,
        success: true,
        message: 'Not liked yet',
      };
    }
    
    // Update likes count and likedBy array
    const newLikes = Math.max(0, currentLikes - 1);
    const newLikedBy = currentLikedBy.filter((id: string) => id !== userId);
    
    // Update the item
    const response = await graphqlMutation(updateTimelapseItemMutation, {
      id: timelapseId,
      likes: newLikes,
      likedBy: newLikedBy,
    });
    
    if (!response.data || !response.data.updateTimelapseItem) {
      return { 
        likes: currentLikes,
        success: false,
        message: 'Failed to update timelapse item',
      };
    }
    
    return { 
      likes: newLikes,
      success: true,
      message: 'Unliked successfully',
    };
  } catch (error) {
    console.error('Error unliking timelapse:', error);
    return { 
      likes: 0,
      success: false,
      error: true,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function deleteTimelapseItem(timelapseId: string) {
  try {
    const response = await graphqlMutation(deleteTimelapseItemMutation, {
      id: timelapseId,
    });
    
    if (!response.data) {
      throw new Error('Failed to delete timelapse item');
    }
    
    return {
      success: true,
      message: 'Timelapse deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting timelapse:', error);
    throw error;
  }
}

// REST API operations through API Gateway
export async function getUserProfile(userId: string) {
  try {
    const token = await getIdToken();
    const response = await fetch(`${config.apiGatewayEndpoint}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function getFollowedTimelapses() {
  try {
    const token = await getIdToken();
    const response = await fetch(`${config.apiGatewayEndpoint}/timelapses/following`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get followed timelapses: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting followed timelapses:', error);
    throw error;
  }
}

export async function getFollowedPosts() {
  try {
    const token = await getIdToken();
    const response = await fetch(`${config.apiGatewayEndpoint}/posts/following`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get followed posts: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting followed posts:', error);
    throw error;
  }
}

export async function getLikedTimelapses() {
  try {
    const token = await getIdToken();
    const response = await fetch(`${config.apiGatewayEndpoint}/timelapses/liked`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get liked timelapses: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching liked timelapses:', error);
    throw error;
  }
}

export async function sendSellerVerificationEmail(verificationData: any) {
  try {
    const token = await getIdToken();
    const adminEmail = 'poornima.bhogi1@gmail.com'; // Should be in environment
    
    // Format data for email
    const formattedDate = new Date().toLocaleString();
    
    // Prepare body for email
    const emailBody = {
      to: adminEmail,
      subject: `Seller Verification Request - ${verificationData.businessName} - ${formattedDate}`,
      data: verificationData,
      documentLinks: verificationData.businessDocuments || {},
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(`${config.apiGatewayEndpoint}/admin/seller-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(emailBody),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send verification email: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function saveSellerVerification(verificationData: any, userId: string) {
  try {
    const token = await getIdToken();
    const response = await fetch(`${config.apiGatewayEndpoint}/seller-verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...verificationData,
        userId,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save seller verification: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving seller verification:', error);
    throw error;
  }
}

export default {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  signOut,
  getCurrentUser,
  graphqlQuery,
  graphqlMutation,
  getMediaUrl,
  uploadToS3,
  createFeaturePost,
  likeTimelapseItem,
  unlikeTimelapseItem,
  deleteTimelapseItem,
  getUserProfile,
  getFollowedTimelapses,
  getFollowedPosts,
  getLikedTimelapses,
  sendSellerVerificationEmail,
  saveSellerVerification,
}; 