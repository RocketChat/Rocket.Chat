#!/usr/bin/env bash
#
# Runs on the HOST from initialize.sh (devcontainer.json's initializeCommand),
# before the container is created.
#
# Creates the named volume that holds Claude Code's config directory — auth
# (`.credentials.json`), settings, history, and the skills install-skills.sh
# copies in. One subdirectory, mounted at its canonical path in the container by
# docker-compose.yml:
#
#   claude/ -> /home/vscode/.claude
#
# Same shape and the same reasons as ensure-gh-auth.sh, so read that one for the
# long version. In short: *external* with a fixed name is what makes it shared —
# every worktree is its own compose project, so an ordinary volume (or a
# devcontainer.json `mounts` entry, which becomes one) is namespaced per worktree
# and each copy starts empty, meaning one `claude` login per checkout forever.
# External also puts it out of reach of `docker compose down -v`.
#
# The subpath buys the same thing it does for gh: the volume root stays a
# container for named entries rather than being ~/.claude itself, so a sibling
# can be added later without moving what is already stored here. It also has to
# exist before the container starts — a subpath mount fails on a missing path
# ("cannot access path ...: no such file or directory") and Docker will not
# create it — which is the second reason this can't wait for a container-side
# hook. The first is that compose refuses to create the container at all when an
# external volume is missing.
#
# Note this is deliberately NOT scoped per project the way the old
# `claude-code-config-${devcontainerId}` mount was: the point is that every
# worktree of this repo shares one login. Other repos get their own volume, since
# the name is fixed to this one.
#
# Idempotent: this runs on every create/rebuild in every worktree, and all but
# the first return at the check below.
set -euo pipefail

volume="rc-claude-config"
# remoteUser vscode, matching the host user so bind-mounted files stay writable.
# Compose has no chown, so a throwaway busybox does it — same trick as the
# turbo-cache stack's init service.
uid=1000

log() { printf '\033[1;34m[claude-config]\033[0m %s\n' "$1"; }

if docker volume inspect "$volume" >/dev/null 2>&1; then
	exit 0
fi

docker volume create "$volume" >/dev/null
# 0700: this holds the OAuth credentials Claude Code writes to
# ~/.claude/.credentials.json.
docker run --rm -v "$volume":/v busybox:1.37 \
	sh -c "mkdir -p /v/claude && chown -R $uid:$uid /v && chmod 700 /v/claude"

log "created shared volume $volume — run \`claude\` and sign in once, in any worktree"
