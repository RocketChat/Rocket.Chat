#!/bin/bash
set -e

# Define directories
ROOT_DIR=$(pwd)
DIST_DIR="/tmp/dist-fips"

echo "🚀 Starting FIPS Build & Run Script"

# Check if meteor is installed
if ! command -v meteor &> /dev/null; then
    echo "❌ Meteor is not installed or not in PATH."
    exit 1
fi

# Clean up previous build
echo "🧹 Cleaning up previous build at $DIST_DIR..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Build Meteor App
echo "🔨 Building Meteor App (Server Only)..."
cd apps/meteor
meteor build --server-only --directory "$DIST_DIR"
cd "$ROOT_DIR"

# Build Docker Image
echo "🐳 Building Docker Image (rocketchat:fips)..."
# Context is $DIST_DIR because it contains the 'bundle' folder
docker build -f apps/meteor/.docker/Dockerfile.fips -t rocketchat:fips "$DIST_DIR"

# Run Docker Compose
echo "▶️  Starting Rocket.Chat in Docker (FIPS mode)..."
docker compose -f docker-compose-fips.yml up -d --remove-orphans

echo "✅ Done! Rocket.Chat FIPS should be running at http://localhost:3000"
