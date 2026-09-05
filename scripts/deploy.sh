#!/usr/bin/env bash
# =============================================================================
# Automated Production Deployment Script for WhatsApp HOD Helpdesk Assistant
# =============================================================================
set -e

echo "🚀 Starting Automated Production Deployment..."

# 1. Ensure required environment file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found. Copy .env.example to .env and configure secrets first."
  exit 1
fi

# 2. Pull latest changes from git repository
echo "📥 Pulling latest changes from main branch..."
git fetch origin main
git reset --hard origin/main

# 3. Build container images
echo "🐳 Building Docker production containers..."
docker compose -f docker-compose.prod.yml build --pull

# 4. Run automated database migrations
echo "🗄️ Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm migrator

# 5. Start or update containers with zero/minimal downtime
echo "🔄 Starting bot services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 6. Verify health status
echo "🔍 Validating health status..."
sleep 5
for i in {1..6}; do
  if curl -sf http://localhost:3000/health > /dev/null; then
    echo "✅ Bot is Healthy and accepting WhatsApp webhooks!"
    docker compose -f docker-compose.prod.yml ps
    echo "🎉 Automated deployment completed successfully!"
    exit 0
  fi
  echo "Waiting for healthcheck... ($i/6)"
  sleep 5
done

echo "❌ Deployment verification failed. Checking container logs..."
docker compose -f docker-compose.prod.yml logs --tail 50 bot
exit 1
