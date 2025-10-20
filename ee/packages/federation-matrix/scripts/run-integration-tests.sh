#!/bin/bash

# Federation Integration Test Runner
# This script starts the federation services and waits for Rocket.Chat to be ready
# before running the end-to-end tests.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_COMPOSE_FILE="$PACKAGE_ROOT/docker-compose.test.yml"
MAX_WAIT_TIME=150  # 2:30 minutes
CHECK_INTERVAL=5   # Check every 5 seconds
RC1_CONTAINER="rc1"

# Parse command line arguments
KEEP_RUNNING=false
INCLUDE_ELEMENT=false
INTERRUPTED=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-running)
            KEEP_RUNNING=true
            shift
            ;;
        --element)
            INCLUDE_ELEMENT=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --keep-running    Keep Docker containers running after tests complete"
            echo "  --element         Include Element web client in the test environment"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "By default, only runs the 'test' profile (Rocket.Chat, Synapse, MongoDB)"
            echo "Use --element to run all services including Element web client"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_error() {
    echo -e "${RED}❌ [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Cleanup function
cleanup() {
    if [ "$KEEP_RUNNING" = true ]; then
        log_info "Keeping Docker containers running (--keep-running flag set)"
        log_info "Services are available at:"
        log_info "  - Rocket.Chat: https://rc1"
        log_info "  - Synapse: https://hs1"
        log_info "  - MongoDB: localhost:27017"
        if [ "$INCLUDE_ELEMENT" = true ]; then
            log_info "  - Element: https://element"
        fi
        if [ "$INCLUDE_ELEMENT" = true ]; then
            log_info "To stop containers manually, run: docker-compose -f $DOCKER_COMPOSE_FILE --profile test --profile element down -v"
        else
            log_info "To stop containers manually, run: docker-compose -f $DOCKER_COMPOSE_FILE --profile test down -v"
        fi
    else
        log_info "Cleaning up services..."
        if [ -f "$DOCKER_COMPOSE_FILE" ]; then
            if [ "$INCLUDE_ELEMENT" = true ]; then
                docker-compose -f "$DOCKER_COMPOSE_FILE" --profile test --profile element down -v 2>/dev/null || true
            else
                docker-compose -f "$DOCKER_COMPOSE_FILE" --profile test down -v 2>/dev/null || true
            fi
        fi
        log_success "Cleanup completed"
    fi
    
    # Exit with the test result code
    if [ -n "${TEST_EXIT_CODE:-}" ]; then
        exit $TEST_EXIT_CODE
    fi
}

# Setup signal handlers for cleanup
trap cleanup EXIT TERM

# Handle interrupt signal (Ctrl+C) immediately
trap 'INTERRUPTED=true; log_info "Received interrupt signal (Ctrl+C), stopping..."; cleanup; exit 130' INT

# Check if docker-compose.test.yml exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    log_error "docker-compose.test.yml not found at $DOCKER_COMPOSE_FILE"
    exit 1
fi


log_info "🚀 Starting Federation Integration Tests"
log_info "====================================="

# Start services
if [ "$INCLUDE_ELEMENT" = true ]; then
    log_info "Starting federation services with Element web client..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --profile test --profile element up -d --build
else
    log_info "Starting federation services (test profile only)..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --profile test up -d --build
fi

# Wait for rc1 container to be running
log_info "Waiting for rc1 container to start..."
timeout=60
while [ $timeout -gt 0 ] && [ "$INTERRUPTED" = false ]; do
    if docker ps --filter "name=$RC1_CONTAINER" --filter "status=running" | grep -q "$RC1_CONTAINER"; then
        log_success "rc1 container is running"
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ "$INTERRUPTED" = true ]; then
    log_info "Container startup interrupted by user"
    exit 130
fi

if [ $timeout -le 0 ]; then
    log_error "rc1 container failed to start within 60 seconds"
    exit 1
fi

# Wait for both Rocket.Chat and Synapse to be ready
log_info "Waiting for Rocket.Chat and Synapse servers to be ready..."

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local elapsed=0
    
    log_info "Checking $name at $url..."
    
    while [ $elapsed -lt $MAX_WAIT_TIME ] && [ "$INTERRUPTED" = false ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            log_success "$name is ready!"
            return 0
        fi
        
        log_info "$name not ready yet, waiting... (${elapsed}s/${MAX_WAIT_TIME}s)"
        sleep $CHECK_INTERVAL
        elapsed=$((elapsed + CHECK_INTERVAL))
    done
    
    if [ "$INTERRUPTED" = true ]; then
        log_info "Service check interrupted by user"
        return 1
    fi
    
    log_error "$name failed to become ready within ${MAX_WAIT_TIME} seconds"
    return 1
}

# Wait for Rocket.Chat
if ! wait_for_service "https://rc1/api/info" "Rocket.Chat"; then
    log_error "Last 50 lines of rc1 logs:"
    docker logs --tail 50 "$RC1_CONTAINER" 2>&1 | sed 's/^/  /'
    exit 1
fi

# Wait for Synapse
if ! wait_for_service "https://hs1/_matrix/client/versions" "Synapse"; then
    log_error "Last 50 lines of hs1 logs:"
    docker logs --tail 50 "hs1" 2>&1 | sed 's/^/  /'
    exit 1
fi

# Run the end-to-end tests
log_info "Running end-to-end tests..."
cd "$PACKAGE_ROOT"

# Set NODE_EXTRA_CA_CERTS to use the custom CA certificate
export NODE_EXTRA_CA_CERTS="$(pwd)/docker-compose/traefik/certs/ca/rootCA.crt"

yarn testend-to-end
TEST_EXIT_CODE=$?
