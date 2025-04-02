resource "aws_s3_bucket" "media_bucket" {
  bucket = "timelapse-media-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = "timelapse"
  }
}

resource "aws_s3_bucket_versioning" "media_bucket_versioning" {
  bucket = aws_s3_bucket.media_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "media_bucket_cors" {
  bucket = aws_s3_bucket.media_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"] # In production, restrict to your application domains
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

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

resource "aws_s3_bucket_public_access_block" "media_bucket_public_access" {
  bucket = aws_s3_bucket.media_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "media_bucket_ownership" {
  bucket = aws_s3_bucket.media_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
} 