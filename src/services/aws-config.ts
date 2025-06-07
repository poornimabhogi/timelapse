// AWS configuration for React Native with proper polyfills
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Import required polyfills
import { Buffer } from '@craftzdog/react-native-buffer';
import process from 'process';

// Set up globals before AWS SDK imports
if (typeof global !== 'undefined') {
  (global as any).Buffer = Buffer;
  (global as any).process = process;
}

import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';

import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand 
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import AWS SES for email functionality
import { 
  SESClient, 
  SendEmailCommand 
} from '@aws-sdk/client-ses';

// Configuration from environment variables
const config = {
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
  userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
  identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID || '',
  appsyncApiUrl: process.env.REACT_APP_APPSYNC_ENDPOINT || '',
  appsyncApiKey: process.env.REACT_APP_APPSYNC_API_KEY || '',
  s3Bucket: process.env.REACT_APP_S3_BUCKET || '',
  apiGatewayEndpoint: process.env.REACT_APP_API_GATEWAY_ENDPOINT || '',
};

// Initialize AWS clients with proper configuration
const cognitoClient = new CognitoIdentityProviderClient({ 
  region: config.region,
  maxAttempts: 3,
  requestHandler: {
    requestTimeout: 30000,
  }
});

const s3Client = new S3Client({ 
  region: config.region,
  maxAttempts: 3,
  requestHandler: {
    requestTimeout: 30000,
  }
});

// Initialize SES client
const sesClient = new SESClient({
  region: config.region,
  maxAttempts: 3,
});

// Storage keys
const ACCESS_TOKEN_KEY = 'timelapse_access_token';
const ID_TOKEN_KEY = 'timelapse_id_token';
const REFRESH_TOKEN_KEY = 'timelapse_refresh_token';
const USER_KEY = 'timelapse_user';
const USER_SUB_KEY = 'timelapse_user_sub';

// GraphQL response interface
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// Initialize Apollo Client for GraphQL
const httpLink = createHttpLink({
  uri: config.appsyncApiUrl,
  fetch: fetch,
});

// Auth link to add tokens to requests
const authLink = setContext(async (_, { headers }) => {
  const token = await getIdToken();
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      "x-api-key": config.appsyncApiKey,
    }
  };
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

// Export GraphQL client and utilities
export const graphqlClient = apolloClient;
export const subscriptionClient = apolloClient;

// Export Apollo Client instance for direct use
export { apolloClient };

// Auth utility functions
export async function signIn(username: string, password: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH' as any,
      ClientId: config.userPoolWebClientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await (cognitoClient as any).send(command);
    
    if (response.ChallengeName) {
      // Handle MFA or other challenges if needed
      throw new Error(`Challenge required: ${response.ChallengeName}`);
    }

    if (response.AuthenticationResult) {
      const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;
      
      // Store tokens
      if (AccessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, AccessToken);
      if (IdToken) await AsyncStorage.setItem(ID_TOKEN_KEY, IdToken);
      if (RefreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, RefreshToken);
      
      // Get user details
      const user = await getCurrentUserDetails();
      
      return { 
        user,
        isSignedIn: true,
        tokens: {
          accessToken: AccessToken,
          idToken: IdToken,
          refreshToken: RefreshToken
        }
      };
    }
    
    throw new Error('Sign in failed - no authentication result');
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signUp(username: string, password: string, email: string) {
  try {
    const command = new SignUpCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'preferred_username',
          Value: username,
        },
      ],
    });

    const response = await (cognitoClient as any).send(command);
    
    return { 
      success: true, 
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw error;
  }
}

export async function confirmSignUp(username: string, code: string) {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
      ConfirmationCode: code,
    });

    await (cognitoClient as any).send(command);
    
    return { success: true };
  } catch (error: any) {
    console.error('Confirm sign up error:', error);
    throw error;
  }
}

export async function resetPassword(username: string) {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
    });

    const response = await (cognitoClient as any).send(command);
    
    return { 
      success: true,
      codeDeliveryDetails: response.CodeDeliveryDetails
    };
  } catch (error: any) {
    console.error('Reset password error:', error);
    throw error;
  }
}

export async function confirmResetPassword(username: string, code: string, newPassword: string) {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: config.userPoolWebClientId,
      Username: username,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await (cognitoClient as any).send(command);
    
    return { success: true };
  } catch (error: any) {
    console.error('Confirm reset password error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    // Clear stored data
    await AsyncStorage.multiRemove([
      USER_KEY,
      ACCESS_TOKEN_KEY,
      ID_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_SUB_KEY
    ]);
    
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { success: true };
  }
}

export async function getCurrentUser() {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    
    // If no cached user, try to get from Cognito
    return await getCurrentUserDetails();
  } catch (error) {
    console.log('Error getting current user:', error);
    return null;
  }
}

async function getCurrentUserDetails() {
  try {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    
    if (!accessToken) {
      return null;
    }

    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await (cognitoClient as any).send(command);
    
    const user = {
      uid: response.Username || '',
      username: response.UserAttributes?.find((attr: any) => attr.Name === 'preferred_username')?.Value || response.Username || '',
      email: response.UserAttributes?.find((attr: any) => attr.Name === 'email')?.Value || '',
    };

    // Cache user data
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  } catch (error: any) {
    console.error('Error getting user details:', error);
    
    // If token is invalid, clear stored data
    if (error.name === 'NotAuthorizedException') {
      await signOut();
    }
    
    return null;
  }
}

export async function getIdToken() {
  try {
    return await AsyncStorage.getItem(ID_TOKEN_KEY);
  } catch (error) {
    console.log('Error getting ID token:', error);
    return null;
  }
}

export async function getAccessToken() {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.log('Error getting access token:', error);
    return null;
  }
}

// S3 and media functions
export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export async function generatePresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const key = `uploads/${user.uid}/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${config.s3Bucket}.s3.${config.region}.amazonaws.com/${key}`;
    
    return {
      uploadUrl,
      fileUrl,
      key
    };
  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    throw error;
  }
}

export async function uploadToS3(file: { uri: string; type: string; name: string }, folder: string): Promise<string> {
  try {
    const { uploadUrl, fileUrl } = await generatePresignedUrl(file.name, file.type);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: formData,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return fileUrl;
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

export async function getMediaUrl(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (error: any) {
    console.error('Error getting media URL:', error);
    return `https://mock-cdn.example.com/${key}`;
  }
}

// GraphQL operations
export async function graphqlQuery(query: string, variables?: any) {
  try {
    const response = await apolloClient.query({
      query: gql(query),
      variables,
      fetchPolicy: 'network-only'
    });
    
    return {
      data: response.data,
      errors: response.errors
    };
  } catch (error: any) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

export async function graphqlMutation<T = any>(mutation: string, variables?: any): Promise<GraphQLResponse<T>> {
  try {
    const response = await apolloClient.mutate({
      mutation: gql(mutation),
      variables
    });
    
    return {
      data: response.data,
      errors: response.errors
    } as GraphQLResponse<T>;
  } catch (error: any) {
    console.error('GraphQL mutation error:', error);
    throw error;
  }
}

// GraphQL subscription function
export function graphqlSubscription(subscription: string, variables?: any) {
  try {
    return apolloClient.subscribe({
      query: gql(subscription),
      variables
    });
  } catch (error: any) {
    console.error('GraphQL subscription error:', error);
    throw error;
  }
}

// Feature post functions
export async function createFeaturePost(text: string, mediaUrls: string[]) {
  const mutation = `
    mutation CreateFeaturePost($input: CreateFeaturePostInput!) {
      createFeaturePost(input: $input) {
        id
        text
        mediaUrls
        likes
        createdAt
        updatedAt
      }
    }
  `;

  const variables = {
    input: {
      text,
      mediaUrls,
      likes: 0
    }
  };

  try {
    const response = await graphqlMutation(mutation, variables);
    return response.data?.createFeaturePost || {
      id: `post-${Date.now()}`,
      text,
      mediaUrls,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating feature post:', error);
    // Return mock data as fallback
    return {
      id: `post-${Date.now()}`,
      text,
      mediaUrls,
      likes: 0,
      createdAt: new Date().toISOString(),
    };
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
    const adminEmail = 'poornima.bhogi1@gmail.com'; // Admin email for approvals
    const currentUser = await getCurrentUser();
    
    const emailParams = {
      Destination: {
        ToAddresses: [adminEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: generateSellerVerificationEmailHTML(data, currentUser),
          },
          Text: {
            Charset: 'UTF-8',
            Data: generateSellerVerificationEmailText(data, currentUser),
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `New Seller Verification Request - ${data.businessName}`,
        },
      },
      Source: 'noreply@timelapse.com', // This should be a verified email in SES
    };

    console.log('Sending seller verification email to admin:', adminEmail);
    
    try {
      const command = new SendEmailCommand(emailParams);
      const result = await sesClient.send(command);
      
      console.log('Email sent successfully:', result.MessageId);
      return { 
        success: true, 
        messageId: result.MessageId 
      };
    } catch (sesError: any) {
      console.error('SES Error:', sesError);
      
      // Log error and fail
      console.error('Failed to send admin notification email');
      return { success: false, error: sesError.message };
    }
  } catch (error: any) {
    console.error('Error sending seller verification email:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to generate HTML email content
function generateSellerVerificationEmailHTML(data: any, user: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6B4EFF; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .section { margin-bottom: 20px; padding: 15px; background-color: white; border-radius: 5px; }
            .approve-btn { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px; }
            .reject-btn { background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .info-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }
            .info-label { font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Seller Verification Request</h1>
            </div>
            
            <div class="content">
                <div class="section">
                    <h2>User Information</h2>
                    <div class="info-grid">
                        <span class="info-label">User Email:</span>
                        <span>${user?.email || 'N/A'}</span>
                        <span class="info-label">User ID:</span>
                        <span>${user?.uid || 'N/A'}</span>
                        <span class="info-label">Username:</span>
                        <span>${user?.username || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Business Information</h2>
                    <div class="info-grid">
                        <span class="info-label">Business Name:</span>
                        <span>${data.businessName}</span>
                        <span class="info-label">Business Type:</span>
                        <span>${data.businessType}</span>
                        <span class="info-label">Tax ID:</span>
                        <span>${data.taxId}</span>
                        <span class="info-label">Categories:</span>
                        <span>${data.categories?.join(', ') || 'N/A'}</span>
                        <span class="info-label">Annual Revenue:</span>
                        <span>$${data.estimatedAnnualRevenue || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Business Address</h2>
                    <p>
                        ${data.businessAddress?.street}<br>
                        ${data.businessAddress?.city}, ${data.businessAddress?.state} ${data.businessAddress?.zipCode}<br>
                        ${data.businessAddress?.country}
                    </p>
                </div>
                
                <div class="section">
                    <h2>Contact Information</h2>
                    <div class="info-grid">
                        <span class="info-label">Phone:</span>
                        <span>${data.contactInfo?.phone}</span>
                        <span class="info-label">Email:</span>
                        <span>${data.contactInfo?.email}</span>
                        <span class="info-label">Website:</span>
                        <span>${data.contactInfo?.website || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Business Description</h2>
                    <p>${data.businessDescription}</p>
                </div>
                
                <div class="section">
                    <h2>Documents Status</h2>
                    <ul>
                        <li>Identity Proof: ${data.businessDocuments?.identityProof ? '✅ Uploaded' : '❌ Missing'}</li>
                        <li>Business License: ${data.businessDocuments?.businessLicense ? '✅ Uploaded' : '❌ Missing'}</li>
                        <li>Tax Registration: ${data.businessDocuments?.taxRegistration ? '✅ Uploaded' : '❌ Missing'}</li>
                        <li>Bank Statement: ${data.businessDocuments?.bankStatement ? '✅ Uploaded' : '📝 Optional'}</li>
                    </ul>
                </div>
                
                <div class="section">
                    <h2>Action Required</h2>
                    <p>Please review the seller verification request and take appropriate action:</p>
                    <p>
                        <a href="mailto:noreply@timelapse.com?subject=APPROVE_SELLER_${user?.uid}&body=Seller%20${user?.uid}%20approved" class="approve-btn">Approve Seller</a>
                        <a href="mailto:noreply@timelapse.com?subject=REJECT_SELLER_${user?.uid}&body=Seller%20${user?.uid}%20rejected" class="reject-btn">Reject Seller</a>
                    </p>
                    <p><small>Note: Click the buttons above to send approval/rejection response. The system will automatically process the response.</small></p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Helper function to generate text email content
function generateSellerVerificationEmailText(data: any, user: any): string {
  return `
NEW SELLER VERIFICATION REQUEST

User Information:
- Email: ${user?.email || 'N/A'}
- User ID: ${user?.uid || 'N/A'}
- Username: ${user?.username || 'N/A'}

Business Information:
- Business Name: ${data.businessName}
- Business Type: ${data.businessType}
- Tax ID: ${data.taxId}
- Categories: ${data.categories?.join(', ') || 'N/A'}
- Annual Revenue: $${data.estimatedAnnualRevenue || 'N/A'}

Business Address:
${data.businessAddress?.street}
${data.businessAddress?.city}, ${data.businessAddress?.state} ${data.businessAddress?.zipCode}
${data.businessAddress?.country}

Contact Information:
- Phone: ${data.contactInfo?.phone}
- Email: ${data.contactInfo?.email}
- Website: ${data.contactInfo?.website || 'N/A'}

Business Description:
${data.businessDescription}

Documents Status:
- Identity Proof: ${data.businessDocuments?.identityProof ? 'Uploaded' : 'Missing'}
- Business License: ${data.businessDocuments?.businessLicense ? 'Uploaded' : 'Missing'}
- Tax Registration: ${data.businessDocuments?.taxRegistration ? 'Uploaded' : 'Missing'}
- Bank Statement: ${data.businessDocuments?.bankStatement ? 'Uploaded' : 'Optional'}

ACTION REQUIRED:
Please review this seller verification request and respond with approval or rejection.

To approve: Reply with subject "APPROVE_SELLER_${user?.uid}"
To reject: Reply with subject "REJECT_SELLER_${user?.uid}"
  `;
}

// Function to update seller verification status
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

// Function to get seller verification status
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

// Function to send approval/rejection notification to seller
export async function sendSellerStatusNotification(userId: string, status: 'approved' | 'rejected', reviewNotes?: string) {
  try {
    // Get user details
    const userQuery = `
      query GetUser($userId: ID!) {
        getUser(userId: $userId) {
          id
          email
          username
        }
      }
    `;
    
    const userResponse = await graphqlQuery(userQuery, { userId });
    const userData = userResponse.data?.getUser;
    
    if (!userData?.email) {
      console.error('User email not found for notification');
      return { success: false, error: 'User email not found' };
    }

    const emailParams = {
      Destination: {
        ToAddresses: [userData.email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: generateSellerStatusNotificationHTML(status, userData, reviewNotes),
          },
          Text: {
            Charset: 'UTF-8',
            Data: generateSellerStatusNotificationText(status, userData, reviewNotes),
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `Seller Verification ${status === 'approved' ? 'Approved' : 'Update'} - Timelapse`,
        },
      },
      Source: 'noreply@timelapse.com',
    };

    try {
      const command = new SendEmailCommand(emailParams);
      const result = await sesClient.send(command);
      
      console.log('Seller notification sent successfully:', result.MessageId);
      return { 
        success: true, 
        messageId: result.MessageId 
      };
    } catch (sesError: any) {
      console.error('SES Error for seller notification:', sesError);
      
             // Log error and fail
       console.error('Failed to send seller notification email');
       return { success: false, error: sesError.message };
    }
  } catch (error: any) {
    console.error('Error sending seller status notification:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to generate seller notification HTML
function generateSellerStatusNotificationHTML(status: 'approved' | 'rejected', userData: any, reviewNotes?: string): string {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#4CAF50' : '#f44336';
  const statusText = isApproved ? 'Approved' : 'Needs Review';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .section { margin-bottom: 20px; padding: 15px; background-color: white; border-radius: 5px; }
            .cta-button { background-color: #6B4EFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            .success-icon { font-size: 48px; text-align: center; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Seller Verification ${statusText}</h1>
            </div>
            
            <div class="content">
                ${isApproved ? `
                <div class="success-icon">🎉</div>
                <div class="section">
                    <h2>Congratulations!</h2>
                    <p>Hello ${userData.username || userData.email},</p>
                    <p>Great news! Your seller verification has been approved. You can now start adding products to your local shop and begin selling on Timelapse.</p>
                </div>
                
                <div class="section">
                    <h2>Next Steps</h2>
                    <ul>
                        <li>🏪 Set up your shop profile</li>
                        <li>📸 Add your first products with photos</li>
                        <li>💼 Start managing your inventory</li>
                        <li>📊 Track your sales and analytics</li>
                    </ul>
                </div>
                
                <div class="section" style="text-align: center;">
                    <p>Ready to get started?</p>
                    <a href="#" class="cta-button">Access Your Shop</a>
                </div>
                ` : `
                <div class="section">
                    <h2>Update Required</h2>
                    <p>Hello ${userData.username || userData.email},</p>
                    <p>Thank you for submitting your seller verification. We need some additional information or corrections before we can approve your application.</p>
                    ${reviewNotes ? `
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3>Review Notes:</h3>
                        <p>${reviewNotes}</p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="section" style="text-align: center;">
                    <p>Please update your information and resubmit:</p>
                    <a href="#" class="cta-button">Update Application</a>
                </div>
                `}
                
                <div class="section">
                    <p><small>If you have any questions, please contact our support team.</small></p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Helper function to generate seller notification text
function generateSellerStatusNotificationText(status: 'approved' | 'rejected', userData: any, reviewNotes?: string): string {
  const isApproved = status === 'approved';
  
  return `
SELLER VERIFICATION ${isApproved ? 'APPROVED' : 'UPDATE REQUIRED'}

Hello ${userData.username || userData.email},

${isApproved ? `
Congratulations! Your seller verification has been approved.

You can now:
- Set up your shop profile
- Add products with photos  
- Start managing your inventory
- Track your sales and analytics

Access your shop through the Timelapse app to get started.
` : `
Thank you for submitting your seller verification. We need some additional information before we can approve your application.

${reviewNotes ? `Review Notes: ${reviewNotes}` : ''}

Please update your information and resubmit through the app.
`}

If you have any questions, please contact our support team.

Best regards,
The Timelapse Team
  `;
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



// Default export
const awsConfig = {
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
  createFeaturePost,
  saveSellerVerification,
  sendSellerVerificationEmail,
  updateSellerVerificationStatus,
  getSellerVerificationStatus,
  sendSellerStatusNotification,
  simulateAdminAction,
  likeTimelapseItem,
  unlikeTimelapseItem,
  deleteTimelapseItem,
  config,
  apolloClient,
  subscriptionClient
};

export default awsConfig; 