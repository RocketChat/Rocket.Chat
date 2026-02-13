#!/bin/bash
# docker-vite-ci.sh - Test CI Docker Compose configuration locally
# This script mimics the CI environment for the Vite-based frontend/backend setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Set environment variables for compose (mimic CI)
export GITHUB_WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"
export LOWERCASE_REPOSITORY="${LOWERCASE_REPOSITORY:-rocketchat}"
export DOCKER_TAG="${DOCKER_TAG:-local-test}"
export MONGODB_VERSION="${MONGODB_VERSION:-8.0}"

BUILD_DIR="${BUILD_DIR:-/tmp/build}"
MARKER="$BUILD_DIR/.meteor-build-marker"

log_info "Using workspace: $GITHUB_WORKSPACE"
log_info "Build output dir: $BUILD_DIR"

# Step 1: Build workspace packages (core-services, etc.)
log_info "Building workspace packages..."
yarn turbo run build --filter='./packages/*' --filter='./ee/packages/*'

# Step 2: Build Vite frontend
log_info "Building Vite frontend..."
cd apps/meteor
ROOT_URL=http://localhost:3000/ npx vite build
cd ../..

# Step 3: Build Meteor backend (with caching)
# Check if rebuild is needed based on source file changes
needs_rebuild() {
  [ ! -f "$MARKER" ] && return 0
  # Check meteor app sources AND workspace packages
  find apps/meteor/server apps/meteor/packages apps/meteor/ee apps/meteor/lib apps/meteor/imports \
       packages ee/packages \
    -newer "$MARKER" -type f \( -name '*.ts' -o -name '*.js' -o -name '*.json' \) \
    2>/dev/null | grep -q .
}

# Allow forcing rebuild with FORCE_REBUILD=1
if [ "${FORCE_REBUILD:-}" = "1" ] || needs_rebuild; then
  log_info "Building Meteor backend (this may take a while)..."
  cd apps/meteor
  meteor build --server-only --directory "$BUILD_DIR"
  cd ../..
  touch "$MARKER"
  log_info "Meteor build complete"
else
  log_info "Meteor build cache is fresh, skipping rebuild (use FORCE_REBUILD=1 to override)"
fi

# Verify build outputs exist
if [ ! -d "$BUILD_DIR/bundle" ]; then
  log_error "Meteor build output not found at $BUILD_DIR/bundle"
  exit 1
fi

if [ ! -d "apps/meteor/dist" ]; then
  log_error "Vite build output not found at apps/meteor/dist"
  exit 1
fi

# Step 4: Validate compose configuration
log_info "Validating docker-compose configuration..."
if ! docker compose -f docker-compose-ci-vite.yml config > /dev/null 2>&1; then
  log_error "Compose configuration invalid:"
  docker compose -f docker-compose-ci-vite.yml config
  exit 1
fi

# Step 5: Build and start services
log_info "Building Docker images..."
docker compose -f docker-compose-ci-vite.yml build rocketchat frontend

log_info "Starting services (mongo, traefik, rocketchat, frontend)..."
docker compose -f docker-compose-ci-vite.yml up -d mongo traefik
sleep 5  # Wait for mongo to initialize

docker compose -f docker-compose-ci-vite.yml up -d rocketchat frontend

log_info "Services starting. Use the following commands to manage:"
echo ""
echo "  View logs:      docker compose -f docker-compose-ci-vite.yml logs -f"
echo "  Check status:   docker compose -f docker-compose-ci-vite.yml ps"
echo "  Stop services:  docker compose -f docker-compose-ci-vite.yml down"
echo "  Traefik dashboard: http://localhost:8080"
echo "  Application:    http://localhost:3000"
echo ""
log_info "Waiting for services to be healthy..."
docker compose -f docker-compose-ci-vite.yml logs -f rocketchat frontend &
LOG_PID=$!

# Wait for health checks
timeout=120
elapsed=0
while [ $elapsed -lt $timeout ]; do
  if docker compose -f docker-compose-ci-vite.yml ps --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
    backend_healthy=$(docker compose -f docker-compose-ci-vite.yml ps rocketchat --format json 2>/dev/null | grep -c '"Health":"healthy"' || true)
    frontend_healthy=$(docker compose -f docker-compose-ci-vite.yml ps frontend --format json 2>/dev/null | grep -c '"Health":"healthy"' || true)
    if [ "$backend_healthy" -ge 1 ] && [ "$frontend_healthy" -ge 1 ]; then
      kill $LOG_PID 2>/dev/null || true
      echo ""
      log_info "All services healthy! Application ready at http://localhost:3000"
      exit 0
    fi
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

kill $LOG_PID 2>/dev/null || true
log_warn "Timeout waiting for services. Check logs with: docker compose -f docker-compose-ci-vite.yml logs"
