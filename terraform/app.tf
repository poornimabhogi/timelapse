provider "aws" {
  region = var.aws_region
}

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {}

# S3 Bucket for media
resource "aws_s3_bucket" "media" {}

# AppSync API for GraphQL
resource "aws_appsync_graphql_api" "main" {}

# API Gateway for REST endpoints
resource "aws_api_gateway_rest_api" "main" {}

# Environment variables for React Native
output "react_app_config" {
  value = {
    REACT_APP_AWS_REGION = var.aws_region
    REACT_APP_COGNITO_USER_POOL_ID = aws_cognito_user_pool.main.id
    REACT_APP_COGNITO_CLIENT_ID = aws_cognito_user_pool_client.main.id
    REACT_APP_S3_BUCKET = aws_s3_bucket.media.bucket
    REACT_APP_APPSYNC_ENDPOINT = aws_appsync_graphql_api.main.uris["GRAPHQL"]
    REACT_APP_API_GATEWAY_ENDPOINT = aws_api_gateway_deployment.main.invoke_url
  }
}