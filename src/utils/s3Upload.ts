// Import for future component integration
import { useAuth } from '../contexts/AuthContext';
import awsConfig from '../services/aws-config';

// Client instance for potential future use
const client = awsConfig;
// Get the current user globally to avoid repeated fetches
let userAuthInfo: { isSignedIn: boolean; user: any; } | null = null;

// Get the current user's ID - initialize async
const initCurrentUser = async () => {
  try {
    userAuthInfo = await awsConfig.getCurrentUser();
    return userAuthInfo;
  } catch (error) {
    console.error('Error initializing current user:', error);
    return null;
  }
};

// Start the initialization process
initCurrentUser();

interface PresignedUrlResponse {
  data?: {
    generatePresignedUrl?: {
      uploadUrl: string;
      fileUrl: string;
      key: string;
    }
  }
}


// GraphQL mutation for generating presigned URL
const generatePresignedUrlMutation = `
  mutation GeneratePresignedUrl($fileName: String!, $fileType: String!, $userId: String!) {
    generatePresignedUrl(fileName: $fileName, fileType: $fileType, userId: $userId) {
      uploadUrl
      fileUrl
      key
    }
  }
`;

export const uploadToS3 = async (
  file: { uri: string; type: string; name: string },
  folder: string
): Promise<string> => {
  try {
    if (!file || !file.uri) {
      console.error('Invalid file object provided to uploadToS3');
      throw new Error('Invalid file: missing required properties');
    }
    
    console.log('Starting S3 upload process for file:', file.name);
    console.log('Upload destination folder:', folder);
    console.log('File type:', file.type);
    console.log('File URI:', file.uri.substring(0, 30) + '...');
    
    // Get current user ID - require authentication for production uploads
    let userId = userAuthInfo?.user?.uid;
    try {
      // If we don't have the user yet, try to get it
      if (!userAuthInfo) {
        const currentUser = await awsConfig.getCurrentUser();
        if (!currentUser || !currentUser.user?.uid) {
          throw new Error('Authentication required for file uploads');
        }
        userId = currentUser.user.uid;
        console.log('User ID for upload:', userId);
      }
      
      // Verify we have a valid user ID before proceeding
      if (!userId) {
        throw new Error('Authentication required for file uploads');
      }
    } catch (userError) {
      console.error('Authentication error:', userError);
      // In production, we don't allow anonymous uploads
      if (!__DEV__) {
        throw new Error('Authentication required for file uploads');
      } else {
        // Only in development, fall back to a test user ID
        console.warn('DEV MODE: Using test user ID for upload');
        userId = 'dev-test-user';
      }
    }
    
    // Create the file name (actual path/folder structure is handled in the Lambda)
    const fileName = `${file.name}`;
    console.log('File name for upload:', fileName);

    // Get presigned URL from GraphQL API
    console.log('Requesting presigned URL from GraphQL API');
    let response;
    try {
      response = await awsConfig.graphqlMutation(
        generatePresignedUrlMutation,
        {
          fileName: fileName,
          fileType: file.type || 'application/octet-stream',
          userId: userId // Pass the userId parameter explicitly
        }
      );
      console.log('Received response from GraphQL API:', JSON.stringify(response, null, 2));
    } catch (apiError: any) {
      console.error('Error getting presigned URL from API:', apiError);
      if (apiError?.errors) {
        console.error('GraphQL errors:', JSON.stringify(apiError.errors, null, 2));
      }
      throw new Error(`Failed to get upload URL: ${apiError.message || 'Unknown API error'}`);
    }

    // Check if response has the expected data
    if (!response || !('data' in response) || !response.data?.generatePresignedUrl) {
      console.error('Invalid response from generatePresignedUrl:', response);
      throw new Error('Failed to get upload URL: No data returned from API');
    }

    const { uploadUrl, fileUrl, key } = response.data.generatePresignedUrl;
    if (!uploadUrl || !fileUrl) {
      console.error('Missing uploadUrl or fileUrl in response:', response.data.generatePresignedUrl);
      throw new Error('Invalid presigned URL response');
    }
    
    console.log('Received presigned URL:', uploadUrl);
    console.log('File will be accessible at:', fileUrl);
    console.log('S3 object key:', key);

    // Upload file using presigned URL
    console.log('Starting file upload to S3...');
    let blob;
    try {
      // Fetch the file content as blob
      const fileResponse = await fetch(file.uri);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file content: ${fileResponse.status}`);
      }
      blob = await fileResponse.blob();
      console.log('Successfully created blob for upload, size:', blob.size);
    } catch (fileError: any) {
      console.error('Error preparing file for upload:', fileError);
      throw new Error(`Failed to prepare file for upload: ${fileError.message || 'Unknown file error'}`);
    }
    
    // Upload the blob to S3
    let uploadResponse;
    try {
      console.log('Starting upload to S3 with URL:', uploadUrl);
      uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-amz-acl': 'public-read',
          'Cache-Control': 'max-age=31536000'
        },
      });
      
      console.log('Upload response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        try {
          const errorText = await uploadResponse.text();
          console.error('S3 upload error response:', errorText);
        } catch (e) {
          console.error('Could not read error response');
        }
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }
    } catch (uploadError: any) {
      console.error('Network error during S3 upload:', uploadError);
      throw new Error(`Network error during upload: ${uploadError.message || 'Unknown upload error'}`);
    }

    console.log('Upload successful, status:', uploadResponse.status);
    console.log('Media URL to store in database:', fileUrl);

    // Return the URL where the file will be accessible
    return fileUrl;
  } catch (error) {
    console.error('Error in S3 upload process:', error);
    // Create a fallback local URL for testing if needed
    // In production, rethrow the error
    if (__DEV__) {
      console.warn('DEV MODE: Returning fallback URL for development testing');
      return `https://via.placeholder.com/150`;
    }
    throw error;
  }
}; 