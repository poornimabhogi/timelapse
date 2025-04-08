#!/bin/bash

# Script to run Terraform with prompted AWS credentials
# This avoids storing credentials in files or environment variables

echo "Timelapse AWS Infrastructure Deployment"
echo "======================================="
echo ""
echo "This script will prompt for AWS credentials and run Terraform."
echo "Credentials will only be used for this session and won't be stored."
echo ""

# Prompt for AWS credentials
read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -sp "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "Enter AWS Session Token (leave empty if not using temporary credentials): " AWS_SESSION_TOKEN
echo ""

# Prompt for Terraform action
echo "Select Terraform action:"
echo "1) Plan (preview changes)"
echo "2) Apply (create/update resources)"
echo "3) Destroy (remove all resources)"
read -p "Enter choice (1-3): " TERRAFORM_ACTION

# Set up Terraform variables
TF_VARS="-var='aws_access_key=$AWS_ACCESS_KEY_ID' -var='aws_secret_key=$AWS_SECRET_ACCESS_KEY'"

# Add session token if provided
if [ ! -z "$AWS_SESSION_TOKEN" ]; then
  TF_VARS="$TF_VARS -var='aws_session_token=$AWS_SESSION_TOKEN'"
fi

# Run the selected Terraform command
case $TERRAFORM_ACTION in
  1)
    echo "Running terraform plan..."
    terraform plan $TF_VARS
    ;;
  2)
    echo "Running terraform apply..."
    terraform apply $TF_VARS
    
    # Run the update-aws-config script after successful apply
    if [ $? -eq 0 ]; then
      echo "Updating AWS config for React Native app..."
      node update-aws-config.js
    fi
    ;;
  3)
    echo "WARNING: This will destroy all resources created by Terraform."
    read -p "Are you sure you want to continue? (y/n): " CONFIRM
    if [ "$CONFIRM" = "y" ]; then
      echo "Running terraform destroy..."
      terraform destroy $TF_VARS
    else
      echo "Destroy cancelled."
    fi
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac 