import { S3Client, PutObjectCommand } from ('@aws-sdk/client-s3');
import { getSignedUrl } from ('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    // Extract parameters from the GraphQL event
    const { fileName, fileType } = event.arguments;
    // Old version
    //const userId = event.identity.sub;

       // New version - more robust
     let userId;
     if (event.arguments.userId) {
       // Get from direct arguments when passed from client
       userId = event.arguments.userId;
     } else if (event.identity && event.identity.sub) {
       // Or from Cognito identity when authenticated through AppSync
     userId = event.identity.sub;
     } else {
      // Fallback to anonymous if no user ID available
      userId = 'anonymous';
      console.log('No user ID available, using anonymous');
     }

     // Logging for debugging
     console.log('Using userId for upload:', userId);
    
    // Generate a unique key for the file with user ID
    const timestamp = new Date().getTime();
    const key = `uploads/${userId}/${timestamp}-${fileName}`;
    
    // Create the command for S3 upload
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });
    
    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Return the result in the format expected by the GraphQL type
    return {
      uploadUrl: presignedUrl,
      fileUrl: `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key: key
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
}; 