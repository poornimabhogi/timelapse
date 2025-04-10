const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    // Extract parameters from the GraphQL event
    const { fileName, fileType } = event.arguments;
    const userId = event.identity.sub;
    
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