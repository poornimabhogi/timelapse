#!/usr/bin/env python3

import json
import re
import os
import sys
import subprocess

# Path to your aws-exports.js file - modify as needed
CONFIG_FILE_PATH = os.path.expanduser('~/Documents/timelapse/src/aws-exports.js')

def run_command(command):
    """Run a shell command and return its output and status"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def update_aws_config_with_dummy_values():
    print(f"Updating {CONFIG_FILE_PATH} with dummy values")

    try:
        # Read the aws-exports.js file
        with open(CONFIG_FILE_PATH, 'r') as file:
            content = file.read()
        
        # Extract the JSON config object
        # The file typically has a format like: const awsmobile = {...}; export default awsmobile;
        match = re.search(r'const\s+awsmobile\s*=\s*({[^;]*});', content, re.DOTALL)
        if not match:
            print("Error: Could not find configuration object in aws-exports.js")
            return False
        
        config_str = match.group(1)
        
        # Handle trailing commas which are valid in JS but not in JSON
        config_str = re.sub(r',\s*}', '}', config_str)
        config_str = re.sub(r',\s*]', ']', config_str)
        
        # Parse the config as JSON
        try:
            config = json.loads(config_str)
        except json.JSONDecodeError as e:
            print(f"Error parsing configuration: {e}")
            return False
        
        # Replace values with dummy values
        if 'aws_project_region' in config:
            config['aws_project_region'] = 'us-east-1'
        
        if 'aws_cognito_identity_pool_id' in config:
            config['aws_cognito_identity_pool_id'] = 'us-east-1:00000000-0000-0000-0000-000000000000'
        
        if 'aws_cognito_region' in config:
            config['aws_cognito_region'] = 'us-east-1'
        
        if 'aws_user_pools_id' in config:
            config['aws_user_pools_id'] = 'us-east-1_XXXXXXXXX'
        
        if 'aws_user_pools_web_client_id' in config:
            config['aws_user_pools_web_client_id'] = '0000000000000000000000000'
        
        if 'aws_appsync_graphqlEndpoint' in config:
            config['aws_appsync_graphqlEndpoint'] = 'https://example.appsync-api.us-east-1.amazonaws.com/graphql'
        
        if 'aws_appsync_region' in config:
            config['aws_appsync_region'] = 'us-east-1'
        
        if 'aws_appsync_authenticationType' in config:
            config['aws_appsync_authenticationType'] = 'API_KEY'
        
        if 'aws_appsync_apiKey' in config:
            config['aws_appsync_apiKey'] = 'da2-xxxxxxxxxxxxxxxxxxxxxxxx'
        
        if 'aws_user_files_s3_bucket' in config:
            config['aws_user_files_s3_bucket'] = 'timelapse-media-dev-00000000'
        
        if 'aws_user_files_s3_bucket_region' in config:
            config['aws_user_files_s3_bucket_region'] = 'us-east-1'
        
        # Create backup of original file
        backup_file = f"{CONFIG_FILE_PATH}.bak"
        os.rename(CONFIG_FILE_PATH, backup_file)
        print(f"Original file backed up to {backup_file}")
        
        # Write the updated configuration back to the file
        new_config_str = json.dumps(config, indent=2)
        updated_content = content.replace(match.group(1), new_config_str)
        
        with open(CONFIG_FILE_PATH, 'w') as file:
            file.write(updated_content)
        
        print(f"Updated {CONFIG_FILE_PATH} with dummy values successfully")
        return True
    
    except Exception as e:
        print(f"Error updating AWS config: {e}")
        return False

def git_commit_changes():
    """Commit the changes to git"""
    # Change to the project directory
    os.chdir(os.path.dirname(os.path.dirname(CONFIG_FILE_PATH)))
    
    # Add the changed file
    success, output = run_command(f"git add {CONFIG_FILE_PATH}")
    if not success:
        print(f"Git add failed: {output}")
        return False
    
    # Commit the changes
    commit_message = "Update AWS config with dummy values after terraform destroy"
    success, output = run_command(f'git commit -m "{commit_message}"')
    if not success:
        print(f"Git commit failed: {output}")
        return False
    
    print("Changes committed to git successfully")
    
    # Uncomment this section if you want to push changes automatically
    # success, output = run_command("git push")
    # if not success:
    #     print(f"Git push failed: {output}")
    #     return False
    # print("Changes pushed to remote repository")
    
    return True

if __name__ == "__main__":
    if update_aws_config_with_dummy_values():
        print("AWS config updated successfully")
        
        # Ask user if they want to commit the changes
        response = input("Do you want to commit these changes to git? (y/n): ").strip().lower()
        if response == 'y':
            if git_commit_changes():
                print("Git operations completed successfully")
            else:
                print("Git operations failed")
                sys.exit(1)
    else:
        print("Failed to update AWS config")
        sys.exit(1)