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
NO_TEST=false
CI=false
LOGS=false
START_CONTAINERS=true
USE_LOCAL_RC=false
START_LOCAL_RC=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --start-containers-only)
            NO_TEST=true
            KEEP_RUNNING=true
            shift
            ;;
        --ci)
            CI=true
            KEEP_RUNNING=true
            START_CONTAINERS=false
            shift
            ;;
        --logs)
            LOGS=true
            NO_TEST=true
            START_CONTAINERS=false
            shift
            ;;
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
        --use-local-rc)
            USE_LOCAL_RC=true
            shift
            ;;
        --start-rc-only)
            START_LOCAL_RC=true
            START_CONTAINERS=false
            NO_TEST=true
            shift
            ;;
        --test-only)
            START_CONTAINERS=false
            KEEP_RUNNING=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --start-containers-only   Start containers and skip running tests"
            echo "  --ci                      Run tests in CI mode (keep containers running, no cleanup)"
            echo "  --logs                    Show logs of Rocket.Chat (rc1 or rc1-host-proxy) and hs1"
            echo "  --keep-running            Keep Docker containers running after tests complete"
            echo "  --element                 Include Element web client in the test environment"
            echo "  --no-test                 Start containers and skip running tests"
            echo "  --image [IMAGE]           Use a pre-built Docker image instead of building locally"
            echo "  --use-local-rc            Run Synapse/Mongo/Traefik in Docker; expect Rocket.Chat on the host."
            echo "                            Skips Meteor build and rc1 container. Assumes Meteor is"
            echo "                            already running on RC_LOCAL_METEOR_PORT (default 3000)."
            echo "  --start-rc-only           Start Meteor dev server in the foreground (implies --use-local-rc)."
            echo "                            Skips container startup and tests. Use after --use-local-rc setup."
            echo "  --test-only               Only run tests (skip container startup). Assumes services"
            echo "                            are already running. Keeps containers running after tests."
            echo "  --help, -h                Show this help message"
            echo ""
            echo "By default, builds Rocket.Chat locally and runs compose profiles test + rc-docker"
            echo "Use --image to test against a pre-built image (e.g., --image rocketchat/rocket.chat:latest)"
            echo "If --image is provided without a value, defaults to rocketchat/rocket.chat:latest"
            echo "Use --element to run all services including Element web client (profiles element + rc-docker)"
            echo "Use --no-test to start containers and skip running tests"
            echo "Cannot combine --use-local-rc / --start-rc-only with --image (no rc1 container is started)."
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ "$INCLUDE_ELEMENT" = true ]; then
    COMPOSE_BASE_PROFILE="element"
else
    COMPOSE_BASE_PROFILE="test"
fi

if [ "$USE_LOCAL_RC" = true ]; then
    COMPOSE_RC_PROFILE="rc-local"
    RC_LOG_SERVICE="rc1-host-proxy"
else
    COMPOSE_RC_PROFILE="rc-docker"
    RC_LOG_SERVICE="rc1"
fi

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

# --start-rc-only implies --use-local-rc
if [ "$START_LOCAL_RC" = true ]; then
    USE_LOCAL_RC=true
fi

if [ "$USE_LOCAL_RC" = true ] && [ "$USE_PREBUILT_IMAGE" = true ]; then
    log_error "--use-local-rc / --start-rc-only cannot be used with --image (Rocket.Chat runs on the host, not in Docker)."
    exit 1
fi

# docker compose with stack profiles (test|element) + (rc-docker|rc-local)
compose() {
    docker compose -f "$DOCKER_COMPOSE_FILE" --profile "$COMPOSE_BASE_PROFILE" --profile "$COMPOSE_RC_PROFILE" "$@"
}

docker_logs() {
    echo ""
    if [ "$USE_LOCAL_RC" = true ]; then
        echo "ROCKET.CHAT runs on the host; ${RC_LOG_SERVICE} (bridge) LOGS:"
    else
        echo "ROCKET.CHAT (${RC_LOG_SERVICE}) LOGS:"
    fi
    echo "----------------------------------------"
    compose logs "$RC_LOG_SERVICE"

    echo ""
    echo "SYNAPSE (hs1) LOGS:"
    echo "----------------------------------------"
    compose logs hs1

    echo ""
    echo "=========================================="
}

# Restore .yarnrc.yml after supportedArchitectures + yarn install (local bundle build only).
restore_yarnrc_cross_platform_backup() {
    if [ -f "$ROCKETCHAT_ROOT/.yarnrc.yml.bak" ]; then
        log_info "Restoring original yarn configuration..."
        mv "$ROCKETCHAT_ROOT/.yarnrc.yml.bak" "$ROCKETCHAT_ROOT/.yarnrc.yml"
    fi
}

# Cleanup function
cleanup() {
    restore_yarnrc_cross_platform_backup || true

    if [ "$CI" = true ]; then
        # Exit with the test result code
        if [ -n "${TEST_EXIT_CODE:-}" ]; then
            exit $TEST_EXIT_CODE
        fi
    fi

    # Show container logs if tests failed
    if [ -n "${TEST_EXIT_CODE:-}" ] && [ "$TEST_EXIT_CODE" -ne 0 ]; then
        echo ""
        echo "=========================================="
        echo "CONTAINER LOGS (Test Failed)"
        echo "=========================================="

        docker_logs
    fi

    if [ "$KEEP_RUNNING" = true ]; then
        log_info "Keeping Docker containers running"
        if [ "$START_CONTAINERS" = true ]; then
            log_info "Services are available at:"
            log_info "  - Rocket.Chat: https://rc1"
            log_info "  - Synapse: https://hs1"
            log_info "  - MongoDB: localhost:27017"
            if [ "$INCLUDE_ELEMENT" = true ]; then
                log_info "  - Element: https://element"
            fi
            log_info "To stop containers manually, run: docker compose -f \"$DOCKER_COMPOSE_FILE\" --profile \"$COMPOSE_BASE_PROFILE\" --profile \"$COMPOSE_RC_PROFILE\" down -v"
        fi
    else
        log_info "Cleaning up services..."

        compose down -v 2>/dev/null || true

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

if [ "$START_CONTAINERS" = true ]; then
    # Build Rocket.Chat locally if not using pre-built image and not using host Meteor
    if [ "$USE_LOCAL_RC" = false ]; then
        if [ "$USE_PREBUILT_IMAGE" = false ]; then
            log_info "🚀 Building Rocket.Chat locally..."
            log_info "====================================="

            # Clean up any existing build
            log_info "Cleaning up previous build..."
            rm -rf "$BUILD_DIR"

            # Configure yarn for cross-platform builds (needed for sharp and other native modules)
            # This adds support for linux and darwin (macOS) on arm64/x64 with glibc and musl
            log_info "Configuring yarn for cross-platform builds..."
            cd "$ROCKETCHAT_ROOT"
            cp .yarnrc.yml .yarnrc.yml.bak
            yarn config set supportedArchitectures --json '{"os": ["linux", "darwin"], "cpu": ["arm64", "x64"], "libc": ["glibc", "musl"]}'
            yarn install

            # Build the project
            log_info "Building packages from project root..."
            yarn build

            # Build the Meteor bundle (must be run from the meteor directory)
            log_info "Building Meteor bundle..."
            cd "$ROCKETCHAT_ROOT/apps/meteor"
            METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --server-only --directory "$BUILD_DIR"

            # Restore .yarnrc.yml after build completes
            restore_yarnrc_cross_platform_backup

            log_success "Build completed!"
        else
            log_info "🚀 Using pre-built image: $PREBUILT_IMAGE"
            log_info "====================================="
        fi
    else
        log_info "Skipping Meteor build and rc1 Docker image (--use-local-rc)."
        log_info "Add to /etc/hosts if needed: 127.0.0.1 rc1 hs1"
        log_info "Expecting Meteor already running on port ${RC_LOCAL_METEOR_PORT:-3000} (or pass --start-rc-only)."
    fi

    log_info "🚀 Starting Federation Integration Tests"
    log_info "====================================="

    BUILD_PARAM=""

    # Set environment variables for Docker Compose
    if [ "$USE_LOCAL_RC" = true ]; then
        unset ROCKETCHAT_BUILD_CONTEXT ROCKETCHAT_DOCKERFILE 2>/dev/null || true
        log_info "Compose profiles: ${COMPOSE_BASE_PROFILE} + ${COMPOSE_RC_PROFILE} (Rocket.Chat on host port \${RC_LOCAL_METEOR_PORT:-3000})"
    elif [ "$USE_PREBUILT_IMAGE" = true ]; then
        export ROCKETCHAT_IMAGE="$PREBUILT_IMAGE"
        log_info "Using pre-built image: $PREBUILT_IMAGE"
    else
        export ROCKETCHAT_BUILD_CONTEXT="$BUILD_DIR"
        export ROCKETCHAT_DOCKERFILE="$ROCKETCHAT_ROOT/apps/meteor/.docker/Dockerfile.alpine"
        BUILD_PARAM="--build"
        log_info "Building from local context: $BUILD_DIR"
    fi

    # Start services
    if [ "$INCLUDE_ELEMENT" = true ]; then
        log_info "Starting all federation services including Element web client..."
    else
        log_info "Starting federation services (${COMPOSE_BASE_PROFILE} + ${COMPOSE_RC_PROFILE})..."
    fi

    compose up -d $BUILD_PARAM

    # Wait for Rocket.Chat backend container (Docker RC only)
    if [ "$USE_LOCAL_RC" = false ]; then
        log_info "Waiting for rc1 container to start..."
        timeout=60
        while [ $timeout -gt 0 ] && [ "$INTERRUPTED" = false ]; do
            if compose ps rc1 --filter "status=running" | grep -q "rc1"; then
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
    else
        METEOR_PORT="${RC_LOCAL_METEOR_PORT:-3000}"
        log_info "Expecting Meteor to be running on port ${METEOR_PORT} (use --start-rc-only to auto-start it)."
        log_info "Waiting on https://rc1/api/info (via Traefik -> socat -> host:${METEOR_PORT})..."
    fi

fi

# When --start-rc-only is used (containers already running from setup-local-stack),
# start Meteor in the foreground so it stays alive and the user can Ctrl+C to stop it.
if [ "$START_LOCAL_RC" = true ] && [ "$START_CONTAINERS" = false ]; then
    METEOR_PORT="${RC_LOCAL_METEOR_PORT:-3000}"
    if curl -fsS "http://127.0.0.1:${METEOR_PORT}/api/info" >/dev/null 2>&1; then
        log_success "Meteor already running on port ${METEOR_PORT}."
        exit 0
    fi
    log_info "Starting Meteor dev server on port ${METEOR_PORT}..."
    exec "$SCRIPT_DIR/start-meteor-for-federation-tests.sh"
fi

# ---------------------------------------------------------------------------
# Health-check and test-runner functions
# ---------------------------------------------------------------------------

wait_for_service() {
    local url=$1
    local name=$2
    local host=$3
    local elapsed=0
    local ca_cert="${CA_CERT:-$PACKAGE_ROOT/docker-compose/traefik/certs/ca/rootCA.crt}"

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

wait_for_services() {
    log_info "Waiting for Rocket.Chat and Synapse servers to be ready..."

    if ! wait_for_service "https://rc1/api/info" "Rocket.Chat" "rc1"; then
        log_error "Rocket.Chat did not become healthy in time."
        return 1
    fi

    if ! wait_for_service "https://hs1/_matrix/client/versions" "Synapse" "hs1"; then
        log_error "Synapse did not become healthy in time."
        return 1
    fi
}

run_tests() {
    wait_for_services || exit 1

    log_info "Running end-to-end tests..."
    cd "$PACKAGE_ROOT"

    set +e
    IS_EE=true NODE_EXTRA_CA_CERTS=$(pwd)/docker-compose/traefik/certs/ca/rootCA.crt yarn test:federation
    TEST_EXIT_CODE=$?
    set -e
}

# ---------------------------------------------------------------------------
# Main dispatch
# ---------------------------------------------------------------------------

if [ "$NO_TEST" = false ]; then
    run_tests
elif [ "$LOGS" = true ]; then
    docker_logs
    exit 0
else
    log_info "No-test mode: skipping test execution"
    log_info "Services are starting. Use --test-only to run tests later."
    log_info "  - Rocket.Chat: https://rc1"
    log_info "  - Synapse: https://hs1"
    log_info "  - MongoDB: localhost:27017"
    if [ "$INCLUDE_ELEMENT" = true ]; then
        log_info "  - Element: https://element"
    fi
    log_info ""
    log_info "To run tests: yarn test:federation:run-tests-only"
    log_info "To stop containers: docker compose -f $DOCKER_COMPOSE_FILE --profile $COMPOSE_BASE_PROFILE --profile $COMPOSE_RC_PROFILE down -v"
    TEST_EXIT_CODE=0
fi
