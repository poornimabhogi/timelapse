resource "aws_cognito_user_pool" "main" {
  name = "timelapse-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  auto_verify {
    email = true
  }
}

resource "aws_appsync_graphql_api" "timelapse_api" {
  name                = "timelapse-api"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"
  user_pool_config {
    user_pool_id   = aws_cognito_user_pool.user_pool.id
    aws_region     = var.aws_region
    default_action = "ALLOW"
  }
}

resource "aws_appsync_api_key" "timelapse_api_key" {
  api_id  = aws_appsync_graphql_api.timelapse_api.id
  expires = "2025-12-31T23:59:59Z"
}

resource "aws_appsync_datasource" "timelapse_datasource" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "timelapse_datasource"
  service_role_arn = aws_iam_role.appsync_role.arn
  type             = "AMAZON_DYNAMODB"
  dynamodb_config {
    table_name = aws_dynamodb_table.timelapses.name
    region     = var.aws_region
    versioned  = true
  }
}

resource "aws_iam_role" "appsync_role" {
  name = "appsync-dynamodb-role"

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
}

resource "aws_iam_role_policy" "appsync_dynamodb_policy" {
  name = "appsync-dynamodb-policy"
  role = aws_iam_role.appsync_role.id

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
          "dynamodb:Scan"
        ]
        Effect = "Allow"
        Resource = [
          aws_dynamodb_table.timelapses.arn,
          "${aws_dynamodb_table.timelapses.arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_appsync_resolver" "timelapse_resolver" {
  api_id            = aws_appsync_graphql_api.timelapse_api.id
  field             = "timelapses"
  type              = "Query"
  data_source       = aws_appsync_datasource.timelapse_datasource.name
  request_template  = <<EOF
{
    "version": "2017-02-28",
    "operation": "Query",
    "query": {
        "expression": "userId = :userId",
        "expressionValues": {
            ":userId": $util.dynamodb.toDynamoDBJson($ctx.identity.sub)
        }
    }
}
EOF
  response_template = "$util.toJson($ctx.result.items)"
}

# We need to find an alternative way to set the schema
# The resource "aws_appsync_schema" is not supported
# resource "aws_appsync_schema" "timelapse_schema" {
#   api_id      = aws_appsync_graphql_api.timelapse_api.id
#   definition  = file("${path.module}/schema.graphql")
# }

# DynamoDB Data Source for Users 