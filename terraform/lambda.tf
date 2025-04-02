locals {
  lambda_media_processor_name = var.lambda_media_processor_name != null ? var.lambda_media_processor_name : "${var.app_name}-media-processor-${var.environment}"
}

# IAM role for Lambda function
resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.app_name}-lambda-exec-role-${var.environment}"

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

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# IAM policy for Lambda function
resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.app_name}-lambda-policy-${var.environment}"
  description = "Policy for Lambda function to access S3 and DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # CloudWatch Logs permissions
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      },
      # S3 permissions
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.media_bucket.arn,
          "${aws_s3_bucket.media_bucket.arn}/*"
        ]
      },
      # DynamoDB permissions
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.users_table.arn,
          aws_dynamodb_table.posts_table.arn,
          "${aws_dynamodb_table.posts_table.arn}/index/*"
        ]
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Lambda layer for image processing dependencies
resource "aws_lambda_layer_version" "image_processing_layer" {
  count = var.environment == "prod" ? 1 : 0

  layer_name = "${var.app_name}-image-processing-layer-${var.environment}"

  compatible_runtimes = ["nodejs18.x"]

  # This is a placeholder. In a real scenario, you'd build this layer with Sharp and other
  # image processing dependencies
  filename = "lambda-layer/image-processing-layer.zip"

  description = "Layer containing Sharp and other image processing libraries"
}

# Lambda function for media processing
resource "aws_lambda_function" "media_processor" {
  function_name = local.lambda_media_processor_name

  # This is a placeholder. In a real scenario, you'd have your Lambda code in a file
  filename = var.environment == "prod" ? "lambda/media-processor-prod.zip" : "lambda/media-processor-dev.zip"
  handler  = "index.handler"

  # Note: For production, you might want to use a more stable runtime
  runtime = "nodejs18.x"

  # Lambda role
  role = aws_iam_role.lambda_exec_role.arn

  # Increase timeout for image processing
  timeout = 30

  # Increase memory for better performance
  memory_size = var.environment == "prod" ? 1024 : 512

  # Configuration
  environment {
    variables = {
      STAGE           = var.environment
      S3_BUCKET       = aws_s3_bucket.media_bucket.bucket
      USERS_TABLE     = aws_dynamodb_table.users_table.name
      POSTS_TABLE     = aws_dynamodb_table.posts_table.name
      API_URL         = "https://${aws_appsync_graphql_api.timelapse_api.id}.appsync-api.${var.aws_region}.amazonaws.com/graphql"
    }
  }

  # For production, apply layers statically rather than using dynamic blocks
  layers = var.environment == "prod" ? [aws_lambda_layer_version.image_processing_layer[0].arn] : []

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment
  ]

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${local.lambda_media_processor_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# S3 Event Notification for uploaded media
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.media_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.media_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
  }
}

# Permission for S3 to invoke Lambda
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.media_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.media_bucket.arn
}

# CloudWatch alarm for Lambda errors in production
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  count = var.environment == "prod" && var.enable_enhanced_monitoring ? 1 : 0

  alarm_name          = "${aws_lambda_function.media_processor.function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors lambda errors"

  dimensions = {
    FunctionName = aws_lambda_function.media_processor.function_name
  }

  # Add SNS topic ARN here if you want to send alerts
  # alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
} 