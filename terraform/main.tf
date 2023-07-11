# main.tf
provider "aws" {
  access_key = var.AWS_ACCESS_KEY_ID
  secret_key = var.AWS_SECRET_ACCESS_KEY
  region     = var.AWS_REGION
}

resource "aws_s3_bucket" "app_bucket" {
  bucket = var.AWS_BUCKET_NAME

  tags = {
    Name        = "My bucket"
    Environment = "Dev"
  }
}