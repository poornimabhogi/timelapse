locals {
  cognito_user_pool_name = var.cognito_user_pool_name != null ? var.cognito_user_pool_name : "${var.app_name}-user-pool-${var.environment}"
}

# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "user_pool" {
  name = local.cognito_user_pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # MFA configuration
  mfa_configuration = var.environment == "prod" ? "OPTIONAL" : "OFF"

  # Account recovery settings
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = var.environment == "prod"
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User schema attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "profile_picture"
    attribute_data_type = "String"
    required            = false
    mutable             = true
    string_attribute_constraints {
      max_length = 2048
      min_length = 0
    }
  }

  schema {
    name                = "bio"
    attribute_data_type = "String"
    required            = false
    mutable             = true
    string_attribute_constraints {
      max_length = 500
      min_length = 0
    }
  }

  # Enable advanced security features in production
  dynamic "user_pool_add_ons" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      advanced_security_mode = "ENFORCED"
    }
  }

  # Lambda triggers for custom authentication workflows
  # Uncomment and configure as needed
  # lambda_config {
  #   pre_sign_up = aws_lambda_function.pre_signup.arn
  # }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# App client for the React Native application
resource "aws_cognito_user_pool_client" "app_client" {
  name = "${var.app_name}-app-client-${var.environment}"

  user_pool_id = aws_cognito_user_pool.user_pool.id

  # Don't generate a client secret for public clients like mobile apps
  generate_secret = false

  # Enable all auth flows for flexibility
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_CUSTOM_AUTH"
  ]

  # Token validity
  refresh_token_validity = var.environment == "prod" ? 30 : 60 # days
  access_token_validity  = 1                                   # hours
  id_token_validity      = 1                                   # hours

  token_validity_units {
    refresh_token = "days"
    access_token  = "hours"
    id_token      = "hours"
  }

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Callback and logout URLs
  callback_urls = [
    "timelapse://callback",
    "https://${var.app_name}.auth.${var.aws_region}.amazoncognito.com/oauth2/idpresponse"
  ]
  logout_urls = [
    "timelapse://signout"
  ]

  # OAuth settings
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  supported_identity_providers         = ["COGNITO"]
}

# Identity Pool for AWS service access
resource "aws_cognito_identity_pool" "identity_pool" {
  identity_pool_name               = "${var.app_name}-identity-pool-${var.environment}"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  # Connect to User Pool
  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.app_client.id
    provider_name           = "cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.user_pool.id}"
    server_side_token_check = false
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# IAM role for authenticated users
resource "aws_iam_role" "authenticated_role" {
  name = "${var.app_name}-cognito-authenticated-role-${var.environment}"

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

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# Identity Pool Role Attachment
resource "aws_cognito_identity_pool_roles_attachment" "identity_pool_role_attachment" {
  identity_pool_id = aws_cognito_identity_pool.identity_pool.id

  roles = {
    "authenticated" = aws_iam_role.authenticated_role.arn
  }
}

# IAM policy for authenticated users to access app resources
resource "aws_iam_policy" "authenticated_policy" {
  name        = "${var.app_name}-authenticated-policy-${var.environment}"
  description = "Policy for authenticated users in the ${var.app_name} application"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 permissions for media upload/download
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.media_bucket.arn}/uploads/$${cognito-identity.amazonaws.com:sub}/*",
          "${aws_s3_bucket.media_bucket.arn}/processed/$${cognito-identity.amazonaws.com:sub}/*",
          "${aws_s3_bucket.media_bucket.arn}/thumbnails/$${cognito-identity.amazonaws.com:sub}/*"
        ]
      },
      # Allow read access to processed media for all users (for viewing other users' posts)
      {
        Effect = "Allow"
        Action = "s3:GetObject"
        Resource = [
          "${aws_s3_bucket.media_bucket.arn}/processed/*",
          "${aws_s3_bucket.media_bucket.arn}/thumbnails/*"
        ]
      },
      # Allow listing bucket contents
      {
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.media_bucket.arn
        Condition = {
          StringLike = {
            "s3:prefix" : [
              "uploads/$${cognito-identity.amazonaws.com:sub}/*",
              "processed/$${cognito-identity.amazonaws.com:sub}/*",
              "thumbnails/$${cognito-identity.amazonaws.com:sub}/*",
              "processed/*",
              "thumbnails/*"
            ]
          }
        }
      },
      # DynamoDB permissions for user-specific data
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          aws_dynamodb_table.users_table.arn,
          aws_dynamodb_table.timelapses.arn,
          aws_dynamodb_table.posts_table.arn,
          aws_dynamodb_table.interactions_table.arn
        ]
        Condition = {
            "ForAllValues:StringEquals" = {
             "dynamodb:LeadingKeys": ["$${cognito-identity.amazonaws.com:sub}"]
            }
        }
      },
      # Read-only access to other users' public data
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          aws_dynamodb_table.users_table.arn,
          aws_dynamodb_table.timelapses.arn,
          aws_dynamodb_table.posts_table.arn,
          "${aws_dynamodb_table.users_table.arn}/index/*",
          "${aws_dynamodb_table.timelapses.arn}/index/*",
          "${aws_dynamodb_table.posts_table.arn}/index/*"
        ]
      },
      # Permissions for social features (follows and interactions)
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.follows_table.arn,
          "${aws_dynamodb_table.follows_table.arn}/index/*"
        ]
        Condition = {
          "ForAllValues:StringEquals" = {
            "dynamodb:LeadingKeys": ["$${cognito-identity.amazonaws.com:sub}"]
          }
        }
      },
      # AppSync access for GraphQL API
      {
        Effect = "Allow"
        Action = [
          "appsync:GraphQL"
        ]
        Resource = [
          "arn:aws:appsync:${var.aws_region}:*:apis/*"
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