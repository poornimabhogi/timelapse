# DynamoDB table for timelapse items
resource "aws_dynamodb_table" "timelapse_items_table" {
  name           = "${var.app_name}-timelapse-items-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  # Secondary index for querying by user
  global_secondary_index {
    name               = "byUser"
    hash_key           = "userId"
    range_key          = "createdAt"
    projection_type    = "ALL"
  }

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "N"
  }

  tags = {
    Name        = "${var.app_name}-timelapse-items-${var.environment}"
    Environment = var.environment
    Application = var.app_name
  }
}

# Add resolver for createTimelapseItem mutation
resource "aws_appsync_resolver" "create_timelapse_item" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Mutation"
  field       = "createTimelapseItem"
  data_source = aws_appsync_datasource.timelapse_items_datasource.name

  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": {
    "userId": $util.dynamodb.toDynamoDBJson($ctx.args.input.userId),
    "mediaUrl": $util.dynamodb.toDynamoDBJson($ctx.args.input.mediaUrl),
    "type": $util.dynamodb.toDynamoDBJson($ctx.args.input.type),
    "createdAt": $util.dynamodb.toDynamoDBJson($ctx.args.input.createdAt),
    "description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
    "likes": $util.dynamodb.toDynamoDBJson($ctx.args.input.likes),
    "likedBy": $util.dynamodb.toDynamoDBJson($ctx.args.input.likedBy),
    "duration": $util.dynamodb.toDynamoDBJson($ctx.args.input.duration)
  }
}
EOF

  response_template = <<EOF
$util.toJson($ctx.result)
EOF
}

# Add resolver for listTimelapseItems query
resource "aws_appsync_resolver" "list_timelapse_items" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Query"
  field       = "listTimelapseItems"
  data_source = aws_appsync_datasource.timelapse_items_datasource.name

  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "Query",
  "index": "byUser",
  "query": {
    "expression": "userId = :userId",
    "expressionValues": {
      ":userId": $util.dynamodb.toDynamoDBJson($ctx.args.userId)
    }
  },
  "limit": $util.defaultIfNull($ctx.args.limit, 100),
  "nextToken": $util.toJson($util.defaultIfNull($ctx.args.nextToken, null)),
  "scanIndexForward": false
}
EOF

  response_template = <<EOF
{
  "items": $util.toJson($ctx.result.items),
  "nextToken": $util.toJson($ctx.result.nextToken)
}
EOF
}

# Add resolver for updateTimelapseItem mutation
resource "aws_appsync_resolver" "update_timelapse_item" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Mutation"
  field       = "updateTimelapseItem"
  data_source = aws_appsync_datasource.timelapse_items_datasource.name

  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #likes = :likes, #likedBy = :likedBy, #description = :description",
    "expressionNames": {
      "#likes": "likes",
      "#likedBy": "likedBy",
      "#description": "description"
    },
    "expressionValues": {
      ":likes": $util.dynamodb.toDynamoDBJson($ctx.args.input.likes),
      ":likedBy": $util.dynamodb.toDynamoDBJson($ctx.args.input.likedBy),
      ":description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description)
    }
  }
}
EOF

  response_template = <<EOF
$util.toJson($ctx.result)
EOF
}

# Add resolver for deleteTimelapseItem mutation
resource "aws_appsync_resolver" "delete_timelapse_item" {
  api_id      = aws_appsync_graphql_api.timelapse_api.id
  type        = "Mutation"
  field       = "deleteTimelapseItem"
  data_source = aws_appsync_datasource.timelapse_items_datasource.name

  request_template = <<EOF
{
  "version": "2018-05-29",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  }
}
EOF

  response_template = <<EOF
$util.toJson($ctx.result)
EOF
}

# DynamoDB Data Source for Timelapse Items
resource "aws_appsync_datasource" "timelapse_items_datasource" {
  api_id           = aws_appsync_graphql_api.timelapse_api.id
  name             = "TimelapseItemsTable"
  service_role_arn = aws_iam_role.appsync_dynamodb_role.arn
  type             = "AMAZON_DYNAMODB"

  dynamodb_config {
    table_name = aws_dynamodb_table.timelapse_items_table.name
    region     = var.aws_region
  }
} 