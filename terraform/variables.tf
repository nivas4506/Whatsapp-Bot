variable "aws_region" {
  description = "AWS Region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "production"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "whatsapp_helpdesk"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "helpdesk_admin"
}

variable "db_password" {
  description = "Database master password (store securely)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS PostgreSQL Instance Class"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20
}
