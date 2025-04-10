locals {
  appsync_api_name = var.appsync_api_name != null ? var.appsync_api_name : "${var.app_name}-api-${var.environment}"
}

# AppSync API for GraphQL
resource "aws_appsync_graphql_api" "timelapse_api" {
  name                = "timelapse-api"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"
  user_pool_config {
    user_pool_id   = aws_cognito_user_pool.user_pool.id
    aws_region     = var.aws_region
    default_action = "ALLOW"
  }

  schema = file("${path.module}/schema.graphql")

  # Enable logging in production
  log_config {
    cloudwatch_logs_role_arn = aws_iam_role.appsync_logs_role.arn
    field_log_level          = var.environment == "prod" ? "ERROR" : "ALL"
    exclude_verbose_content  = var.environment == "prod"
  }

  # Enable OIDC configuration for additional auth if needed
  # additional_authentication_provider {
  #   authentication_type = "OPENID_CONNECT"
  #   openid_connect_config {
  #     issuer    = var.oidc_issuer_url
  #     client_id = var.oidc_client_id
  #   }
  # }

  xray_enabled = var.environment == "prod"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# IAM role for AppSync logs
resource "aws_iam_role" "appsync_logs_role" {
  name = "${var.app_name}-appsync-logs-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# IAM policy for AppSync logs
resource "aws_iam_role_policy" "appsync_logs_policy" {
  name = "${var.app_name}-appsync-logs-policy-${var.environment}"
  role = aws_iam_role.appsync_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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

# We need to find an alternative way to set the schema
# The resource "aws_appsync_schema" is not supported
# resource "aws_appsync_schema" "timelapse_schema" {
#   api_id      = aws_appsync_graphql_api.timelapse_api.id
#   definition  = file("${path.module}/schema.graphql")
# }

# DynamoDB Data Source for Users
resource "aws_appsync_datasource" "users_datasource" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "UsersTable"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.users_table.name
    region     = var.aws_region
  }
}

# DynamoDB Data Source for Posts
resource "aws_appsync_datasource" "posts_datasource" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "PostsTable"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.posts_table.name
    region     = var.aws_region
  }
}

# DynamoDB Data Source for Follows
resource "aws_appsync_datasource" "follows_datasource" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "FollowsTable"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.follows_table.name
    region     = var.aws_region
  }
}

# DynamoDB Data Source for Interactions
resource "aws_appsync_datasource" "interactions_datasource" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "InteractionsTable"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.interactions_table.name
    region     = var.aws_region
  }
}

# IAM role for AppSync to access DynamoDB
resource "aws_iam_role" "appsync_dynamodb_role" {
  name = "${var.app_name}-appsync-dynamodb-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# IAM policy for AppSync to access DynamoDB
resource "aws_iam_role_policy" "appsync_dynamodb_policy" {
  name = "${var.app_name}-appsync-dynamodb-policy-${var.environment}"
  role = aws_iam_role.appsync_dynamodb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.users_table.arn,
          "${aws_dynamodb_table.users_table.arn}/index/*",
          aws_dynamodb_table.posts_table.arn,
          "${aws_dynamodb_table.posts_table.arn}/index/*",
          aws_dynamodb_table.follows_table.arn,
          "${aws_dynamodb_table.follows_table.arn}/index/*",
          aws_dynamodb_table.interactions_table.arn,
          "${aws_dynamodb_table.interactions_table.arn}/index/*"
        ]
      }
    ]
  })
}

# Add NONE data source for pipeline resolvers
resource "aws_appsync_datasource" "none" {
  api_id = aws_appsync_graphql_api.timelapse_api.id
  name   = "NONE"
  type   = "NONE"
}

# Add AppSync function for getting follows
resource "aws_appsync_function" "get_follows" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  data_source = aws_appsync_datasource.follows_datasource.name
  name        = "GetFollowsFunction"
  
  code = <<EOF
export function request(ctx) {
  return {
    "version": "2018-05-29",
    "operation": "Query",
    "index": "byFollowerId",
    "query": {
      "expression": "followerId = :followerId",
      "expressionValues": {
        ":followerId": { "S": ctx.identity.sub || ctx.args.userId }
      }
    },
    "limit": ctx.args.limit || 20,
    "nextToken": ctx.args.nextToken || null,
    "scanIndexForward": false
  };
}

export function response(ctx) {
  const followedUsers = ctx.result.items.map(follow => follow.followingId);
  ctx.stash.followedUsers = followedUsers;
  return ctx.result;
}
EOF

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Add AppSync function for getting followed posts
resource "aws_appsync_function" "get_followed_posts" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  data_source = aws_appsync_datasource.posts_datasource.name
  name        = "GetFollowedPostsFunction"
  
  code = <<EOF
export function request(ctx) {
  const followedUsers = ctx.stash.followedUsers || [];
  
  if (followedUsers.length === 0) {
    return {
      "version": "2018-05-29",
      "operation": "Scan",
      "limit": 0  // Return empty list if no followed users
    };
  }
  
  // Create filter expression for userId IN (followedUser1, followedUser2, ...)
  const expressionValues = {};
  const filterExpressions = followedUsers.map((userId, index) => {
    const placeholder = `:user$${index}`;
    expressionValues[placeholder] = { "S": userId };
    return `userId = $${placeholder}`;
  });
  
  return {
    "version": "2018-05-29",
    "operation": "Scan",
    "filter": {
      "expression": filterExpressions.join(" OR "),
      "expressionValues": expressionValues
    },
    "limit": ctx.args.limit || 20,
    "nextToken": ctx.args.nextToken || null
  };
}

export function response(ctx) {
  return ctx.result;
}
EOF

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

# Pipeline functions for listFollowedPosts
resource "aws_appsync_function" "get_followed_users" {
  api_id                   = aws_appsync_graphql_api.timelapse_api.id
  data_source             = aws_appsync_datasource.follows_datasource.name
  name                    = "getFollowedUsers"
  request_mapping_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "followerId = :followerId",
    "expressionValues": {
      ":followerId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub)
    }
  }
}
EOF
  response_mapping_template = <<EOF
#set($followedUsers = [])
#foreach($follow in $ctx.result.items)
  $util.qr($followedUsers.add($follow.followedId))
#end
$util.toJson($followedUsers)
EOF
}

resource "aws_appsync_function" "get_posts_by_users" {
  api_id                   = aws_appsync_graphql_api.timelapse_api.id
  data_source             = aws_appsync_datasource.posts_datasource.name
  name                    = "getPostsByUsers"
  request_mapping_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Query",
  "query": {
    "expression": "userId IN :userIds",
    "expressionValues": {
      ":userIds": $util.dynamodb.toDynamoDBJson($ctx.prev.result)
    }
  }
}
EOF
  response_mapping_template = <<EOF
$util.toJson($ctx.result.items)
EOF
}

# Pipeline resolver for listFollowedPosts
resource "aws_appsync_resolver" "list_followed_posts" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Query"
  field       = "listFollowedPosts"
  kind        = "PIPELINE"
  
  request_template = <<EOF
{
  "version": "2018-05-29",
  "payload": {}
}
EOF

  response_template = <<EOF
$util.toJson($ctx.result)
EOF

  pipeline_config {
    functions = [
      aws_appsync_function.get_followed_users.function_id,
      aws_appsync_function.get_posts_by_users.function_id
    ]
  }
}

# Lambda function data source for generating presigned URLs
resource "aws_appsync_datasource" "generate_presigned_url_datasource" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "GeneratePresignedUrlFunction"
  service_role_arn = aws_iam_role.appsync_lambda_role.arn
  type             = "AWS_LAMBDA"

  lambda_config {
    function_arn = aws_lambda_function.presigned_url_lambda.arn
  }
}

# IAM role for AppSync to invoke Lambda
resource "aws_iam_role" "appsync_lambda_role" {
  name = "${var.app_name}-appsync-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "appsync.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# IAM policy for AppSync to invoke Lambda
resource "aws_iam_role_policy" "appsync_lambda_policy" {
  name = "${var.app_name}-appsync-lambda-policy-${var.environment}"
  role = aws_iam_role.appsync_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "lambda:InvokeFunction"
        ]
        Effect   = "Allow"
        Resource = [aws_lambda_function.presigned_url_lambda.arn]
      }
    ]
  })
}

# Resolver for generatePresignedUrl mutation
resource "aws_appsync_resolver" "generate_presigned_url_resolver" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Mutation"
  field       = "generatePresignedUrl"
  data_source = aws_appsync_datasource.generate_presigned_url_datasource.name

  # Direct Lambda resolver
  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Invoke",
  "payload": {
    "arguments": $util.toJson($context.arguments),
    "identity": {
      "sub": "$context.identity.sub",
      "username": "$context.identity.username"
    }
  }
}
EOF

  response_template = "$util.toJson($context.result)"
}

  
