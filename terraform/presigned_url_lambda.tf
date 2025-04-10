# Lambda function for generating presigned URLs for S3 uploads
resource "aws_lambda_function" "presigned_url_lambda" {
  function_name = "${var.app_name}-presigned-url-${var.environment}"
  
  # Use the individual file instead of a zip archive for simplicity
  filename      = "${path.module}/lambda/presigned_url_lambda.zip"
  handler       = "generate_presigned_url.handler"
  runtime       = "nodejs18.x"
  
  # Use the existing Lambda execution role
  role          = aws_iam_role.lambda_exec_role.arn
  
  # Configure environment variables
  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.media_bucket.bucket
      AWS_REGION  = var.aws_region
    }
  }
  
  # Set appropriate timeout
  timeout = 10
  
  tags = {
    Environment = var.environment
    Application = var.app_name
  }
  
  # Create a null resource to package the Lambda code before deployment
  depends_on = [null_resource.package_presigned_url_lambda]
  
  # Ignore changes to avoid permission issues
  lifecycle {
    ignore_changes = [
      # Ignore source code hash to prevent unnecessary updates
      source_code_hash,
      # Ignore last modified as it changes on each deployment
      last_modified
    ]
  }
}

# Null resource to package the Lambda code
resource "null_resource" "package_presigned_url_lambda" {
  # Trigger when the Lambda code changes
  triggers = {
    lambda_code = filemd5("${path.module}/lambda/generate_presigned_url.js")
  }
  
  # Create a zip file containing the Lambda code and dependencies
  provisioner "local-exec" {
    command = <<EOT
      cd ${path.module}/lambda && \
      zip -r presigned_url_lambda.zip generate_presigned_url.js node_modules/@aws-sdk/client-s3 node_modules/@aws-sdk/s3-request-presigner
    EOT
  }
}

# Allow this Lambda to access S3 for generating presigned URLs
resource "aws_iam_policy" "lambda_s3_policy" {
  name        = "${var.app_name}-lambda-s3-access-${var.environment}"
  description = "Allow Lambda to generate presigned URLs for S3"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ],
        Effect   = "Allow",
        Resource = "${aws_s3_bucket.media_bucket.arn}/*"
      }
    ]
  })
}

# Attach the S3 policy to the Lambda role
resource "aws_iam_role_policy_attachment" "lambda_s3_policy_attachment" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
} 