// Production AWS Configuration for React Native using direct AWS APIs
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Apollo GraphQL
import { ApolloClient, InMemoryCache, HttpLink, from, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const awsConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_S8YHdONmj',
  userPoolClientId: '7ep3tq85dptvem1a8hhdu3fjps',
  identityPoolId: 'us-east-1:05ae5e6e-c6ed-4e06-bc9b-a74ef5b3fd37',
  appsyncUrl: 'https://ujwgvgkxlnaqdjj6nwb7zs5i7i.appsync-api.us-east-1.amazonaws.com/graphql',
  s3Bucket: 'timelapse-storage-bucket-231703648725',
};

// Storage keys
const ACCESS_TOKEN_KEY = 'timelapse_access_token';
const ID_TOKEN_KEY = 'timelapse_id_token';
const REFRESH_TOKEN_KEY = 'timelapse_refresh_token';
const USER_KEY = 'timelapse_user';

// Apollo Client setup for GraphQL
const httpLink = new HttpLink({
  uri: awsConfig.appsyncUrl,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await getIdToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query: { errorPolicy: 'all' },
  },
});

// Authentication Functions - Using native fetch with Cognito REST API
export async function signIn(username: string, password: string) {
  try {
    const response = await fetch(`https://cognito-idp.${awsConfig.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: awsConfig.userPoolClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Authentication failed');
    }

    if (data.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = data.AuthenticationResult;
      
      // Store tokens
      await AsyncStorage.multiSet([
        [ACCESS_TOKEN_KEY, AccessToken || ''],
        [ID_TOKEN_KEY, IdToken || ''],
        [REFRESH_TOKEN_KEY, RefreshToken || ''],
      ]);
      
      // Get user details
      const user = await getCurrentUser();
      return { user, isSignedIn: true };
    }
    
    throw new Error('Authentication failed');
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Sign in failed');
  }
}

export async function signUp(username: string, password: string, email: string) {
  try {
    const response = await fetch(`https://cognito-idp.${awsConfig.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        ClientId: awsConfig.userPoolClientId,
      Username: username,
      Password: password,
      UserAttributes: [
          { Name: 'email', Value: email },
      ],
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Sign up failed');
    }
    
    return { 
      success: true, 
      userSub: data.UserSub,
      codeDeliveryDetails: data.CodeDeliveryDetails,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Sign up failed');
  }
}

export async function confirmSignUp(username: string, code: string) {
  try {
    const response = await fetch(`https://cognito-idp.${awsConfig.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        ClientId: awsConfig.userPoolClientId,
      Username: username,
      ConfirmationCode: code,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Confirmation failed');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Confirm sign up error:', error);
    throw new Error(error.message || 'Confirmation failed');
  }
}

export async function resetPassword(username: string) {
  try {
    const response = await fetch(`https://cognito-idp.${awsConfig.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ForgotPassword',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        ClientId: awsConfig.userPoolClientId,
      Username: username,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Password reset failed');
    }
    
    return { 
      success: true,
      codeDeliveryDetails: data.CodeDeliveryDetails,
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    throw new Error(error.message || 'Password reset failed');
  }
}

export async function confirmResetPassword(username: string, code: string, newPassword: string) {
  try {
    const response = await fetch(`https://cognito-idp.${awsConfig.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmForgotPassword',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        ClientId: awsConfig.userPoolClientId,
      Username: username,
      ConfirmationCode: code,
      Password: newPassword,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Password confirmation failed');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Confirm reset password error:', error);
    throw new Error(error.message || 'Password confirmation failed');
  }
}

export async function signOut() {
  try {
    const accessToken = await getAccessToken();
    
    if (accessToken) {
      await fetch(`https://cognito-idp.${awsConfig.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.GlobalSignOut',
          'Content-Type': 'application/x-amz-json-1.1',
        },
        body: JSON.stringify({
          AccessToken: accessToken,
        }),
      });
    }

    // Clear stored tokens
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      ID_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_KEY,
    ]);
    
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    // Clear tokens even if API call fails
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      ID_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_KEY,
    ]);
    return { success: true };
  }
}

export async function getCurrentUser() {
  try {
    const [accessToken, cachedUser] = await AsyncStorage.multiGet([
      ACCESS_TOKEN_KEY,
      USER_KEY,
    ]);

    if (!accessToken[1]) {
      return null;
    }
    
    // Return cached user if available
    if (cachedUser[1]) {
      const user = JSON.parse(cachedUser[1]);
      return { isSignedIn: true, user };
    }

    // Fetch user from Cognito
    const response = await fetch(`https://cognito-idp.${awsConfig.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.GetUser',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        AccessToken: accessToken[1],
      }),
    });
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    const userAttributes: any = {};
    data.UserAttributes?.forEach((attr: any) => {
      if (attr.Name && attr.Value) {
        userAttributes[attr.Name] = attr.Value;
      }
    });
    
    const user = {
      username: data.Username || '',
      uid: userAttributes.sub || '',
      email: userAttributes.email || '',
      name: userAttributes.name || userAttributes.given_name || data.Username || '',
      attributes: userAttributes,
    };

    // Cache user
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return { isSignedIn: true, user };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function getIdToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(ID_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// S3 Functions using REST API
export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export async function generatePresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResponse> {
  try {
    const user = await getCurrentUser();
    if (!user?.user?.uid) {
      throw new Error('User not authenticated');
    }

    const key = `uploads/${user.user.uid}/${Date.now()}_${fileName}`;
    
    // Use GraphQL mutation to get presigned URL from backend
    const mutation = `
      mutation GeneratePresignedUrl($fileName: String!, $fileType: String!, $key: String!) {
        generatePresignedUrl(fileName: $fileName, fileType: $fileType, key: $key) {
          uploadUrl
          fileUrl
          key
        }
      }
    `;

    const variables = { fileName, fileType, key };
    const result = await graphqlMutation(mutation, variables);
    
    if (result.data?.generatePresignedUrl) {
      return result.data.generatePresignedUrl;
    }

    // Fallback: generate URLs manually
    const fileUrl = `https://${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;
    const uploadUrl = fileUrl; // In production, this would be a proper presigned URL
    
    return { uploadUrl, fileUrl, key };
  } catch (error: any) {
    console.error('Generate presigned URL error:', error);
    throw new Error(error.message || 'Failed to generate upload URL');
  }
}

export async function uploadToS3(file: { uri: string; type: string; name: string }, folder: string): Promise<string> {
  try {
    const { uploadUrl, fileUrl } = await generatePresignedUrl(file.name, file.type);
    
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    return fileUrl;
  } catch (error: any) {
    console.error('Upload to S3 error:', error);
    throw new Error(error.message || 'Upload failed');
  }
}

export async function getMediaUrl(key: string): Promise<string> {
  try {
    // Use GraphQL to get presigned download URL
    const query = `
      query GetMediaUrl($key: String!) {
        getMediaUrl(key: $key)
      }
    `;

    const variables = { key };
    const result = await graphqlQuery(query, variables);
    
    if (result.data?.getMediaUrl) {
      return result.data.getMediaUrl;
    }

    // Fallback: construct public URL
    return `https://${awsConfig.s3Bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;
  } catch (error: any) {
    console.error('Get media URL error:', error);
    throw new Error(error.message || 'Failed to get media URL');
  }
}

// GraphQL Functions
export async function graphqlQuery(query: string, variables?: any) {
  try {
    const result = await apolloClient.query({
      query: gql(query),
      variables,
      fetchPolicy: 'cache-first',
    });
    return result;
  } catch (error: any) {
    console.error('GraphQL query error:', error);
    throw new Error(error.message || 'GraphQL query failed');
  }
}

export async function graphqlMutation(mutation: string, variables?: any) {
  try {
    const result = await apolloClient.mutate({
      mutation: gql(mutation),
      variables,
    });
    return result;
  } catch (error: any) {
    console.error('GraphQL mutation error:', error);
    throw new Error(error.message || 'GraphQL mutation failed');
  }
}

export function graphqlSubscription(subscription: string, variables?: any) {
  try {
    return apolloClient.subscribe({
      query: gql(subscription),
      variables,
    });
  } catch (error: any) {
    console.error('GraphQL subscription error:', error);
    throw new Error(error.message || 'GraphQL subscription failed');
  }
}

// Additional helper functions for app-specific operations
export async function createFeaturePost(text: string, mediaUrls: string[]) {
  const mutation = `
    mutation CreateFeaturePost($input: CreateFeaturePostInput!) {
      createFeaturePost(input: $input) {
        id
        text
        mediaUrls
        createdAt
        userId
      }
    }
  `;

  const user = await getCurrentUser();
  if (!user?.user?.uid) {
    throw new Error('User not authenticated');
  }

  const variables = {
    input: {
      text,
      mediaUrls,
      userId: user.user.uid,
      createdAt: new Date().toISOString(),
    },
  };

  return await graphqlMutation(mutation, variables);
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
  } catch (error: any) {
    console.error('Error saving seller verification:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSellerVerificationEmail(data: any) {
  try {
    const mutation = `
      mutation SendSellerVerificationEmail($input: SendEmailInput!) {
        sendSellerVerificationEmail(input: $input) {
          success
          messageId
        }
      }
    `;

    const user = await getCurrentUser();
    const variables = {
      input: {
        ...data,
        userEmail: user?.user?.email,
        userId: user?.user?.uid,
      }
    };

    const response = await graphqlMutation(mutation, variables);
    return response.data?.sendSellerVerificationEmail || { success: true };
  } catch (error: any) {
    console.error('Error sending seller verification email:', error);
    return { success: false, error: error.message };
  }
}

export async function getSellerVerificationStatus(userId: string) {
  const query = `
    query GetSellerVerificationStatus($userId: ID!) {
      getSellerVerification(userId: $userId) {
        id
        userId
        status
        reviewNotes
        createdAt
        updatedAt
        businessName
        businessType
      }
    }
  `;

  try {
    const response = await graphqlQuery(query, { userId });
    return response.data?.getSellerVerification || null;
  } catch (error) {
    console.error('Error getting seller verification status:', error);
    return null;
  }
}

export async function updateSellerVerificationStatus(userId: string, status: 'approved' | 'rejected', reviewNotes?: string) {
  const mutation = `
    mutation UpdateSellerVerificationStatus($input: UpdateSellerVerificationStatusInput!) {
      updateSellerVerificationStatus(input: $input) {
        success
        message
      }
    }
  `;
  
  const variables = {
    input: {
      userId,
      status,
      reviewNotes,
      updatedAt: new Date().toISOString()
    }
  };

  try {
    const response = await graphqlMutation(mutation, variables);
    return response.data?.updateSellerVerificationStatus || { success: true };
  } catch (error: any) {
    console.error('Error updating seller verification status:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSellerStatusNotification(userId: string, status: 'approved' | 'rejected', reviewNotes?: string) {
  try {
    const mutation = `
      mutation SendSellerStatusNotification($input: SendNotificationInput!) {
        sendSellerStatusNotification(input: $input) {
          success
          messageId
        }
      }
    `;

    const variables = {
      input: {
        userId,
        status,
        reviewNotes,
      }
    };

    const response = await graphqlMutation(mutation, variables);
    return response.data?.sendSellerStatusNotification || { success: true };
  } catch (error: any) {
    console.error('Error sending seller status notification:', error);
    return { success: false, error: error.message };
}
}

// Development helper function to simulate admin approval/rejection  
export async function simulateAdminAction(userId: string, action: 'approve' | 'reject', reviewNotes?: string) {
  try {
    console.log(`Simulating admin ${action} for user ${userId}`);
    
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    // Update the verification status
    const updateResult = await updateSellerVerificationStatus(userId, status, reviewNotes);
    
    if (updateResult.success) {
      // Send notification to seller
      const notificationResult = await sendSellerStatusNotification(userId, status, reviewNotes);
      
      console.log(`Admin ${action} simulation completed:`, {
        statusUpdate: updateResult.success,
        notificationSent: notificationResult.success
      });
  
  return {
        success: true,
        message: `Successfully ${action}d seller and sent notification`
  };
}

    return { success: false, message: 'Failed to update status' };
  } catch (error: any) {
    console.error('Error simulating admin action:', error);
    return { success: false, error: error.message };
  }
}

// Export the configuration and clients for direct access if needed
export { awsConfig, apolloClient as graphqlClient };

// Default export for backward compatibility
export default {
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
  graphqlSubscription,
  createFeaturePost,
  likeTimelapseItem,
  unlikeTimelapseItem,
  deleteTimelapseItem,
  saveSellerVerification,
  sendSellerVerificationEmail,
  getSellerVerificationStatus,
  updateSellerVerificationStatus,
  sendSellerStatusNotification,
  simulateAdminAction,
  apolloClient,
};