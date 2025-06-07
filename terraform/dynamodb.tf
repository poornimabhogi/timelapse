resource "aws_dynamodb_table" "timelapses" {
  name           = "timelapses"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"
  range_key      = "createdAt"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "featured"
    type = "S"
  }

  global_secondary_index {
    name               = "byUserId"
    hash_key           = "userId"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "byFeatured"
    hash_key           = "featured"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}

resource "aws_dynamodb_table" "users_table" {
  name           = "users"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"
  range_key      = "createdAt"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "username"
    type = "S"
  }

  global_secondary_index {
    name               = "byUsername"
    hash_key           = "username"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}

resource "aws_dynamodb_table" "posts_table" {
  name           = "posts"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"
  range_key      = "createdAt"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "featured"
    type = "S"
  }

  global_secondary_index {
    name               = "byUserId"
    hash_key           = "userId"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "byFeatured"
    hash_key           = "featured"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}

resource "aws_dynamodb_table" "follows_table" {
  name           = "follows"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"
  range_key      = "createdAt"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "followerId"
    type = "S"
  }

  attribute {
    name = "followingId"
    type = "S"
  }

  global_secondary_index {
    name               = "byFollowerId"
    hash_key           = "followerId"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "byFollowingId"
    hash_key           = "followingId"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}

resource "aws_dynamodb_table" "interactions_table" {
  name           = "interactions"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"
  range_key      = "createdAt"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "postId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  global_secondary_index {
    name               = "byUserId"
    hash_key           = "userId"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "byPostId"
    hash_key           = "postId"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "byType"
    hash_key           = "type"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}

# Seller Verification Table
resource "aws_dynamodb_table" "seller_verifications" {
  name           = "seller_verifications"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name               = "byStatus"
    hash_key           = "status"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}

# Products Table
resource "aws_dynamodb_table" "products" {
  name           = "products"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "sellerId"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "isActive"
    type = "S"
  }

  global_secondary_index {
    name               = "bySellerId"
    hash_key           = "sellerId"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "byCategory"
    hash_key           = "category"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  global_secondary_index {
    name               = "byActiveStatus"
    hash_key           = "isActive"
    range_key          = "createdAt"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}
