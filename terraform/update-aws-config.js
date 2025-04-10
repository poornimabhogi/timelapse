#!/usr/bin/env node

/**
 * This script updates the React Native app's AWS configuration 
 * with the Cognito details created by the existing Terraform setup.
 * 
 * Usage: 
 * 1. Run terraform apply in the terraform directory
 * 2. Run this script to update the app configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the AWS config file
const configFilePath = path.resolve(__dirname, '../src/services/aws-config.ts');

// Run terraform output commands to get the values
function getTerraformOutput(outputName) {
  try {
    const output = execSync(`terraform output -raw ${outputName}`, { 
      cwd: __dirname,
      encoding: 'utf8' 
    });
    return output.trim();
  } catch (error) {
    console.error(`Error getting Terraform output ${outputName}:`, error.message);
    return null;
  }
}

// Get values from Terraform outputs
// First, check what outputs are available
console.log('Getting available Terraform outputs...');
const availableOutputs = execSync('terraform output', { 
  cwd: __dirname,
  encoding: 'utf8' 
});
console.log('Available outputs:', availableOutputs);

// Try different possible output names based on common naming conventions
let userPoolId, appClientId, identityPoolId, awsRegion, mediaApiUrl;

// Try for user pool ID
try {
  userPoolId = getTerraformOutput('cognito_user_pool_id') || 
               getTerraformOutput('user_pool_id') || 
               getTerraformOutput('aws_cognito_user_pool_id');
} catch (error) {
  console.log('Could not find user pool ID output');
}

// Try for app client ID
try {
  appClientId = getTerraformOutput('cognito_app_client_id') || 
                getTerraformOutput('app_client_id') || 
                getTerraformOutput('user_pool_client_id');
} catch (error) {
  console.log('Could not find app client ID output');
}

// Try for identity pool ID
try {
  identityPoolId = getTerraformOutput('cognito_identity_pool_id') || 
                   getTerraformOutput('identity_pool_id');
} catch (error) {
  console.log('Could not find identity pool ID output');
}

// Try for media API URL
try {
  // Use GraphQL endpoint for media operations instead of API Gateway
  mediaApiUrl = getTerraformOutput('appsync_graphql_api_url');
} catch (error) {
  console.log('Could not find GraphQL API URL output');
}

// Region
try {
  awsRegion = getTerraformOutput('aws_region') || 
              getTerraformOutput('region');
} catch (error) {
  console.log('Could not find AWS region output, using default');
  awsRegion = 'us-east-1'; // Default region
}

// If we couldn't find values from outputs, extract them from state
if (!userPoolId || !appClientId || !identityPoolId) {
  console.log('Some Terraform outputs not found, extracting from state...');
  
  try {
    // Get the state as JSON
    const stateJson = execSync('terraform show -json', {
      cwd: __dirname,
      encoding: 'utf8'
    });
    
    const state = JSON.parse(stateJson);
    
    // Extract resources from state
    if (state.values && state.values.root_module && state.values.root_module.resources) {
      const resources = state.values.root_module.resources;
      
      // Find user pool
      const userPool = resources.find(r => r.type === 'aws_cognito_user_pool');
      if (userPool && !userPoolId) {
        userPoolId = userPool.values.id;
        console.log('Found user pool ID from state:', userPoolId);
      }
      
      // Find app client
      const appClient = resources.find(r => r.type === 'aws_cognito_user_pool_client');
      if (appClient && !appClientId) {
        appClientId = appClient.values.id;
        console.log('Found app client ID from state:', appClientId);
      }
      
      // Find identity pool
      const identityPool = resources.find(r => r.type === 'aws_cognito_identity_pool');
      if (identityPool && !identityPoolId) {
        identityPoolId = identityPool.values.id;
        console.log('Found identity pool ID from state:', identityPoolId);
      }
    }
  } catch (error) {
    console.error('Error extracting from state:', error.message);
  }
}

// Check if we have the required values
if (!userPoolId || !appClientId || !identityPoolId) {
  console.error('Failed to get all required Cognito IDs from Terraform.');
  console.error('Please add the necessary output blocks to your Terraform files:');
  console.error(`
output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.user_pool.id
}

output "cognito_app_client_id" {
  value = aws_cognito_user_pool_client.app_client.id
}

output "cognito_identity_pool_id" {
  value = aws_cognito_identity_pool.identity_pool.id
}
  `);
  
  // Ask for manual input as a fallback
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\nEnter Cognito details manually:');
  
  readline.question(`User Pool ID${userPoolId ? ` (current: ${userPoolId})` : ''}: `, (input) => {
    userPoolId = input || userPoolId;
    
    readline.question(`App Client ID${appClientId ? ` (current: ${appClientId})` : ''}: `, (input) => {
      appClientId = input || appClientId;
      
      readline.question(`Identity Pool ID${identityPoolId ? ` (current: ${identityPoolId})` : ''}: `, (input) => {
        identityPoolId = input || identityPoolId;
        
        readline.question(`AWS Region${awsRegion ? ` (current: ${awsRegion})` : ''}: `, (input) => {
          awsRegion = input || awsRegion;
          readline.close();
          
          updateConfigFile(userPoolId, appClientId, identityPoolId, awsRegion, mediaApiUrl);
        });
      });
    });
  });
} else {
  // We have all the values, proceed with the update
  console.log('Terraform outputs retrieved:');
  console.log(`- User Pool ID: ${userPoolId}`);
  console.log(`- App Client ID: ${appClientId}`);
  console.log(`- Identity Pool ID: ${identityPoolId}`);
  console.log(`- AWS Region: ${awsRegion}`);
  console.log(`- Media API URL: ${mediaApiUrl}`);
  
  updateConfigFile(userPoolId, appClientId, identityPoolId, awsRegion, mediaApiUrl);
}

// Function to update the config file
function updateConfigFile(userPoolId, appClientId, identityPoolId, awsRegion, mediaApiUrl) {
  // Check if all values are available
  if (!userPoolId || !appClientId || !identityPoolId) {
    console.error('Missing required Cognito IDs. Update aborted.');
    process.exit(1);
  }
  
  // Read the config file
  let configContent;
  try {
    configContent = fs.readFileSync(configFilePath, 'utf8');
    console.log(`Read config file from ${configFilePath}`);
  } catch (error) {
    console.error(`Error reading config file at ${configFilePath}:`, error.message);
    
    // If file doesn't exist, create it with a template
    if (error.code === 'ENOENT') {
      console.log('Config file not found, creating a new one...');
      configContent = `import { Amplify } from 'aws-amplify';

// Configure AWS Amplify
const configureAmplify = () => {
  console.log('Configuring AWS Amplify with Terraform outputs...');
  
  try {
    // Use values from Terraform outputs
    const awsConfig = {
      Auth: {
        Cognito: {
          // Terraform output values
          userPoolId: '${userPoolId}',
          userPoolClientId: '${appClientId}',
          identityPoolId: '${identityPoolId}',
          region: '${awsRegion}',
        },
      },
      Storage: {
        S3: {
          bucket: '${s3BucketName || 'your-s3-bucket-name'}',
          region: '${awsRegion}',
        },
      },
      API: {
        REST: {
          TimelapseAPI: {
            endpoint: '${apiEndpoint || 'your-api-endpoint'}',
            region: '${awsRegion}',
          }
        },
        GraphQL: {
          endpoint: '${mediaApiUrl || 'your-graphql-endpoint'}',
          region: '${awsRegion}',
          apiKey: 'da2-fakeApiId123456',
        },
      },
    };
    
    Amplify.configure(awsConfig);
    console.log('AWS Amplify configured successfully with Terraform outputs');
  } catch (error) {
    console.error('Error configuring AWS Amplify:', error);
  }
};

export { configureAmplify };
export default { configureAmplify };
`;
    } else {
      process.exit(1);
    }
  }

  // Update the values in the config file
  let updatedConfig = configContent;

  // Update User Pool ID
  const userPoolRegex = /(userPoolId:.*?['"])(.*?)(['"])/;
  if (userPoolRegex.test(updatedConfig)) {
    updatedConfig = updatedConfig.replace(
      userPoolRegex,
      `$1process.env.REACT_APP_COGNITO_USER_POOL_ID || '${userPoolId}'$3`
    );
  } else {
    console.warn('Could not find userPoolId in config file. Manual update may be needed.');
  }

  // Update App Client ID
  const clientIdRegex = /(userPoolClientId:.*?['"])(.*?)(['"])/;
  if (clientIdRegex.test(updatedConfig)) {
    updatedConfig = updatedConfig.replace(
      clientIdRegex,
      `$1process.env.REACT_APP_COGNITO_APP_CLIENT_ID || '${appClientId}'$3`
    );
  } else {
    console.warn('Could not find userPoolClientId in config file. Manual update may be needed.');
  }

  // Update Identity Pool ID
  const identityPoolRegex = /(identityPoolId:.*?['"])(.*?)(['"])/;
  if (identityPoolRegex.test(updatedConfig)) {
    updatedConfig = updatedConfig.replace(
      identityPoolRegex,
      `$1process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID || '${identityPoolId}'$3`
    );
  } else {
    console.warn('Could not find identityPoolId in config file. Manual update may be needed.');
  }

  // Write the updated config back to the file
  try {
    fs.writeFileSync(configFilePath, updatedConfig);
    console.log(`Successfully updated AWS configuration in ${configFilePath}`);
  } catch (error) {
    console.error(`Error writing updated config to ${configFilePath}:`, error.message);
    process.exit(1);
  }

  console.log('\nYour React Native app is now configured to use the Cognito resources created with Terraform.');
  console.log('You can now run your app and test the authentication features.');
} 