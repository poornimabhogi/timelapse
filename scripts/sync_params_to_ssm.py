#!/usr/bin/env python3
"""
AWS Parameter Store Sync Script

This script discovers AWS resources for the timelapse application
and syncs them to AWS Systems Manager Parameter Store for secure access.

Usage:
  python sync_params_to_ssm.py --app-name timelapse --region us-east-1 --prefix /timelapse/dev
"""

import argparse
import boto3
import sys
import os
from botocore.exceptions import ClientError

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Sync AWS resources to Parameter Store')
    parser.add_argument('--app-name', required=True, help='Application name')
    parser.add_argument('--region', required=True, help='AWS region')
    parser.add_argument('--prefix', required=True, help='Parameter Store prefix (e.g. /timelapse/dev)')
    parser.add_argument('--kms-key-id', help='KMS Key ID for parameter encryption (optional)')
    parser.add_argument('--dry-run', action='store_true', help='Dry run (do not create/update parameters)')
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

def put_parameter(ssm_client, name, value, kms_key_id=None, dry_run=False, verbose=False):
    """Put a parameter in Parameter Store"""
    if dry_run:
        print(f"Would put parameter {name} = {value}")
        return True
    
    try:
        params = {
            'Name': name,
            'Value': value,
            'Type': 'SecureString' if kms_key_id else 'String',
            'Overwrite': True
        }
        
        if kms_key_id:
            params['KeyId'] = kms_key_id
        
        ssm_client.put_parameter(**params)
        
        if verbose:
            print(f"Added/updated parameter: {name}")
        
        return True
    except ClientError as e:
        print(f"Error putting parameter {name}: {e}")
        return False

def main():
    """Main function"""
    args = parse_args()
    
    app_name = args.app_name
    region = args.region
    prefix = args.prefix
    kms_key_id = args.kms_key_id
    dry_run = args.dry_run
    verbose = args.verbose
    
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
    
    # Sync to Parameter Store
    print(f"Syncing parameters to {prefix}...")
    
    ssm = boto3.client('ssm', region_name=region)
    
    # Create parameters
    parameters = {
        f"{prefix}/cognito/user-pool-id": user_pool_id,
        f"{prefix}/cognito/app-client-id": app_client_id,
        f"{prefix}/cognito/identity-pool-id": identity_pool_id,
        f"{prefix}/appsync/endpoint": appsync_endpoint,
        f"{prefix}/s3/bucket-name": s3_bucket,
        f"{prefix}/aws/region": region
    }
    
    # Store parameters
    success = True
    for name, value in parameters.items():
        if not put_parameter(ssm, name, value, kms_key_id, dry_run, verbose):
            success = False
    
    if not success:
        print("Some parameters failed to sync")
        return 1
    
    print("Successfully synced all parameters to SSM Parameter Store")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 