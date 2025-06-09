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
  access_key = var.aws_access_key != "" ? var.aws_access_key : null
  secret_key = var.aws_secret_key != "" ? var.aws_secret_key : null
  token      = var.aws_session_token != "" ? var.aws_session_token : null
}

# S3 bucket for media storage
resource "aws_s3_bucket" "media_storage" {
  bucket = "timelapse-media-storage"
}

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "timelapse-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "client" {
  name         = "timelapse-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

# Cognito Identity Pool
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name = "timelapse_identity_pool"

  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.client.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }
}

# IAM Role for authenticated users
resource "aws_iam_role" "authenticated" {
  name = "cognito_authenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })
}

# IAM Policy for authenticated users
resource "aws_iam_role_policy" "authenticated" {
  name = "authenticated_policy"
  role = aws_iam_role.authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.media_storage.arn}/*",
          aws_s3_bucket.media_storage.arn
        ]
      }
    ]
  })
}

# Outputs
output "user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  value = aws_cognito_user_pool_client.client.id
}

output "identity_pool_id" {
  value = aws_cognito_identity_pool.main.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.media_storage.id
} 
output "REACT_APP_APPSYNC_ENDPOINT" {
  value = aws_appsync_graphql_api.timelapse_api.uris["GRAPHQL"]
}