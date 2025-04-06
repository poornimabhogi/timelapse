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

// Send seller verification data to admin
export const sendSellerVerificationEmail = async (
  verificationData: any,
  adminEmail: string = 'poornima.bhogi1@gmail.com'
) => {
  try {
    // Get current authenticated user info to include in the request
    const authSession = await fetchAuthSession();
    const idToken = authSession.tokens?.idToken?.toString();
    
    if (!idToken) {
      throw new Error('User not authenticated or token is missing');
    }
    
    // Format data for email
    const formattedDate = new Date().toLocaleString();
    
    // Prepare body for email
    const emailBody = {
      to: adminEmail,
      subject: `Seller Verification Request - ${verificationData.businessName} - ${formattedDate}`,
      data: verificationData,
      // Include document links if available
      documentLinks: verificationData.businessDocuments || {},
      timestamp: new Date().toISOString()
    };
    
    // Send email via API
    const response = await post({
      apiName: API_NAME,
      path: '/admin/seller-verification',
      options: {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(emailBody),
      },
    });
    
    console.log('Verification email sent successfully', response);
    return response;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Save seller verification data to database
export const saveSellerVerification = async (verificationData: any, userId: string) => {
  try {
    const response = await post({
      apiName: API_NAME,
      path: '/seller-verifications',
      options: {
        body: JSON.stringify({
          ...verificationData,
          userId,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        }),
      },
    });
    
    console.log('Seller verification saved successfully', response);
    return response;
  } catch (error) {
    console.error('Error saving seller verification:', error);
    throw error;
  }
};

// Use a simple in-memory cache for demo purposes
const demoLikeCache: Record<string, number> = {};

// Modify like function to use consistent values
export const likeTimelapseItem = async (timelapseId: string) => {
  try {
    console.log(`Starting likeTimelapseItem for timelapse: ${timelapseId}`);
    const authSession = await fetchAuthSession();
    const idToken = authSession.tokens?.idToken?.toString();
    
    if (!idToken) {
      throw new Error('User not authenticated or token is missing');
    }
    
    // For demo/testing, since we may not have a real backend yet
    const isDemo = true; // Set to false when real backend is ready
    
    if (isDemo) {
      console.log('DEMO MODE: Using cached likes values');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Initialize if first time
      if (demoLikeCache[timelapseId] === undefined) {
        demoLikeCache[timelapseId] = Math.floor(Math.random() * 5); // Start with 0-4 likes
      }
      
      // Increment like count
      demoLikeCache[timelapseId] += 1;
      
      console.log(`DEMO: Timelapse ${timelapseId} now has ${demoLikeCache[timelapseId]} likes`);
      
      return { 
        likes: demoLikeCache[timelapseId],
        success: true,
        message: 'Liked successfully (demo mode)',
      };
    }
    
    // Real API code for when backend is ready
    console.log(`Making API call to like timelapse: ${timelapseId}`);
    const response = await post({
      apiName: API_NAME,
      path: `/timelapses/${timelapseId}/like`,
      options: {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    });
    
    console.log('Like API response:', response);
    
    // If response doesn't have likes count, add mock data
    if (!response || (response as any).likes === undefined) {
      console.log('API did not return likes count, adding mock data');
      return { 
        ...response,
        likes: Math.floor(Math.random() * 20) + 1,
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error liking timelapse:', error);
    // Return a mock response for demo purposes
    return { 
      likes: Math.floor(Math.random() * 20) + 1,
      error: true,
      message: 'Error occurred but showing mock data',
    };
  }
};

// Modify unlike function to use consistent values
export const unlikeTimelapseItem = async (timelapseId: string) => {
  try {
    console.log(`Starting unlikeTimelapseItem for timelapse: ${timelapseId}`);
    const authSession = await fetchAuthSession();
    const idToken = authSession.tokens?.idToken?.toString();
    
    if (!idToken) {
      throw new Error('User not authenticated or token is missing');
    }
    
    // For demo/testing, since we may not have a real backend yet
    const isDemo = true; // Set to false when real backend is ready
    
    if (isDemo) {
      console.log('DEMO MODE: Using cached likes values');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Initialize if first time
      if (demoLikeCache[timelapseId] === undefined) {
        demoLikeCache[timelapseId] = Math.floor(Math.random() * 10) + 1; // Start with 1-10 likes
      }
      
      // Decrement like count (min 0)
      demoLikeCache[timelapseId] = Math.max(0, demoLikeCache[timelapseId] - 1);
      
      console.log(`DEMO: Timelapse ${timelapseId} now has ${demoLikeCache[timelapseId]} likes`);
      
      return { 
        likes: demoLikeCache[timelapseId],
        success: true,
        message: 'Unliked successfully (demo mode)',
      };
    }
    
    // Real API code for when backend is ready
    console.log(`Making API call to unlike timelapse: ${timelapseId}`);
    const response = await post({
      apiName: API_NAME,
      path: `/timelapses/${timelapseId}/unlike`,
      options: {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    });
    
    console.log('Unlike API response:', response);
    
    // If response doesn't have likes count, add mock data
    if (!response || (response as any).likes === undefined) {
      console.log('API did not return likes count, adding mock data');
      return { 
        ...response,
        likes: Math.max(0, Math.floor(Math.random() * 10)),
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error unliking timelapse:', error);
    // Return a mock response for demo purposes
    return { 
      likes: Math.max(0, Math.floor(Math.random() * 10)),
      error: true,
      message: 'Error occurred but showing mock data',
    };
  }
};

// Get timelapses liked by current user
export const getLikedTimelapses = async () => {
  try {
    const authSession = await fetchAuthSession();
    const idToken = authSession.tokens?.idToken?.toString();
    
    if (!idToken) {
      throw new Error('User not authenticated or token is missing');
    }
    
    const response = await get({
      apiName: API_NAME,
      path: '/timelapses/liked',
      options: {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    });
    
    console.log('Fetched liked timelapses', response);
    return response;
  } catch (error) {
    console.error('Error fetching liked timelapses:', error);
    throw error;
  }
};

// Delete a timelapse (only for user's own timelapses)
export const deleteTimelapseItem = async (timelapseId: string) => {
  try {
    const authSession = await fetchAuthSession();
    const idToken = authSession.tokens?.idToken?.toString();
    
    if (!idToken) {
      throw new Error('User not authenticated or token is missing');
    }
    
    const response = await post({
      apiName: API_NAME,
      path: `/timelapses/${timelapseId}/delete`,
      options: {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    });
    
    console.log('Timelapse deleted successfully', response);
    return response;
  } catch (error) {
    console.error('Error deleting timelapse:', error);
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
  sendSellerVerificationEmail,
  saveSellerVerification,
  likeTimelapseItem,
  unlikeTimelapseItem,
  getLikedTimelapses,
  deleteTimelapseItem,
}; 