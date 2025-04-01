locals {
  users_table_name = var.dynamodb_user_table_name != null ? var.dynamodb_user_table_name : "${var.app_name}-users-${var.environment}"
  posts_table_name = var.dynamodb_posts_table_name != null ? var.dynamodb_posts_table_name : "${var.app_name}-posts-${var.environment}"
}

# DynamoDB table for user data
resource "aws_dynamodb_table" "users_table" {
  name         = local.users_table_name
  billing_mode = var.environment == "prod" ? "PROVISIONED" : "PAY_PER_REQUEST"
  
  # Provisioned capacity for production (adjust based on expected load)
  dynamic "read_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      read_capacity = 10
    }
  }
  
  dynamic "write_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      write_capacity = 5
    }
  }
  
  hash_key = "userId"
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "email"
    type = "S"
  }
  
  attribute {
    name = "username"
    type = "S"
  }
  
  # GSI for email lookups
  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 5
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 3
      }
    }
  }
  
  # GSI for username lookups
  global_secondary_index {
    name            = "UsernameIndex"
    hash_key        = "username"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 5
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 3
      }
    }
  }
  
  # Point-in-time recovery for production
  point_in_time_recovery {
    enabled = var.environment == "prod"
  }
  
  # Server-side encryption
  server_side_encryption {
    enabled = true
  }
  
  # Time to live specification
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  tags = {
    Name        = local.users_table_name
    Environment = var.environment
    Application = var.app_name
  }
}

# DynamoDB table for posts
resource "aws_dynamodb_table" "posts_table" {
  name         = local.posts_table_name
  billing_mode = var.environment == "prod" ? "PROVISIONED" : "PAY_PER_REQUEST"
  
  # Provisioned capacity for production (adjust based on expected load)
  dynamic "read_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      read_capacity = 20
    }
  }
  
  dynamic "write_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      write_capacity = 10
    }
  }
  
  hash_key  = "postId"
  range_key = "userId"
  
  attribute {
    name = "postId"
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
  
  attribute {
    name = "postType"
    type = "S"
  }
  
  # GSI for user's posts
  global_secondary_index {
    name            = "UserPostsIndex"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 10
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 5
      }
    }
  }
  
  # GSI for post types (e.g., timelapse, feature posts)
  global_secondary_index {
    name            = "PostTypeIndex"
    hash_key        = "postType"
    range_key       = "createdAt"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 10
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 5
      }
    }
  }
  
  # Point-in-time recovery for production
  point_in_time_recovery {
    enabled = var.environment == "prod"
  }
  
  # Server-side encryption
  server_side_encryption {
    enabled = true
  }
  
  # Time to live specification
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  tags = {
    Name        = local.posts_table_name
    Environment = var.environment
    Application = var.app_name
  }
}

# DynamoDB table for user relationships (follows)
resource "aws_dynamodb_table" "follows_table" {
  name         = "${var.app_name}-follows-${var.environment}"
  billing_mode = var.environment == "prod" ? "PROVISIONED" : "PAY_PER_REQUEST"
  
  # Provisioned capacity for production (adjust based on expected load)
  dynamic "read_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      read_capacity = 10
    }
  }
  
  dynamic "write_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      write_capacity = 5
    }
  }
  
  hash_key  = "followerId"
  range_key = "followedId"
  
  attribute {
    name = "followerId"
    type = "S"
  }
  
  attribute {
    name = "followedId"
    type = "S"
  }
  
  attribute {
    name = "createdAt"
    type = "N"
  }
  
  # GSI for followers of a user
  global_secondary_index {
    name            = "FollowersIndex"
    hash_key        = "followedId"
    range_key       = "createdAt"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 10
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 5
      }
    }
  }
  
  # Point-in-time recovery for production
  point_in_time_recovery {
    enabled = var.environment == "prod"
  }
  
  # Server-side encryption
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name        = "${var.app_name}-follows-${var.environment}"
    Environment = var.environment
    Application = var.app_name
  }
}

# DynamoDB table for likes/comments
resource "aws_dynamodb_table" "interactions_table" {
  name         = "${var.app_name}-interactions-${var.environment}"
  billing_mode = var.environment == "prod" ? "PROVISIONED" : "PAY_PER_REQUEST"
  
  # Provisioned capacity for production (adjust based on expected load)
  dynamic "read_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      read_capacity = 25
    }
  }
  
  dynamic "write_capacity" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      write_capacity = 15
    }
  }
  
  hash_key  = "interactionId"
  range_key = "postId"
  
  attribute {
    name = "interactionId"
    type = "S"
  }
  
  attribute {
    name = "postId"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "type"
    type = "S"
  }
  
  attribute {
    name = "createdAt"
    type = "N"
  }
  
  # GSI for post interactions (likes, comments)
  global_secondary_index {
    name            = "PostInteractionsIndex"
    hash_key        = "postId"
    range_key       = "createdAt"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 25
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 15
      }
    }
  }
  
  # GSI for user interactions
  global_secondary_index {
    name            = "UserInteractionsIndex"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 10
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 5
      }
    }
  }
  
  # GSI for interaction types
  global_secondary_index {
    name            = "InteractionTypeIndex"
    hash_key        = "type"
    range_key       = "createdAt"
    projection_type = "ALL"
    
    dynamic "read_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        read_capacity = 10
      }
    }
    
    dynamic "write_capacity" {
      for_each = var.environment == "prod" ? [1] : []
      content {
        write_capacity = 5
      }
    }
  }
  
  # Point-in-time recovery for production
  point_in_time_recovery {
    enabled = var.environment == "prod"
  }
  
  # Server-side encryption
  server_side_encryption {
    enabled = true
  }
  
  tags = {
    Name        = "${var.app_name}-interactions-${var.environment}"
    Environment = var.environment
    Application = var.app_name
  }
}

# DynamoDB Auto-scaling for production environment
# Comment out if you're not using provisioned capacity or don't need auto-scaling
# resource "aws_appautoscaling_target" "dynamodb_users_table_read_target" {
#   count              = var.environment == "prod" ? 1 : 0
#   max_capacity       = 100
#   min_capacity       = 10
#   resource_id        = "table/${aws_dynamodb_table.users_table.name}"
#   scalable_dimension = "dynamodb:table:ReadCapacityUnits"
#   service_namespace  = "dynamodb"
# }
# 
# resource "aws_appautoscaling_policy" "dynamodb_users_table_read_policy" {
#   count              = var.environment == "prod" ? 1 : 0
#   name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.dynamodb_users_table_read_target[0].resource_id}"
#   policy_type        = "TargetTrackingScaling"
#   resource_id        = aws_appautoscaling_target.dynamodb_users_table_read_target[0].resource_id
#   scalable_dimension = aws_appautoscaling_target.dynamodb_users_table_read_target[0].scalable_dimension
#   service_namespace  = aws_appautoscaling_target.dynamodb_users_table_read_target[0].service_namespace
# 
#   target_tracking_scaling_policy_configuration {
#     predefined_metric_specification {
#       predefined_metric_type = "DynamoDBReadCapacityUtilization"
#     }
#     target_value = 70.0
#   }
# } 