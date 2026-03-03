#!/bin/bash
# e2e.sh - Run E2E tests locally (mimics CI environment)
#
# Usage: ./e2e.sh [--coverage] [--shards N] [--test PATH] [--grep PATTERN] [-- [playwright args...]]
#
# This script:
# 1. Builds the environment (optionally with coverage instrumentation)
# 2. Runs all test shards
# 3. Merges coverage data (if enabled)
# 4. Generates coverage reports (if enabled)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_cmd() { echo -e "${BLUE}[CMD]${NC} $1"; }

# Default configuration
ENABLE_COVERAGE=false
TOTAL_SHARDS=4
TARGETED_TESTS=()
PLAYWRIGHT_ARGS=()
HAS_TARGETED_FILTER=false

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --coverage)
      ENABLE_COVERAGE=true
      shift
      ;;
    --shards)
      TOTAL_SHARDS="$2"
      shift 2
      ;;
    --test)
      TARGETED_TESTS+=("$2")
      HAS_TARGETED_FILTER=true
      shift 2
      ;;
    --grep)
      PLAYWRIGHT_ARGS+=("-g" "$2")
      HAS_TARGETED_FILTER=true
      shift 2
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        PLAYWRIGHT_ARGS+=("$1")
        shift
      done
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --coverage    Enable code coverage collection and reporting"
      echo "  --shards N    Number of test shards to run (default: 4)"
      echo "  --test PATH   Run a specific Playwright test file (can be used multiple times)"
      echo "  --grep TEXT   Run tests matching a Playwright grep pattern"
      echo "  --            Pass remaining arguments directly to Playwright"
      echo "  --help        Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                    # Run tests without coverage"
      echo "  $0 --coverage         # Run tests with coverage"
      echo "  $0 --shards 2         # Run only 2 shards"
      echo "  $0 --test tests/e2e/prune-messages.spec.ts"
      echo "  $0 --grep \"pruning files only\""
      echo "  $0 --test tests/e2e/prune-messages.spec.ts -- --project chromium"
      exit 0
      ;;
    *)
      log_warn "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Configuration (matches CI)
export MONGO_URL="${MONGO_URL:-mongodb://localhost:27017/rocketchat?replicaSet=rs0&directConnection=true}"
export COVERAGE_DIR="${COVERAGE_DIR:-/tmp/coverage/ui}"
export IS_EE="${IS_EE:-false}"

# Targeted runs should be deterministic and not split unexpectedly across shards.
if [ "$HAS_TARGETED_FILTER" = true ] && [ "$TOTAL_SHARDS" -gt 1 ]; then
  log_warn "Targeted test options detected; forcing --shards 1 for predictable execution."
  TOTAL_SHARDS=1
fi


# Run each shard
for shard in $(seq 1 $TOTAL_SHARDS); do
  log_info "========================================"
  log_info "Running shard $shard/$TOTAL_SHARDS"
  log_info "========================================"

  # Reset between shards (fresh database)
  if [ $shard -gt 1 ]; then
    log_info "Resetting environment for shard $shard..."
    ./docker-vite-ci.sh reset
  fi

  # Run tests for this shard
  cd apps/meteor
  yarn prepare

  TEST_COMMAND=(yarn test:e2e)
  if [ ${#TARGETED_TESTS[@]} -gt 0 ]; then
    TEST_COMMAND+=("${TARGETED_TESTS[@]}")
  fi

  TEST_COMMAND+=("${PLAYWRIGHT_ARGS[@]}")

  if [ "$TOTAL_SHARDS" -gt 1 ]; then
    TEST_COMMAND+=(--shard "$shard/$TOTAL_SHARDS")
  fi

  log_cmd "${TEST_COMMAND[*]}"

  if [ "$ENABLE_COVERAGE" = true ]; then
    E2E_COVERAGE=true "${TEST_COMMAND[@]}" || {
      log_warn "Shard $shard failed, continuing with other shards..."
    }
  else
    "${TEST_COMMAND[@]}" || {
      log_warn "Shard $shard failed, continuing with other shards..."
    }
  fi
  cd ../..

  # Merge coverage for this shard (mimics CI workflow)
  if [ "$ENABLE_COVERAGE" = true ]; then
    if [ -d "apps/meteor/.nyc_output" ] && [ "$(ls -A apps/meteor/.nyc_output)" ]; then
      log_info "Merging coverage for shard $shard..."
      cd apps/meteor
      npx nyc merge .nyc_output "${COVERAGE_DIR}/ui-${shard}.json"
      cd ../..
    else
      log_warn "No coverage data found for shard $shard"
    fi
  fi
done

log_info "========================================"
log_info "All shards complete!"
log_info "========================================"

# Merge all shard coverage files into one
if [ "$ENABLE_COVERAGE" = true ] && [ -d "$COVERAGE_DIR" ] && [ "$(ls -A $COVERAGE_DIR/*.json 2>/dev/null)" ]; then
  log_info "Merging all shard coverage files..."
  cd apps/meteor

  # Create temporary directory for merged coverage
  rm -rf .nyc_output
  mkdir -p .nyc_output

  # Copy all shard files to .nyc_output
  cp "${COVERAGE_DIR}"/*.json .nyc_output/

  # Generate reports
  log_info "Generating coverage reports..."
  npx nyc report --reporter=html --reporter=text-summary --reporter=lcov

  log_info "========================================"
  log_info "Coverage Summary:"
  log_info "========================================"
  npx nyc report --reporter=text-summary

  log_info ""
  log_info "Coverage reports generated:"
  log_info "  HTML: apps/meteor/coverage/index.html"
  log_info "  LCOV: apps/meteor/coverage/lcov.info"
  log_info ""
  log_info "Open coverage report with: open apps/meteor/coverage/index.html"

  cd ../..
elif [ "$ENABLE_COVERAGE" = true ]; then
  log_warn "No coverage data found in any shard"
fi

log_info "========================================"
log_info "E2E test run complete!"
log_info "========================================"
