import { Platform } from 'react-native';

const API_ENDPOINT = 'YOUR_API_GATEWAY_ENDPOINT'; // Get this from Terraform output

export const uploadToS3 = async (
  file: { uri: string; type: string; name: string },
  folder: string
): Promise<string> => {
  try {
    // Get presigned URL from our backend
    const response = await fetch(`${API_ENDPOINT}/generate-presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, fileUrl } = await response.json();

    // Upload file using presigned URL
    await fetch(uploadUrl, {
      method: 'PUT',
      body: await fetch(file.uri).then(r => r.blob()),
      headers: {
        'Content-Type': file.type,
      },
    });

    return fileUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}; 