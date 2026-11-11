#!/bin/bash
set -e

# Script to run Playwright visual regression tests in Docker.
# Storybook should be running on the host system at port 6006.
#
# Environment variables (set by bin/index.js):
#   PACKAGE_DIR  - absolute path to the consuming package (e.g. /repo/packages/fuselage)

PACKAGE_DIR="${PACKAGE_DIR:-$(pwd)}"

# Derive monorepo root from git
MONOREPO_ROOT="$(git -C "${PACKAGE_DIR}" rev-parse --show-toplevel)"

# Relative path of consuming package inside the monorepo (e.g. packages/fuselage)
REL_PACKAGE_PATH="$(node -e 'console.log(require("path").relative(process.argv[1], process.argv[2]))' "${MONOREPO_ROOT}" "${PACKAGE_DIR}")"

TOOL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REL_TOOL_PATH="$(node -e 'console.log(require("path").relative(process.argv[1], process.argv[2]))' "${MONOREPO_ROOT}" "${TOOL_DIR}")"

BASE_URL="http://host.docker.internal:6006"

# Check if update-snapshots flag is passed
UPDATE_SNAPSHOTS=""
case "$*" in
  *--update-snapshots*) UPDATE_SNAPSHOTS="--update-snapshots" ;;
esac

# Read the Playwright version from this tool's package.json.
PLAYWRIGHT_VERSION="$(node -e 'console.log(require(process.argv[1]).dependencies["@playwright/test"].replace(/^[^0-9]*/, ""))' "${TOOL_DIR}/package.json")"

DOCKER_PW_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

echo "Running Playwright tests in Docker container for ${REL_PACKAGE_PATH} with env:"
echo "PACKAGE_DIR: ${PACKAGE_DIR}"
echo "MONOREPO_ROOT: ${MONOREPO_ROOT}"
echo "REL_PACKAGE_PATH: ${REL_PACKAGE_PATH}"
echo "TEST_BASE_URL: ${BASE_URL}"
echo "CI: ${CI:-false}"
echo "UPDATE_SNAPSHOTS: ${UPDATE_SNAPSHOTS}"
echo "DOCKER_PW_IMAGE: ${DOCKER_PW_IMAGE}"

# Text anti-aliasing differs between architectures, so snapshots are always rendered by the arm64 image.
docker run --rm \
  --platform linux/arm64 \
  --init \
  --ipc=host \
  --add-host=host.docker.internal:host-gateway \
  -e TEST_BASE_URL="${BASE_URL}" \
  -e CI \
  -e PACKAGE_DIR="/app/${REL_PACKAGE_PATH}" \
  -v "${MONOREPO_ROOT}:/app" \
  -w "/app/${REL_PACKAGE_PATH}" \
  "${DOCKER_PW_IMAGE}" \
  npx -y playwright@${PLAYWRIGHT_VERSION} test --config="/app/${REL_TOOL_PATH}/playwright.config.ts" ${UPDATE_SNAPSHOTS}

echo "Playwright tests completed!"
