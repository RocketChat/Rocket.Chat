#!/usr/bin/env bash
#
# Runs on the HOST from scripts/playwright/initialize.sh, before the container is
# created.
#
# Creates the named volume that holds Playwright's browser downloads. One
# subdirectory, mounted at its canonical path in the container by the compose
# fragment in initialize.sh:
#
#   ms-playwright/ -> /home/vscode/.cache/ms-playwright
#
# Canonical path on purpose, like the yarn/gh/claude volumes: PLAYWRIGHT_BROWSERS_PATH
# defaults to ~/.cache/ms-playwright on Linux, so nothing needs pointing anywhere
# and `playwright install` writes straight into the shared volume.
#
# Same external/fixed-name shape and the same reasons as ensure-yarn-cache.sh, so
# read that one for the long version. In short: every worktree is its own compose
# project, so an ordinary volume (or a devcontainer.json `mounts` entry, which
# becomes one) is namespaced per worktree and each copy starts empty — meaning
# every worktree, and every rebuild, re-downloads ~500MB of browser builds.
# External also puts it out of reach of `docker compose down -v`.
#
# Sharing it across worktrees is safe even when they pin different Playwright
# versions: the layout is one directory per build (chromium-1169/,
# chromium_headless_shell-1169/, ...), so versions coexist instead of overwriting
# each other. It is pure cache — `docker volume rm rc-devcontainer-playwright-browsers`
# costs one re-download, nothing more.
#
# Idempotent: this runs on every create/rebuild in every worktree, and all but
# the first return at the check below.
set -euo pipefail

volume="rc-devcontainer-playwright-browsers"
# remoteUser vscode, matching the host user so bind-mounted files stay writable.
# Compose has no chown, so a throwaway busybox does it — same trick as the yarn
# cache volume. It also creates the subpath directory, which has to exist in the
# volume before the container starts: a subpath mount fails on a missing path
# ("cannot access path ...: no such file or directory") and Docker will not
# create it.
uid=1000

log() { printf '\033[1;34m[playwright-browsers]\033[0m %s\n' "$1"; }

if docker volume inspect "$volume" >/dev/null 2>&1; then
	exit 0
fi

docker volume create "$volume" >/dev/null
docker run --rm -v "$volume":/v busybox:1.37 \
	sh -c "mkdir -p /v/ms-playwright && chown -R $uid:$uid /v"

log "created shared volume $volume — the first \`playwright install\` fills it, later ones in any worktree reuse it"
