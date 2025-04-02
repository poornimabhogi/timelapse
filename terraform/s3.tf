locals {
  media_bucket_name = var.s3_media_bucket_name != null ? var.s3_media_bucket_name : "${var.app_name}-media-${var.environment}-${random_id.suffix.hex}"
}

resource "random_id" "suffix" {
  byte_length = 4
}

# S3 bucket for media storage
resource "aws_s3_bucket" "media_bucket" {
  bucket        = local.media_bucket_name
  force_destroy = var.environment != "prod" # Only allow force destroy in non-prod environments

  tags = {
    Name        = local.media_bucket_name
    Environment = var.environment
    Application = var.app_name
  }
}

# Public access block settings
resource "aws_s3_bucket_public_access_block" "media_bucket_public_access" {
  bucket = aws_s3_bucket.media_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable bucket versioning for media files in production
resource "aws_s3_bucket_versioning" "media_bucket_versioning" {
  bucket = aws_s3_bucket.media_bucket.id

  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

# Enable server-side encryption by default
resource "aws_s3_bucket_server_side_encryption_configuration" "media_bucket_encryption" {
  bucket = aws_s3_bucket.media_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Enable CORS for the S3 bucket
resource "aws_s3_bucket_cors_configuration" "media_bucket_cors" {
  bucket = aws_s3_bucket.media_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.environment == "prod" ? ["https://*.${var.app_name}.com"] : ["*"]
    expose_headers  = ["ETag", "Content-Length", "Content-Type"]
    max_age_seconds = 3600
  }
}

# Lifecycle policy for media files
resource "aws_s3_bucket_lifecycle_configuration" "media_bucket_lifecycle" {
  bucket = aws_s3_bucket.media_bucket.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    filter {
      prefix = "versions/"
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Create separate folders in the bucket
resource "aws_s3_object" "uploads_folder" {
  bucket       = aws_s3_bucket.media_bucket.id
  key          = "uploads/"
  content_type = "application/x-directory"
  acl          = "private"
}

resource "aws_s3_object" "processed_folder" {
  bucket       = aws_s3_bucket.media_bucket.id
  key          = "processed/"
  content_type = "application/x-directory"
  acl          = "private"
}

resource "aws_s3_object" "thumbnails_folder" {
  bucket       = aws_s3_bucket.media_bucket.id
  key          = "thumbnails/"
  content_type = "application/x-directory"
  acl          = "private"
} 