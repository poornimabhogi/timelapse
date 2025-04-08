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

# Add resolver for getUser
resource "aws_appsync_resolver" "get_user" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Query"
  field       = "getUser"
  data_source = aws_appsync_datasource.users_datasource.name

  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "GetItem",
  "key": {
    "userId": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}
EOF

  response_template = <<EOF
$util.toJson($ctx.result)
EOF
}

# Add resolver for listFollowedPosts
resource "aws_appsync_resolver" "list_followed_posts" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Query"
  field       = "listFollowedPosts"

  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "FollowersIndex",
  "query": {
    "expression": "followerId = :followerId",
    "expressionValues": {
      ":followerId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 20),
  "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null)),
  "scanIndexForward": false
}
EOF

  response_template = <<EOF
#set($followedUsers = [])
#foreach($follow in $ctx.result.items)
  #set($success = $followedUsers.add($follow.followedId))
#end

#if($followedUsers.size() > 0)
  #set($limit = $util.defaultIfNull($ctx.args.limit, 20))
  #set($postsRequest = {
    "version": "2018-05-29",
    "operation": "Query",
    "index": "UserPostsIndex",
    "query": {
      "expression": "userId IN $util.toJson($followedUsers)",
    },
    "limit": $limit,
    "scanIndexForward": false
  })
  
  #if($ctx.args.nextToken)
    #set($postsRequest.nextToken = $ctx.args.nextToken)
  #end
  
  $util.qr($ctx.stash.put("postsRequest", $postsRequest))
  
  #return($postsRequest)
#else
  #return({ "items": [], "nextToken": null })
#end
EOF

  pipeline_config {
    functions = [
      aws_appsync_function.get_followed_posts.function_id
    ]
  }
}

# AppSync Function for getting followed posts
resource "aws_appsync_function" "get_followed_posts" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  data_source = aws_appsync_datasource.posts_datasource.name
  name        = "GetFollowedPostsFunction"
  
  code = <<EOF
export function request(ctx) {
  return ctx.stash.postsRequest;
}

export function response(ctx) {
  return ctx.result.items;
}
EOF

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }
}

  
