variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS access key"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS secret key"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS session token (optional, only needed for temporary credentials)"
  type        = string
  sensitive   = true
  default     = null
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "timelapse"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "s3_media_bucket_name" {
  description = "Name of the S3 bucket for media storage"
  type        = string
  default     = null # Will be auto-generated if not specified
}

variable "dynamodb_user_table_name" {
  description = "Name of the DynamoDB table for user data"
  type        = string
  default     = null # Will be auto-generated if not specified
}

variable "dynamodb_posts_table_name" {
  description = "Name of the DynamoDB table for posts data"
  type        = string
  default     = null # Will be auto-generated if not specified
}

variable "cognito_user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
  default     = null # Will be auto-generated if not specified
}

variable "lambda_media_processor_name" {
  description = "Name of the Lambda function for media processing"
  type        = string
  default     = null # Will be auto-generated if not specified
}

variable "api_gateway_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = null # Will be auto-generated if not specified
}

# AppSync GraphQL API variables
variable "appsync_api_name" {
  description = "Name of the AppSync GraphQL API"
  type        = string
  default     = null # Will be auto-generated if not specified
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for production environments"
  type        = bool
  default     = false
}

variable "enable_waf_protection" {
  description = "Enable WAF protection for API Gateway in production"
  type        = bool
  default     = false
} 