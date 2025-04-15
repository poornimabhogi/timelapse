/**
 * Utility for centralized error handling
 */

// Function to safely log errors, including GraphQL errors
export const logError = (error: any, context: string = '') => {
  console.error(`Error in ${context}:`, error);
  
  // Log detailed error information
  if (error instanceof Error) {
    console.error('Error details:', error.message, error.stack);
  } else if (typeof error === 'object' && error !== null) {
    try {
      console.error('Error object:', JSON.stringify(error, null, 2));
    } catch (jsonError) {
      console.error('Error (non-serializable):', Object.keys(error));
    }
    
    // Handle GraphQL errors
    if ('errors' in error && Array.isArray(error.errors)) {
      console.error('GraphQL errors:');
      error.errors.forEach((err: any, index: number) => {
        console.error(`GraphQL error ${index + 1}:`, err.message);
        if (err.locations) console.error('Locations:', err.locations);
        if (err.path) console.error('Path:', err.path);
      });
    }
  } else {
    console.error('Unknown error type:', error);
  }
};

// Function to get an appropriate fallback URL for media
export const getFallbackMediaUrl = (mediaType: string = 'unknown'): string => {
  const lowerType = mediaType.toLowerCase();
  
  if (lowerType.includes('video') || lowerType.endsWith('.mp4') || lowerType.endsWith('.mov')) {
    return 'https://via.placeholder.com/400?text=Video+Unavailable';
  } else if (lowerType.includes('image') || lowerType.endsWith('.jpg') || lowerType.endsWith('.png')) {
    return 'https://via.placeholder.com/400?text=Image+Unavailable';
  } else {
    return 'https://via.placeholder.com/400?text=Media+Unavailable';
  }
};

// Function to extract error message from various formats
export const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'object' && error !== null) {
    if ('message' in error) return error.message;
    
    // Handle GraphQL errors
    if ('errors' in error && Array.isArray(error.errors) && error.errors.length > 0) {
      if (error.errors[0].message) return error.errors[0].message;
    }
    
    return JSON.stringify(error);
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'Unknown error occurred';
  }
};

export default {
  logError,
  getFallbackMediaUrl,
  getErrorMessage
}; 