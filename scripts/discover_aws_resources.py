#!/usr/bin/env python3
"""
AWS Resource Discovery Script

This script discovers AWS resources for the timelapse application
and generates an aws-exports.js file with the configuration.

Usage:
  python discover_aws_resources.py --app-name timelapse --region us-east-1 --output src/aws-exports.js
"""

import argparse
import boto3
import json
import os
import sys
from datetime import datetime

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Discover AWS resources for the application')
    parser.add_argument('--app-name', required=True, help='Application name')
    parser.add_argument('--region', required=True, help='AWS region')
    parser.add_argument('--output', required=True, help='Output file path')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')
    
    return parser.parse_args()

def get_cognito_user_pool(app_name, region):
    """Get Cognito User Pool ID by name"""
    cognito_idp = boto3.client('cognito-idp', region_name=region)
    
    response = cognito_idp.list_user_pools(MaxResults=60)
    for pool in response.get('UserPools', []):
        if app_name.lower() in pool['Name'].lower():
            return pool['Id']
    
    return None

def get_cognito_app_client(user_pool_id, region):
    """Get Cognito App Client ID for the user pool"""
    cognito_idp = boto3.client('cognito-idp', region_name=region)
    
    response = cognito_idp.list_user_pool_clients(
        UserPoolId=user_pool_id,
        MaxResults=60
    )
    
    if response.get('UserPoolClients') and len(response['UserPoolClients']) > 0:
        return response['UserPoolClients'][0]['ClientId']
    
    return None

def get_cognito_identity_pool(app_name, region):
    """Get Cognito Identity Pool ID by name"""
    cognito_identity = boto3.client('cognito-identity', region_name=region)
    
    response = cognito_identity.list_identity_pools(
        MaxResults=60
    )
    
    for pool in response.get('IdentityPools', []):
        if app_name.lower() in pool['IdentityPoolName'].lower():
            return pool['IdentityPoolId']
    
    return None

def get_appsync_api(app_name, region):
    """Get AppSync GraphQL API by name"""
    appsync = boto3.client('appsync', region_name=region)
    
    response = appsync.list_graphql_apis()
    
    for api in response.get('graphqlApis', []):
        if app_name.lower() in api['name'].lower():
            # Get the GraphQL endpoint
            return api['uris']['GRAPHQL']
    
    return None

def get_s3_bucket(app_name, region):
    """Get S3 bucket by name"""
    s3 = boto3.client('s3', region_name=region)
    
    response = s3.list_buckets()
    
    for bucket in response.get('Buckets', []):
        if app_name.lower() in bucket['Name'].lower():
            return bucket['Name']
    
    return None

def generate_aws_exports(config, output_file):
    """Generate aws-exports.js file with configuration"""
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Build the export content
    content = f"""/* eslint-disable */
// WARNING: DO NOT EDIT. This file is automatically generated by discover_aws_resources.py
// This file was generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

const awsmobile = {json.dumps(config, indent=4)};

export default awsmobile;
"""
    
    # Write to file
    with open(output_file, 'w') as f:
        f.write(content)
    
    return True

def main():
    """Main function"""
    args = parse_args()
    
    app_name = args.app_name
    region = args.region
    output_file = args.output
    verbose = args.verbose
    
    if verbose:
        print(f"Discovering AWS resources for {app_name} in {region}...")
    
    # Get Cognito User Pool
    user_pool_id = get_cognito_user_pool(app_name, region)
    if not user_pool_id:
        print(f"Error: No Cognito User Pool found for {app_name}")
        return 1
    
    if verbose:
        print(f"Found User Pool ID: {user_pool_id}")
    
    # Get Cognito App Client
    app_client_id = get_cognito_app_client(user_pool_id, region)
    if not app_client_id:
        print(f"Error: No App Client found for User Pool {user_pool_id}")
        return 1
    
    if verbose:
        print(f"Found App Client ID: {app_client_id}")
    
    # Get Cognito Identity Pool
    identity_pool_id = get_cognito_identity_pool(app_name, region)
    if not identity_pool_id:
        print(f"Error: No Identity Pool found for {app_name}")
        return 1
    
    if verbose:
        print(f"Found Identity Pool ID: {identity_pool_id}")
    
    # Get AppSync API
    appsync_endpoint = get_appsync_api(app_name, region)
    if not appsync_endpoint:
        print(f"Error: No AppSync API found for {app_name}")
        return 1
    
    if verbose:
        print(f"Found AppSync Endpoint: {appsync_endpoint}")
    
    # Get S3 Bucket
    s3_bucket = get_s3_bucket(app_name, region)
    if not s3_bucket:
        print(f"Error: No S3 bucket found for {app_name}")
        return 1
    
    if verbose:
        print(f"Found S3 Bucket: {s3_bucket}")
    
    # Build configuration
    config = {
        "aws_project_region": region,
        "aws_cognito_identity_pool_id": identity_pool_id,
        "aws_cognito_region": region,
        "aws_user_pools_id": user_pool_id,
        "aws_user_pools_web_client_id": app_client_id,
        "oauth": {},
        "aws_appsync_graphqlEndpoint": appsync_endpoint,
        "aws_appsync_region": region,
        "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
        "aws_user_files_s3_bucket": s3_bucket,
        "aws_user_files_s3_bucket_region": region
    }
    
    # Generate aws-exports.js
    success = generate_aws_exports(config, output_file)
    if not success:
        print(f"Error: Failed to generate {output_file}")
        return 1
    
    print(f"Successfully generated {output_file}")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 