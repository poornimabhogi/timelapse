// No Platform import needed
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient, GraphQLResult } from 'aws-amplify/api';

// Create a GraphQL client
const client = generateClient();

// Define response type
interface PresignedUrlResponse {
  generatePresignedUrl: {
    uploadUrl: string;
    fileUrl: string;
    key: string;
  }
}

// GraphQL mutation for generating presigned URL
const generatePresignedUrlMutation = `
  mutation GeneratePresignedUrl($fileName: String!, $fileType: String!) {
    generatePresignedUrl(fileName: $fileName, fileType: $fileType) {
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
    console.log('Starting S3 upload process for file:', file.name);
    console.log('Upload destination folder:', folder);
    
    // Get current user ID for folder structure - this is now handled in the Lambda
    const currentUser = await getCurrentUser();
    const userId = currentUser.userId;
    console.log('User ID for upload:', userId);
    
    // Create the file name (actual path/folder structure is handled in the Lambda)
    const fileName = `${file.name}`;
    console.log('File name for upload:', fileName);

    // Get presigned URL from GraphQL API
    console.log('Requesting presigned URL from GraphQL API');
    const response = await client.graphql<PresignedUrlResponse>({
      query: generatePresignedUrlMutation,
      variables: {
        fileName: fileName,
        fileType: file.type,
      }
    });

    // Check if response has the expected data
    if (!('data' in response) || !response.data?.generatePresignedUrl) {
      throw new Error('Failed to get upload URL: No data returned from API');
    }

    const { uploadUrl, fileUrl } = response.data.generatePresignedUrl;
    console.log('Received presigned URL:', uploadUrl);
    console.log('File will be accessible at:', fileUrl);

    // Upload file using presigned URL
    console.log('Starting file upload to S3...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: await fetch(file.uri).then(r => r.blob()),
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!uploadResponse.ok) {
      const uploadErrorText = await uploadResponse.text();
      console.error('Failed to upload to S3. Status:', uploadResponse.status, 'Error:', uploadErrorText);
      throw new Error(`Failed to upload to S3: ${uploadResponse.status} - ${uploadErrorText}`);
    }
    
    console.log('File successfully uploaded to S3!');
    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}; 