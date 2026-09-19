#!/bin/bash

# Git Bisect Test Runner - Shell Wrapper
# Usage: ./bisect-test.sh "test:e2e --grep 'test name'"

source $NVM_DIR/nvm.sh

EXIT_CODE_GOOD=0 # Test passed
EXIT_CODE_BAD=1 # Test failed
EXIT_CODE_SKIP=125 # Test skipped
EXIT_CODE_STOP=128 # Any other error happened, do not skip the commit

SERVER_URL="http://localhost:3000"

# trap "kill $(jobs -p)" EXIT
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

stopWithMessage() {
    echo "$@"
    echo "\n\nExiting..."
    exit $EXIT_CODE_STOP
}

# Simple function to write on the same line
overwrite() { echo -e "\r\033[1A\033[0K$@"; }

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT_DIR=""

# Check if the required commands are installed
#----------------------------------------------
MISSING_COMMANDS=()
for command in node nvm yarn; do
    if [ -z "$(command -v $command)" ]; then
        MISSING_COMMANDS+=("\n\t$command")
    fi
done

if [ ${#MISSING_COMMANDS[@]} -gt 0 ]; then
    stopWithMessage "Install the missing resources and try again: ${MISSING_COMMANDS[@]}"
fi
#----------------------------------------------

# We have to copy the script to the root directory, and run it from there
# To avoid losing it when changing commits
if [[ "$SCRIPT_DIR" == *"apps/meteor/.scripts"* ]]; then
    echo "You ran the original Bisect script. This script might disappear once git-bisect changes commits."
    echo "Copying to the repository's root directory..."

    # Copy this folder to the root directory
    cp "$SCRIPT_DIR/bisect-test.sh" "$SCRIPT_DIR/../../../../bisect-test.sh"

    stopWithMessage "Copied script to the root directory. Run \"git bisect run ./bisect-test.sh\" from the repository's root directory to start the bisect"
fi

REPO_ROOT_DIR="$SCRIPT_DIR"
TEST_FILE="$REPO_ROOT_DIR/apps/meteor/tests/e2e/bisect.spec.ts.example"
TEST_FILE_TO_COPY="$REPO_ROOT_DIR/apps/meteor/.scripts/bisect/bisect.spec.ts"

if [ ! -e "$TEST_FILE" ]; then
    echo "$TEST_FILE not found, copying $TEST_FILE_TO_COPY to $TEST_FILE"
    COPY_RESULT=$(cp "$TEST_FILE_TO_COPY" "$TEST_FILE")

    if [ $? -ne 0 ]; then
        stopWithMessage "Failed to copy $TEST_FILE_TO_COPY to $TEST_FILE\n$COPY_RESULT"
    fi
fi

INSTALLED_NODE_VERSION=$(node -v)
# I don't know how to grep :)
REQUIRED_NODE_VERSION=$(node -p -e "require('./package.json').engines.node")

echo "Installed Node version: $INSTALLED_NODE_VERSION"
echo "Required Node version: $REQUIRED_NODE_VERSION"

if [ "$INSTALLED_NODE_VERSION" != "$REQUIRED_NODE_VERSION" ]; then
    echo "Switching to Node $REQUIRED_NODE_VERSION with nvm..."
    nvm use $REQUIRED_NODE_VERSION
    if [ $? -ne 0 ]; then
        echo "Node $REQUIRED_NODE_VERSION is not installed. Installing..."
        nvm install $REQUIRED_NODE_VERSION

        if [ $? -ne 0 ]; then
            stopWithMessage "Failed to install Node $REQUIRED_NODE_VERSION"
        fi
    fi
fi

yarn install
echo "DONE DONE DONE"
echo ""
cd $REPO_ROOT_DIR/apps/meteor
yarn playwright install
TEST_MODE=true yarn dsv &

echo "Waiting for the server to be ready..."
echo "This might take a while..."
echo "Polling will start in 40 seconds..."
echo ""

sleep 40

STATUS_CODE=0
CURRENT_TRY=0
MAX_TRIES=60; # 5 min max
while [ $CURRENT_TRY -le $MAX_TRIES ]; do
    CURRENT_TRY=$((CURRENT_TRY + 1))
    result=$(curl -s --write-out "%{http_code}" $SERVER_URL)
    STATUS_CODE="${result: -3}"

    if [ $STATUS_CODE -eq 200 ]; then
        echo "Server is running after ($CURRENT_TRY/$MAX_TRIES) tries. Running playwright..."
        break
    fi
    overwrite "Server is not up yet. Next try in 5 seconds... ($CURRENT_TRY/$MAX_TRIES)"
    sleep 5
done

# Assuming the test is "test.only"
yarn test:e2e
PW_EXIT_CODE=$?

if [ $PW_EXIT_CODE -ne 0 ]; then
    echo "Playwright exited with non-zero code, marking commit as bad"
    exit $EXIT_CODE_BAD
fi

echo "Playwright exited with zero code, marking commit as good"
exit $EXIT_CODE_GOOD
