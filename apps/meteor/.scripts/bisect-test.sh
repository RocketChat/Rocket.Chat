#!/bin/bash

# Git Bisect Test Runner - Shell Wrapper
# Usage: ./bisect-test.sh "test:e2e --grep 'test name'"

set -e

# Check if test command is provided
if [ $# -eq 0 ]; then
    echo "Error: No test command provided"
    echo "Usage: $0 \"test:e2e --grep 'test name'\""
    echo "Example: $0 \"test:e2e --grep 'login test'\""
    exit 125  # Skip this commit
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the meteor app directory
cd "$SCRIPT_DIR/.."

# Run the TypeScript bisect test runner
TS_NODE_COMPILER_OPTIONS='{"module": "commonjs"}' npx ts-node "$SCRIPT_DIR/bisect-playwright-test.ts" "$1" 