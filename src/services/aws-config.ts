import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from '@aws-amplify/auth';
import { post, get } from '@aws-amplify/api';
import { uploadData, getUrl } from '@aws-amplify/storage';

// Configure AWS Amplify
const configureAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || 'us-east-1_xxxxxxxx',
        userPoolClientId: process.env.REACT_APP_COGNITO_APP_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
        identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID || 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      },
    },
    Storage: {
      S3: {
        bucket: process.env.REACT_APP_S3_BUCKET_NAME || 'timelapse-media-storage',
      },
    },
    API: {
      REST: {
        TimelapseAPI: {
          endpoint: process.env.REACT_APP_API_ENDPOINT || 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com',
        },
      },
    },
  });
};

// Helper functions for API calls
const API_NAME = 'TimelapseAPI';

// Get user profile
export const getUserProfile = async (userId: string) => {
  try {
    return await get({ apiName: API_NAME, path: `/users/${userId}` });
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Get followed users timelapses
export const getFollowedTimelapses = async () => {
  try {
    return await get({ apiName: API_NAME, path: '/timelapses/following' });
  } catch (error) {
    console.error('Error getting followed timelapses:', error);
    throw error;
  }
};

// Get followed users posts
export const getFollowedPosts = async () => {
  try {
    return await get({ apiName: API_NAME, path: '/posts/following' });
  } catch (error) {
    console.error('Error getting followed posts:', error);
    throw error;
  }
};

// Get S3 URL for media
export const getMediaUrl = async (key: string) => {
  try {
    return await getUrl({ key });
  } catch (error) {
    console.error('Error getting media URL:', error);
    throw error;
  }
};

const getFeaturePosts = async (limit: number = 20, nextToken?: string) => {
  try {
    const response = await post({
      apiName: API_NAME,
      path: '/feature-posts',
      options: {
        body: JSON.stringify({ limit, nextToken }),
      },
    });
    return response;
  } catch (error) {
    console.error('Error fetching feature posts:', error);
    throw error;
  }
};

const createFeaturePost = async (text: string, mediaUrls: string[]) => {
  try {
    const response = await post({
      apiName: API_NAME,
      path: '/feature-posts',
      options: {
        body: JSON.stringify({
          text,
          mediaUrls,
          likes: 0,
        }),
      },
    });
    return response;
  } catch (error) {
    console.error('Error creating feature post:', error);
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
  getFeaturePosts,
  createFeaturePost,
}; 