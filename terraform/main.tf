terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Add any shared resources or configurations here that aren't service-specific
# The service-specific resources are now in their respective files:
# - cognito.tf for Cognito resources
# - s3.tf for S3 resources
# - dynamodb.tf for DynamoDB tables
# - appsync.tf for AppSync API
# - lambda.tf for Lambda functions 