resource "aws_lambda_function" "batch_processor" {
  function_name    = "timelapse-batch-processor"
  handler          = "batch_processor.handler"
  runtime          = "nodejs16.x"
  filename         = data.archive_file.batch_processor_lambda.output_path
  source_code_hash = data.archive_file.batch_processor_lambda.output_base64sha256
  role             = aws_iam_role.lambda_role.arn
  
  environment {
    variables = {
      REGION            = var.region
      TIMELAPSE_TABLE   = aws_dynamodb_table.timelapse_items.name
      INTERACTIONS_TABLE = aws_dynamodb_table.interactions_table.name
      COMMENT_TABLE     = aws_dynamodb_table.comments_table.name
    }
  }

  timeout = 30  # Allow up to 30 seconds for batch operations
  memory_size = 256  # Allocate more memory for batch processing
}

data "archive_file" "batch_processor_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/batch_processor.js"
  output_path = "${path.module}/lambda/batch_processor.zip"
}

# Attach the batch processor to AppSync
resource "aws_appsync_datasource" "batch_processor_lambda" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "BatchProcessorLambda"
  service_role_arn = aws_iam_role.appsync_lambda_role.arn
  type             = "AWS_LAMBDA"
  
  lambda_config {
    function_arn = aws_lambda_function.batch_processor.arn
  }
}

# Create resolvers for batch operations
resource "aws_appsync_resolver" "get_timelapses_by_ids" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Query"
  field       = "getTimelapsesByIds"
  data_source = aws_appsync_datasource.batch_processor_lambda.name
  
  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "operation": "batchGetTimelapses",
    "ids": $util.toJson($context.arguments.ids)
  }
}
EOF

  response_template = "$util.toJson($context.result.items)"
}

resource "aws_appsync_resolver" "get_multiple_user_timelapses" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Query"
  field       = "getMultipleUserTimelapses"
  data_source = aws_appsync_datasource.batch_processor_lambda.name
  
  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "operation": "getMultipleUserTimelapses",
    "userIds": $util.toJson($context.arguments.userIds),
    "limit": $util.toJson($context.arguments.limit)
  }
}
EOF

  response_template = "$util.toJson($context.result.items)"
}

resource "aws_appsync_resolver" "batch_update_likes" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Mutation"
  field       = "batchUpdateLikes"
  data_source = aws_appsync_datasource.batch_processor_lambda.name
  
  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "operation": "batchUpdateLikes",
    "inputs": $util.toJson($context.arguments.inputs)
  }
}
EOF

  response_template = "$util.toJson($context.result)"
}

resource "aws_appsync_resolver" "batch_create_comments" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Mutation"
  field       = "batchCreateComments"
  data_source = aws_appsync_datasource.batch_processor_lambda.name
  
  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "operation": "batchCreateComments",
    "inputs": $util.toJson($context.arguments.inputs)
  }
}
EOF

  response_template = "$util.toJson($context.result)"
}

resource "aws_appsync_resolver" "batch_increment_views" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Mutation"
  field       = "batchIncrementViews"
  data_source = aws_appsync_datasource.batch_processor_lambda.name
  
  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "operation": "batchIncrementViews",
    "targetIds": $util.toJson($context.arguments.targetIds)
  }
}
EOF

  response_template = "$util.toJson($context.result)"
}

# Extend the Lambda's IAM permissions to access DynamoDB tables
resource "aws_iam_policy" "batch_processor_policy" {
  name        = "timelapse-batch-processor-policy"
  description = "Policy for batch processor Lambda"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          aws_dynamodb_table.timelapse_items.arn,
          aws_dynamodb_table.interactions_table.arn,
          aws_dynamodb_table.comments_table.arn
        ]
      },
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "batch_processor_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.batch_processor_policy.arn
} 