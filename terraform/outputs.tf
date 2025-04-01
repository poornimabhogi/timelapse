# S3 outputs
output "media_bucket_name" {
  description = "Name of the S3 bucket for media storage"
  value       = aws_s3_bucket.media_bucket.bucket
}

output "media_bucket_domain_name" {
  description = "Domain name of the S3 bucket for media storage"
  value       = aws_s3_bucket.media_bucket.bucket_domain_name
}

# Cognito outputs
output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = aws_cognito_user_pool.user_pool.endpoint
}

output "cognito_app_client_id" {
  description = "ID of the Cognito App Client"
  value       = aws_cognito_user_pool_client.app_client.id
}

output "cognito_identity_pool_id" {
  description = "ID of the Cognito Identity Pool"
  value       = aws_cognito_identity_pool.identity_pool.id
}

# DynamoDB outputs
output "dynamodb_users_table_name" {
  description = "Name of the DynamoDB table for users"
  value       = aws_dynamodb_table.users_table.name
}

output "dynamodb_posts_table_name" {
  description = "Name of the DynamoDB table for posts"
  value       = aws_dynamodb_table.posts_table.name
}

output "dynamodb_follows_table_name" {
  description = "Name of the DynamoDB table for follows"
  value       = aws_dynamodb_table.follows_table.name
}

output "dynamodb_interactions_table_name" {
  description = "Name of the DynamoDB table for interactions"
  value       = aws_dynamodb_table.interactions_table.name
}

# AppSync outputs
output "appsync_graphql_api_id" {
  description = "ID of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.timelapse_api.id
}

output "appsync_graphql_api_url" {
  description = "URL of the AppSync GraphQL API"
  value       = aws_appsync_graphql_api.timelapse_api.uris["GRAPHQL"]
}

# React Native app config object
output "react_native_config" {
  description = "Configuration object for the React Native app"
  value = jsonencode({
    aws_region            = var.aws_region
    user_pool_id          = aws_cognito_user_pool.user_pool.id
    user_pool_web_client_id = aws_cognito_user_pool_client.app_client.id
    identity_pool_id      = aws_cognito_identity_pool.identity_pool.id
    s3_bucket             = aws_s3_bucket.media_bucket.bucket
    graphql_endpoint      = aws_appsync_graphql_api.timelapse_api.uris["GRAPHQL"]
    environment           = var.environment
  })
  sensitive = false
}

# Add in a .env file format for easy copy-paste
output "react_native_dotenv" {
  description = "Configuration for a .env file in the React Native app"
  value = <<EOF
# AWS Configuration for Timelapse App - ${var.environment} environment
# Generated by Terraform

REACT_APP_AWS_REGION=${var.aws_region}
REACT_APP_COGNITO_USER_POOL_ID=${aws_cognito_user_pool.user_pool.id}
REACT_APP_COGNITO_APP_CLIENT_ID=${aws_cognito_user_pool_client.app_client.id}
REACT_APP_COGNITO_IDENTITY_POOL_ID=${aws_cognito_identity_pool.identity_pool.id}
REACT_APP_S3_BUCKET_NAME=${aws_s3_bucket.media_bucket.bucket}
REACT_APP_GRAPHQL_ENDPOINT=${aws_appsync_graphql_api.timelapse_api.uris["GRAPHQL"]}
REACT_APP_ENVIRONMENT=${var.environment}
EOF
} 