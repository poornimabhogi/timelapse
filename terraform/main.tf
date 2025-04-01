provider "aws" {
  region = "us-east-1"  # Change this to your desired region
}

# Terraform state configuration - use S3 backend for team collaboration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
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
  bucket = "timelapse-media-storage"  # Change this to your desired bucket name

  tags = {
    Name        = "Timelapse Media Storage"
    Environment = "production"
  }
}

# Enable CORS for the S3 bucket
resource "aws_s3_bucket_cors_configuration" "media_bucket_cors" {
  bucket = aws_s3_bucket.media_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]  # In production, restrict this to your app's domain
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

# IAM role for the Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "timelapse_upload_lambda_role"

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
resource "aws_iam_role_policy" "lambda_policy" {
  name = "timelapse_upload_lambda_policy"
  role = aws_iam_role.lambda_role.id

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
        Resource = "${aws_s3_bucket.media_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda function for generating presigned URLs
resource "aws_lambda_function" "generate_presigned_url" {
  filename         = "lambda/generate_presigned_url.zip"
  function_name    = "generate_presigned_url"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 128
  publish         = true

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.media_bucket.id
    }
  }
}

# API Gateway for the Lambda function
resource "aws_apigatewayv2_api" "timelapse_api" {
  name          = "timelapse-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "timelapse_stage" {
  api_id = aws_apigatewayv2_api.timelapse_api.id
  name   = "prod"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.timelapse_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.generate_presigned_url.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  api_id    = aws_apigatewayv2_api.timelapse_api.id
  route_key = "POST /generate-presigned-url"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.generate_presigned_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.timelapse_api.execution_arn}/*/*"
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