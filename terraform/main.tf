provider "aws" {
  region = var.aws_region
}

# Terraform state configuration - use S3 backend for team collaboration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  
  # Uncomment to use S3 backend for remote state (first create the bucket manually)
  # backend "s3" {
  #   bucket = "timelapse-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "us-east-1"
  #   dynamodb_table = "timelapse-terraform-locks"
  #   encrypt = true
  # }
}

# S3 bucket for media storage
resource "aws_s3_bucket" "media_bucket" {
  bucket = "timelapse-media-storage"
  force_destroy = true
}

# Enable CORS on the S3 bucket
resource "aws_s3_bucket_cors_configuration" "media_bucket_cors" {
  bucket = aws_s3_bucket.media_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"] # Should be restricted in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# DynamoDB table for user data and states
resource "aws_dynamodb_table" "users_table" {
  name           = "timelapse-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}

# DynamoDB table for social posts
resource "aws_dynamodb_table" "posts_table" {
  name           = "timelapse-posts"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "postId"
  range_key      = "userId"

  attribute {
    name = "postId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name               = "UserPostsIndex"
    hash_key           = "userId"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }
}

# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "user_pool" {
  name = "timelapse-user-pool"
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]
  
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "client" {
  name = "timelapse-app-client"
  
  user_pool_id = aws_cognito_user_pool.user_pool.id
  
  generate_secret     = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# IAM role for authenticated users
resource "aws_iam_role" "authenticated_role" {
  name = "timelapse-authenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.identity_pool.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })
}

# IAM policy for authenticated users to access S3
resource "aws_iam_policy" "authenticated_policy" {
  name = "timelapse-authenticated-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.media_bucket.arn}/*",
          "${aws_s3_bucket.media_bucket.arn}"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.users_table.arn,
          aws_dynamodb_table.posts_table.arn,
          "${aws_dynamodb_table.posts_table.arn}/index/*"
        ]
      }
    ]
  })
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "attach_authenticated_policy" {
  role       = aws_iam_role.authenticated_role.name
  policy_arn = aws_iam_policy.authenticated_policy.arn
}

# Cognito Identity Pool
resource "aws_cognito_identity_pool" "identity_pool" {
  identity_pool_name               = "timelapse_identity_pool"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.client.id
    provider_name           = aws_cognito_user_pool.user_pool.endpoint
    server_side_token_check = false
  }
}

# Identity Pool Role Attachment
resource "aws_cognito_identity_pool_role_attachment" "identity_pool_role_attachment" {
  identity_pool_id = aws_cognito_identity_pool.identity_pool.id
  
  roles = {
    "authenticated" = aws_iam_role.authenticated_role.arn
  }
}

# Lambda function for processing uploaded media
resource "aws_lambda_function" "media_processor" {
  function_name = "timelapse-media-processor"
  filename      = "lambda.zip" # You'll need to create this zip file with your Lambda code
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.lambda_exec.arn
  
  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.media_bucket.bucket
      USERS_TABLE = aws_dynamodb_table.users_table.name
      POSTS_TABLE = aws_dynamodb_table.posts_table.name
    }
  }
}

# IAM role for the Lambda function
resource "aws_iam_role" "lambda_exec" {
  name = "timelapse-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for the Lambda function
resource "aws_iam_policy" "lambda_policy" {
  name = "timelapse-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.media_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.users_table.arn,
          aws_dynamodb_table.posts_table.arn
        ]
      }
    ]
  })
}

# Attach the policy to the Lambda role
resource "aws_iam_role_policy_attachment" "attach_lambda_policy" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# S3 event notification to trigger Lambda
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.media_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.media_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }
}

# API Gateway for mobile app to communicate with backend
resource "aws_apigatewayv2_api" "timelapse_api" {
  name          = "timelapse-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"] # Should be restricted in production
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
  }
}

# Output the crucial resource identifiers
output "s3_bucket_name" {
  value = aws_s3_bucket.media_bucket.bucket
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.user_pool.id
}

output "cognito_app_client_id" {
  value = aws_cognito_user_pool_client.client.id
}

output "cognito_identity_pool_id" {
  value = aws_cognito_identity_pool.identity_pool.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.timelapse_api.api_endpoint
} 