#!/usr/bin/env bash
# ARGUS — Production Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -euo pipefail

ENV="${1:-staging}"
COMPOSE_FILE="docker/docker-compose.yml"
ENV_FILE=".env.${ENV}"

echo "═══ ARGUS Deployment [${ENV}] ═══"

# 1. Validate environment
if [ ! -f "${ENV_FILE}" ]; then
    echo "ERROR: ${ENV_FILE} not found. Create from .env.example."
    exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
    echo "ERROR: ${COMPOSE_FILE} not found."
    exit 1
fi

# 2. Pull latest images
echo "▸ Pulling latest images..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull

# 3. Run database migrations
echo "▸ Running database migrations..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm backend \
    alembic upgrade head

# 4. Start services
echo "▸ Starting services..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --remove-orphans

# 5. Health check
echo "▸ Running health checks..."
sleep 5
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")
if [ "${HEALTH}" = "200" ]; then
    echo "✓ Backend healthy (HTTP ${HEALTH})"
else
    echo "✗ Backend health check failed (HTTP ${HEALTH})"
    echo "  Run: docker compose -f ${COMPOSE_FILE} logs backend"
fi

# 6. Cleanup
echo "▸ Cleaning up..."
docker system prune -f --volumes

echo "═══ Deployment complete: ${ENV} ═══"
echo "Frontend: http://localhost"
echo "Backend:  http://localhost:8000"
echo "Docs:     http://localhost:8000/docs"
