#!/bin/bash

# Federation Integration Test Runner
# This script builds Rocket.Chat locally and starts the federation services,
# then waits for Rocket.Chat to be ready before running the end-to-end tests.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script moved under tests/scripts; package root is two levels up from script dir
PACKAGE_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DOCKER_COMPOSE_FILE="$PACKAGE_ROOT/docker-compose.test.yml"
MAX_WAIT_TIME=240  # 4 minutes
CHECK_INTERVAL=5   # Check every 5 seconds
RC1_CONTAINER="rc1"

# Build configuration
# Use a temporary directory outside the repo to avoid symlink traversal issues during Meteor build
BUILD_DIR="$(mktemp -d "${FEDERATION_TEST_TMPDIR:-/tmp}/rc-federation-build-XXXXXX")"
ROCKETCHAT_ROOT="$(cd "$PACKAGE_ROOT/../../.." && pwd)"  # Go up to project root

# Parse command line arguments
KEEP_RUNNING=false
INCLUDE_ELEMENT=false
USE_PREBUILT_IMAGE=false
PREBUILT_IMAGE=""
INTERRUPTED=false
PROFILE_PREFIX="local"  # Default to local build
NO_TEST=false

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
        --no-test)
            NO_TEST=true
            shift
            ;;
        --image)
            USE_PREBUILT_IMAGE=true
            # If no IMAGE value is provided (or next token is another flag), default to latest
            if [[ -z "${2:-}" || "$2" == -* ]]; then
                PREBUILT_IMAGE="rocketchat/rocket.chat:latest"
                shift 1
            else
                PREBUILT_IMAGE="$2"
                shift 2
            fi
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --keep-running    Keep Docker containers running after tests complete"
            echo "  --element         Include Element web client in the test environment"
            echo "  --no-test         Start containers and skip running tests"
            echo "  --image [IMAGE]   Use a pre-built Docker image instead of building locally"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "By default, builds Rocket.Chat locally and runs the 'test' profile"
            echo "Use --image to test against a pre-built image (e.g., --image rocketchat/rocket.chat:latest)"
            echo "If --image is provided without a value, defaults to rocketchat/rocket.chat:latest"
            echo "Use --element to run all services including Element web client"
            echo "Use --no-test to start containers and skip running tests"
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
    # Show container logs if tests failed
    if [ -n "${TEST_EXIT_CODE:-}" ] && [ "$TEST_EXIT_CODE" -ne 0 ]; then
        echo ""
        echo "=========================================="
        echo "CONTAINER LOGS (Test Failed)"
        echo "=========================================="

        echo ""
        echo "ROCKET.CHAT (rc1) LOGS:"
        echo "----------------------------------------"
        if docker ps -q -f name=rc1 | grep -q .; then
            docker logs rc1 2>&1 | sed 's/^/  /'
        else
            echo "  Rocket.Chat container not found or no logs"
        fi

        echo ""
        echo "SYNAPSE (hs1) LOGS:"
        echo "----------------------------------------"
        if docker ps -q -f name=hs1 | grep -q .; then
            docker logs hs1 2>&1 | sed 's/^/  /'
        else
            echo "  Synapse container not found or no logs"
        fi

        echo ""
        echo "=========================================="
    fi

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
            log_info "To stop containers manually, run: docker compose -f $DOCKER_COMPOSE_FILE --profile element-$PROFILE_PREFIX down -v"
        else
            log_info "To stop containers manually, run: docker compose -f $DOCKER_COMPOSE_FILE --profile test-$PROFILE_PREFIX down -v"
        fi
    else
        log_info "Cleaning up services..."
        if [ -f "$DOCKER_COMPOSE_FILE" ]; then
            if [ "$INCLUDE_ELEMENT" = true ]; then
                docker compose -f "$DOCKER_COMPOSE_FILE" --profile "element-$PROFILE_PREFIX" down -v 2>/dev/null || true
            else
                docker compose -f "$DOCKER_COMPOSE_FILE" --profile "test-$PROFILE_PREFIX" down -v 2>/dev/null || true
            fi
        fi
        log_success "Cleanup completed"
    fi

    # Remove temporary build directory if it exists
    if [ -n "${BUILD_DIR:-}" ] && [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR" || true
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

# Build Rocket.Chat locally if not using pre-built image
if [ "$USE_PREBUILT_IMAGE" = false ]; then
    log_info "🚀 Building Rocket.Chat locally..."
    log_info "====================================="

    # Clean up any existing build
    log_info "Cleaning up previous build..."
    rm -rf "$BUILD_DIR"

    # Build the project
    log_info "Building packages from project root..."
    cd "$ROCKETCHAT_ROOT"
    yarn build

    # Build the Meteor bundle (must be run from the meteor directory)
    log_info "Building Meteor bundle..."
    cd "$ROCKETCHAT_ROOT/apps/meteor"
    METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --server-only --directory "$BUILD_DIR"

    log_success "Build completed!"
else
    log_info "🚀 Using pre-built image: $PREBUILT_IMAGE"
    log_info "====================================="
fi

log_info "🚀 Starting Federation Integration Tests"
log_info "====================================="

# Set environment variables for Docker Compose
if [ "$USE_PREBUILT_IMAGE" = true ]; then
    export ROCKETCHAT_IMAGE="$PREBUILT_IMAGE"
    PROFILE_PREFIX="prebuilt"
    log_info "Using pre-built image: $PREBUILT_IMAGE"
else
    export ROCKETCHAT_BUILD_CONTEXT="$BUILD_DIR"
    export ROCKETCHAT_DOCKERFILE="$ROCKETCHAT_ROOT/apps/meteor/.docker/Dockerfile.alpine"
    PROFILE_PREFIX="local"
    log_info "Building from local context: $BUILD_DIR"
fi

# Start services
if [ "$INCLUDE_ELEMENT" = true ]; then
    PROFILE="element-$PROFILE_PREFIX"
    log_info "Starting all federation services including Element web client..."
    docker compose -f "$DOCKER_COMPOSE_FILE" --profile "$PROFILE" up -d --build
else
    PROFILE="test-$PROFILE_PREFIX"
    log_info "Starting federation services (test profile only)..."
    docker compose -f "$DOCKER_COMPOSE_FILE" --profile "$PROFILE" up -d --build
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
    local host=$3
    local elapsed=0
    local ca_cert="${CA_CERT:-$PACKAGE_ROOT/docker-compose/traefik/certs/ca/rootCA.crt}"

    # Derive host/port from URL when not explicitly provided
    local host_with_port="${url#*://}"
    host_with_port="${host_with_port%%/*}"
    if [ -z "$host" ]; then
        host="${host_with_port%%:*}"
    fi
    local port
    if [[ "$host_with_port" == *:* ]]; then
        port="${host_with_port##*:}"
    else
        if [[ "$url" == https://* ]]; then
            port=443
        else
            port=80
        fi
    fi

    log_info "Checking $name at $url (host $host -> 127.0.0.1:$port)..."

    while [ $elapsed -lt $MAX_WAIT_TIME ] && [ "$INTERRUPTED" = false ]; do
        # Capture curl output and error for debugging
        curl_output=$(curl -fsS --cacert "$ca_cert" --resolve "${host}:${port}:127.0.0.1" "$url" 2>&1)
        curl_exit_code=$?

        if [ $curl_exit_code -eq 0 ]; then
            log_success "$name is ready!"
            return 0
        fi

        log_info "$name not ready yet, waiting... (${elapsed}s/${MAX_WAIT_TIME}s)"
        log_info "Curl error: $curl_output"
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
if ! wait_for_service "https://rc1/api/info" "Rocket.Chat" "rc1"; then
    log_error "Last 50 lines of rc1 logs:"
    docker logs --tail 50 "$RC1_CONTAINER" 2>&1 | sed 's/^/  /'
    exit 1
fi

# Wait for Synapse
if ! wait_for_service "https://hs1/_matrix/client/versions" "Synapse" "hs1"; then
    log_error "Last 50 lines of hs1 logs:"
    docker logs --tail 50 "hs1" 2>&1 | sed 's/^/  /'
    exit 1
fi

# Run the end-to-end tests
if [ "$NO_TEST" = false ]; then
    log_info "Running end-to-end tests..."
    cd "$PACKAGE_ROOT"

    IS_EE=true NODE_EXTRA_CA_CERTS=$(pwd)/docker-compose/traefik/certs/ca/rootCA.crt yarn test:federation
    TEST_EXIT_CODE=$?
else
    log_info "No-test mode: skipping test execution"
    log_info "Services are ready and running. You can now:"
    log_info "  - Access Rocket.Chat at: https://rc1"
    log_info "  - Access Synapse at: https://hs1"
    log_info "  - Access MongoDB at: localhost:27017"
    if [ "$INCLUDE_ELEMENT" = true ]; then
        log_info "  - Access Element at: https://element"
    fi
    log_info ""
    log_info "To run tests manually, execute: yarn testend-to-end"
    log_info "To stop containers, use: docker compose -f $DOCKER_COMPOSE_FILE down"
    TEST_EXIT_CODE=0
fi
