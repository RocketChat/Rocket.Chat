#!/bin/bash
# docker-vite-ci.sh - Test CI Docker Compose configuration locally
# This script mimics the CI environment for the Vite-based frontend/backend setup
#
# Usage: ./docker-vite-ci.sh [command]
#
# Commands:
#   start    Build and start all services (default)
#   stop     Stop all services and remove volumes
#   reset    Reset Rocket.Chat to initial state (fresh database)
#   rebuild  Rebuild frontend or backend without full restart
#   logs     Follow logs from rocketchat and frontend
#   status   Show status of all services
#   help     Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
COMPOSE_FILE="docker-compose-ci-vite.yml"
export GITHUB_WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"
export LOWERCASE_REPOSITORY="${LOWERCASE_REPOSITORY:-rocketchat}"
export DOCKER_TAG="${DOCKER_TAG:-local-test}"
export MONGODB_VERSION="${MONGODB_VERSION:-8.0}"
BUILD_DIR="${BUILD_DIR:-/tmp/build}"
MARKER="$BUILD_DIR/.meteor-build-marker"

# Check if rebuild is needed based on source file changes
needs_rebuild() {
  [ ! -f "$MARKER" ] && return 0
  find apps/meteor/server apps/meteor/packages apps/meteor/ee apps/meteor/lib apps/meteor/imports \
       packages ee/packages \
    -newer "$MARKER" -type f \( -name '*.ts' -o -name '*.js' -o -name '*.json' \) \
    2>/dev/null | grep -q .
}

# Wait for a service to be healthy
wait_for_healthy() {
  local service=$1
  local timeout=${2:-120}
  local elapsed=0
  
  while [ $elapsed -lt $timeout ]; do
    if docker compose -f $COMPOSE_FILE ps "$service" --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
  done
  echo ""
  return 1
}

# ============================================================================
# COMMAND: start
# ============================================================================
cmd_start() {
  log_info "Using workspace: $GITHUB_WORKSPACE"
  log_info "Build output dir: $BUILD_DIR"

  # Step 1: Build workspace packages
  log_info "Building workspace packages..."
  yarn turbo run build --filter='./packages/*' --filter='./ee/packages/*'

  # Step 2: Build Vite frontend
  log_info "Building Vite frontend..."
  cd apps/meteor
  ROOT_URL=http://localhost:3000/ VITE_TEST_MODE=true VITE_E2E_COVERAGE=true npx vite build --outDir /tmp/build/dist
  cd ../..

  # Step 3: Build Meteor backend (with caching)
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

  if [ ! -d "/tmp/build/dist" ]; then
    log_error "Vite build output not found at /tmp/build/dist"
    exit 1
  fi

  # Step 4: Validate compose configuration
  log_info "Validating docker-compose configuration..."
  if ! docker compose -f $COMPOSE_FILE config > /dev/null 2>&1; then
    log_error "Compose configuration invalid:"
    docker compose -f $COMPOSE_FILE config
    exit 1
  fi

  # Step 5: Build and start services
  log_info "Building Docker images..."
  docker compose -f $COMPOSE_FILE build rocketchat frontend

  log_info "Starting services (mongo, traefik, rocketchat, frontend)..."
  docker compose -f $COMPOSE_FILE up -d mongo traefik
  sleep 5

  docker compose -f $COMPOSE_FILE up -d rocketchat frontend

  log_info "Services starting. Use the following commands to manage:"
  echo ""
  echo "  View logs:      $0 logs"
  echo "  Check status:   $0 status"
  echo "  Stop services:  $0 stop"
  echo "  Reset database: $0 reset"
  echo "  Traefik dashboard: http://localhost:8081"
  echo "  Application:    http://localhost:3000"
  echo ""
  
  log_info "Waiting for services to be healthy..."
  docker compose -f $COMPOSE_FILE logs -f rocketchat frontend &
  LOG_PID=$!

  timeout=120
  elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if docker compose -f $COMPOSE_FILE ps --format json 2>/dev/null | grep -q '"Health":"healthy"'; then
      backend_healthy=$(docker compose -f $COMPOSE_FILE ps rocketchat --format json 2>/dev/null | grep -c '"Health":"healthy"' || true)
      frontend_healthy=$(docker compose -f $COMPOSE_FILE ps frontend --format json 2>/dev/null | grep -c '"Health":"healthy"' || true)
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
  log_warn "Timeout waiting for services. Check logs with: $0 logs"
}

# ============================================================================
# COMMAND: stop
# ============================================================================
cmd_stop() {
  log_info "Stopping all services and removing volumes..."
  docker compose -f $COMPOSE_FILE down -v
  log_info "All services stopped"
}

# ============================================================================
# COMMAND: reset
# ============================================================================
cmd_reset() {
  # Check if mongo is running
  if ! docker compose -f $COMPOSE_FILE ps mongo --format json 2>/dev/null | grep -q '"State":"running"'; then
    log_error "MongoDB is not running. Start the environment first with: $0 start"
    exit 1
  fi

  log_info "Stopping rocketchat and frontend services..."
  docker compose -f $COMPOSE_FILE stop rocketchat frontend

  log_info "Dropping rocketchat database..."
  docker compose -f $COMPOSE_FILE exec -T mongo mongosh --quiet --eval "db.getSiblingDB('rocketchat').dropDatabase()"

  log_info "Starting rocketchat service..."
  docker compose -f $COMPOSE_FILE up -d rocketchat

  log_info "Waiting for rocketchat to be healthy..."
  if ! wait_for_healthy rocketchat 120; then
    log_warn "Timeout waiting for rocketchat. Check logs with: $0 logs"
    exit 1
  fi
  log_info "Rocketchat is healthy"

  log_info "Starting frontend service..."
  docker compose -f $COMPOSE_FILE up -d frontend

  log_info "Waiting for frontend to be healthy..."
  if ! wait_for_healthy frontend 60; then
    log_warn "Timeout waiting for frontend. Check logs with: $0 logs"
    exit 1
  fi
  log_info "Frontend is healthy"

  log_info "Reset complete! Rocket.Chat is ready at http://localhost:3000"
}

# ============================================================================
# COMMAND: rebuild
# ============================================================================
cmd_rebuild() {
  local target="${1:-frontend}"
  
  case "$target" in
    frontend)
      log_info "Rebuilding Vite frontend..."
      cd apps/meteor
      ROOT_URL=http://localhost:3000/ VITE_TEST_MODE=true npx vite build --outDir /tmp/build/dist
      cd ../..
      
      log_info "Rebuilding frontend Docker image..."
      docker compose -f $COMPOSE_FILE build frontend
      
      log_info "Recreating frontend container..."
      docker compose -f $COMPOSE_FILE up -d --no-deps --force-recreate frontend
      
      log_info "Waiting for frontend to be healthy..."
      if ! wait_for_healthy frontend 60; then
        log_warn "Timeout waiting for frontend"
        exit 1
      fi
      log_info "Frontend rebuild complete!"
      ;;
    backend)
      log_info "Rebuilding Meteor backend..."
      cd apps/meteor
      meteor build --server-only --directory "$BUILD_DIR"
      cd ../..
      touch "$MARKER"
      
      log_info "Rebuilding backend Docker image..."
      docker compose -f $COMPOSE_FILE build rocketchat
      
      log_info "Recreating rocketchat container..."
      docker compose -f $COMPOSE_FILE up -d --no-deps --force-recreate rocketchat
      
      log_info "Waiting for rocketchat to be healthy..."
      if ! wait_for_healthy rocketchat 120; then
        log_warn "Timeout waiting for rocketchat"
        exit 1
      fi
      log_info "Backend rebuild complete!"
      ;;
    all)
      cmd_rebuild frontend
      cmd_rebuild backend
      ;;
    *)
      log_error "Unknown rebuild target: $target"
      echo "Usage: $0 rebuild [frontend|backend|all]"
      exit 1
      ;;
  esac
}

# ============================================================================
# COMMAND: logs
# ============================================================================
cmd_logs() {
  docker compose -f $COMPOSE_FILE logs -f rocketchat frontend
}

# ============================================================================
# COMMAND: status
# ============================================================================
cmd_status() {
  docker compose -f $COMPOSE_FILE ps
}

# ============================================================================
# COMMAND: help
# ============================================================================
cmd_help() {
  echo "Usage: $0 [command] [options]"
  echo ""
  echo "Test CI Docker Compose configuration locally."
  echo "Mimics the CI environment for the Vite-based frontend/backend setup."
  echo ""
  echo "Commands:"
  echo "  start              Build and start all services (default)"
  echo "  stop               Stop all services and remove volumes"
  echo "  reset              Reset Rocket.Chat to initial state (drop database)"
  echo "  rebuild [target]   Rebuild services without full restart"
  echo "                     target: frontend (default), backend, all"
  echo "  logs               Follow logs from rocketchat and frontend"
  echo "  status             Show status of all services"
  echo "  help               Show this help message"
  echo ""
  echo "Environment variables:"
  echo "  FORCE_REBUILD=1    Force Meteor backend rebuild even if cache is fresh"
  echo "  BUILD_DIR          Build output directory (default: /tmp/build)"
  echo "  MONGODB_VERSION    MongoDB version (default: 8.0)"
  echo ""
  echo "Examples:"
  echo "  $0 start           # Build and start everything"
  echo "  $0 reset           # Reset database for fresh test run"
  echo "  $0 rebuild frontend # Rebuild only the frontend"
  echo "  FORCE_REBUILD=1 $0 start  # Force full rebuild"
}

# ============================================================================
# MAIN
# ============================================================================
COMMAND="${1:-start}"
shift || true

case "$COMMAND" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  reset)   cmd_reset ;;
  rebuild) cmd_rebuild "$@" ;;
  logs)    cmd_logs ;;
  status)  cmd_status ;;
  help)    cmd_help ;;
  *)
    log_error "Unknown command: $COMMAND"
    cmd_help
    exit 1
    ;;
esac
