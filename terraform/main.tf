terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# -------------------------------------------------------------
# VPC & Networking (Isolated Private Subnets for Database)
# -------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "whatsapp-helpdesk-vpc-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "whatsapp-helpdesk-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "whatsapp-helpdesk-private-b"
  }
}

resource "aws_db_subnet_group" "rds" {
  name       = "whatsapp-helpdesk-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "DB Subnet Group for WhatsApp Helpdesk"
  }
}

# -------------------------------------------------------------
# Security Group (Only accessible by backend application)
# -------------------------------------------------------------
resource "aws_security_group" "db_sg" {
  name        = "whatsapp-helpdesk-db-sg"
  description = "Allow inbound PostgreSQL traffic from application service"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL access from VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -------------------------------------------------------------
# Managed PostgreSQL 16 Database (Amazon RDS)
# -------------------------------------------------------------
resource "aws_db_instance" "postgres" {
  identifier             = "whatsapp-helpdesk-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = var.db_instance_class
  allocated_storage      = var.allocated_storage
  max_allocated_storage  = 100
  storage_type           = "gp3"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.rds.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = var.environment != "production"
  publicly_accessible    = false
  deletion_protection    = var.environment == "production"

  backup_retention_period = 7
  auto_minor_version_upgrade = true

  tags = {
    Name        = "WhatsApp Helpdesk Database"
    Environment = var.environment
  }
}
