import { Auth, API, Storage } from 'aws-amplify';

// Configure AWS Amplify
const configureAmplify = () => {
  Auth.configure({
    // Amazon Cognito User Pool ID
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-east-1_xxxxxxxx',
    
    // Amazon Cognito Web Client ID
    userPoolWebClientId: process.env.REACT_APP_COGNITO_APP_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    
    // Amazon Cognito Identity Pool ID
    identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID || 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    
    // Region
    region: 'us-east-1',
    
    // Auth mechanisms
    authenticationFlowType: 'USER_SRP_AUTH',
  });

  Storage.configure({
    // S3 bucket name
    bucket: process.env.REACT_APP_S3_BUCKET_NAME || 'timelapse-media-storage',
    region: 'us-east-1',
    
    // Level of access - public for viewing media, private for user-specific media
    level: 'public',
  });

  API.configure({
    endpoints: [
      {
        name: 'TimelapseAPI',
        endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com',
      },
    ],
  });
};

// Helper functions for API calls
const API_NAME = 'TimelapseAPI';

// Get user profile
export const getUserProfile = async (userId: string) => {
  try {
    return await API.get(API_NAME, `/users/${userId}`, {});
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Get followed users timelapses
export const getFollowedTimelapses = async () => {
  try {
    return await API.get(API_NAME, '/timelapses/following', {});
  } catch (error) {
    console.error('Error getting followed timelapses:', error);
    throw error;
  }
};

// Get followed users posts
export const getFollowedPosts = async () => {
  try {
    return await API.get(API_NAME, '/posts/following', {});
  } catch (error) {
    console.error('Error getting followed posts:', error);
    throw error;
  }
};

// Get S3 URL for media
export const getMediaUrl = async (key: string) => {
  try {
    return await Storage.get(key);
  } catch (error) {
    console.error('Error getting media URL:', error);
    throw error;
  }
};

export { configureAmplify };
export default {
  configureAmplify,
  getUserProfile,
  getFollowedTimelapses,
  getFollowedPosts,
  getMediaUrl,
}; 