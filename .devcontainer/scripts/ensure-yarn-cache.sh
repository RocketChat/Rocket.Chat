#!/usr/bin/env bash
#
# Runs on the HOST from initialize.sh (devcontainer.json's initializeCommand),
# before the container is created.
#
# Creates the named volume that holds Yarn's global folder — the package cache
# (the zips it downloads from the registry) and its metadata index. One
# subdirectory, mounted at its canonical path in the container by
# docker-compose.yml:
#
#   berry/ -> /home/vscode/.yarn/berry
#
# Canonical path on purpose, like the gh/claude volumes: `globalFolder` defaults
# to ~/.yarn/berry, so nothing needs pointing anywhere (verify with
# `yarn config get globalFolder`). The one thing that *is* configured is
# YARN_ENABLE_GLOBAL_CACHE=true in devcontainer.json, which moves the cache off
# the project and into this volume — see there for why.
#
# Same external/fixed-name shape and the same reasons as ensure-gh-auth.sh and
# ensure-claude-config.sh, so read those for the long version. In short: every
# worktree is its own compose project, so an ordinary volume (or a
# devcontainer.json `mounts` entry, which becomes one) is namespaced per worktree
# and each copy starts empty — meaning every worktree re-downloads the same
# ~650MB of packages. External also puts it out of reach of
# `docker compose down -v`.
#
# Unlike the auth volumes there is nothing secret in here, so no 0700: yarn
# writes the cache as the running user and the default 0755 is correct.
#
# Idempotent: this runs on every create/rebuild in every worktree, and all but
# the first return at the check below.
set -euo pipefail

volume="rc-devcontainer-yarn-cache"
# remoteUser vscode, matching the host user so bind-mounted files stay writable.
# Compose has no chown, so a throwaway busybox does it — same trick as the
# turbo-cache stack's init service. It also creates the subpath directory, which
# has to exist in the volume before the container starts: a subpath mount fails
# on a missing path ("cannot access path ...: no such file or directory") and
# Docker will not create it.
uid=1000

log() { printf '\033[1;34m[yarn-cache]\033[0m %s\n' "$1"; }

if docker volume inspect "$volume" >/dev/null 2>&1; then
	exit 0
fi

docker volume create "$volume" >/dev/null
docker run --rm -v "$volume":/v busybox:1.37 \
	sh -c "mkdir -p /v/berry && chown -R $uid:$uid /v"

log "created shared volume $volume — the first \`yarn install\` fills it, later ones in any worktree reuse it"
