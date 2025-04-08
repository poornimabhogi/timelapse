terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  token      = var.aws_session_token
}

# Add any shared resources or configurations here that aren't service-specific
# The service-specific resources are now in their respective files:
# - cognito.tf for Cognito resources
# - s3.tf for S3 resources
# - dynamodb.tf for DynamoDB tables
# - appsync.tf for AppSync API
# - lambda.tf for Lambda functions 