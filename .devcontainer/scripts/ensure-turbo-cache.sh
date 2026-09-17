#!/usr/bin/env bash
#
# Runs on the HOST from initialize.sh (devcontainer.json's initializeCommand),
# before the container is created.
#
# Brings up the shared Turborepo remote cache (../turbo-cache/docker-compose.yml)
# if it is not already running. Must happen before container create for two
# reasons: the devcontainer attaches to the `turbo-cache` network as *external*,
# so compose refuses to create the container while that network is missing; and
# `updateContentCommand` (yarn install && yarn build) is the first thing that
# wants the cache.
#
# Idempotent by design — this runs on every devcontainer create/rebuild in every
# worktree, and all but the first find the stack already up.
set -euo pipefail

compose_file="$(cd "$(dirname "${BASH_SOURCE[0]}")/../turbo-cache" && pwd)/docker-compose.yml"

log() { printf '\033[1;34m[turbo-cache]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[turbo-cache] WARNING:\033[0m %s\n' "$1" >&2; }

if ! docker info >/dev/null 2>&1; then
	# Not fatal: without the cache turbo just builds everything locally. Failing
	# here would block the container from being created at all.
	warn "docker is not available — skipping; builds will run without a remote cache"
	exit 0
fi

# `up -d` alone would be enough, but it also re-pulls/recreates on config drift
# and prints noise on every single container start. Check first.
if [ "$(docker inspect -f '{{.State.Running}}' turbo-cache 2>/dev/null || true)" = "true" ]; then
	log "already running at http://turbo-cache:3000 (host: http://127.0.0.1:3399)"
	exit 0
fi

log "starting shared remote cache..."
if ! docker compose -f "$compose_file" up -d --wait; then
	warn "failed to start — continuing without a remote cache"
	exit 0
fi
log "ready at http://turbo-cache:3000 (host: http://127.0.0.1:3399)"
