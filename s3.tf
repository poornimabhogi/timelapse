resource "aws_s3_bucket" "media_bucket" {
  bucket = var.s3_media_bucket_name != null ? var.s3_media_bucket_name : "timelapse-media-${var.environment}-${random_id.suffix.hex}"

  tags = {
    Environment = var.environment
    Project     = var.app_name
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
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"] # In production, restrict to your application domains
    expose_headers  = ["ETag", "Content-Length", "Content-Type"]
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

# Comment out the public access block to allow access to files
# You should implement proper IAM permissions instead of making bucket public
# resource "aws_s3_bucket_public_access_block" "media_bucket_public_access" {
#   bucket = aws_s3_bucket.media_bucket.id
# 
#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }

# Replace the public access block with a bucket policy that allows public reads
resource "aws_s3_bucket_policy" "media_bucket_policy" {
  bucket = aws_s3_bucket.media_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Principal = "*"
        Action = [
          "s3:GetObject"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.media_bucket.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_ownership_controls" "media_bucket_ownership" {
  bucket = aws_s3_bucket.media_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Create standard folders in the bucket
resource "aws_s3_object" "uploads_folder" {
  bucket = aws_s3_bucket.media_bucket.id
  key    = "uploads/"
  content_type = "application/x-directory"
  acl    = "public-read"
}

resource "aws_s3_object" "processed_folder" {
  bucket = aws_s3_bucket.media_bucket.id
  key    = "processed/"
  content_type = "application/x-directory"
  acl    = "public-read"
}

resource "aws_s3_object" "thumbnails_folder" {
  bucket = aws_s3_bucket.media_bucket.id
  key    = "thumbnails/"
  content_type = "application/x-directory"
  acl    = "public-read"
} 