#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from devcontainer.json's onCreateCommand, once per
# container create/rebuild.
#
# This is onCreate rather than postCreate because updateContentCommand runs
# *between* the two, and it needs the volumes below to already be writable.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Derived, not hardcoded: the workspace path carries the checkout's directory
# name (see devcontainer.json), so it differs per worktree.
root="$(cd "$here/../.." && pwd)"

source "$here/lib/features.sh"

log() { printf '\033[1;34m[on-create]\033[0m %s\n' "$1"; }

# A note that applies to every claim below, and to the per-feature ones in
# scripts/<name>/on-create.sh: named volumes mount as root:root, so whatever runs
# as `vscode` and writes under them gets EACCES until they are claimed.
#
# Keep them targeted rather than chowning all of /home/vscode: a recursive chown
# there would walk into the .config/nvim bind mount and rewrite ownership of the
# host's files. Note also that Docker creates any *missing parent* of a mount
# target as root before the container runs, so if you nest a volume under a path
# that is not in the base image (~/.local/share for the optional nvim volume), its
# parents need claiming here too.
#
# ~/.yarn is exactly that missing-parent case: nothing in the base image creates
# it, so Docker makes it as root before mounting the shared yarn cache at
# ~/.yarn/berry. yarn writes install-state and its own files alongside berry/, so
# the parent has to be ours too. Not recursive — the volume
# itself arrives owned by the right uid (ensure-yarn-cache.sh) and holds a warm
# cache of tens of thousands of files.
log "claiming ~/.yarn"
sudo chown vscode:vscode /home/vscode/.yarn /home/vscode/.yarn/berry

# The rc-node-modules and rc-meteor-local volumes are the same story: the
# image has nothing at those paths to seed ownership from (the workspace only
# exists as a bind mount at runtime), so they land as root:root and
# yarn/meteor — running as vscode — get EACCES creating anything under them.
# These target the volumes, NOT the host repo: each named volume is mounted
# over the bind mount at its path, so the host's own node_modules and
# .meteor/local are shadowed and untouched.
# Not recursive: yarn and meteor create everything below as vscode, so only
# the mount points themselves need fixing, and a recursive walk of a
# populated node_modules would add minutes to every container create.
log "claiming build volume mount points"
sudo chown vscode:vscode \
	"$root/node_modules" \
	"$root/apps/meteor/.meteor/local"

# Your git author identity, read off the host by scripts/init-git-identity.sh and
# passed in as environment on the service. Written as real config rather than left
# in the environment so `git config user.email` answers, and so a repo-local
# identity set inside the container still wins — see that script for why.
#
# Safe to write unconditionally: the container's home is not a volume, so this
# runs against a fresh ~/.gitconfig on every create. Under VS Code that file may
# already be a copy of the host's (dev.containers.copyGitConfig), in which case
# this sets the same two keys to the same values.
if [ -n "${RC_GIT_USER_NAME:-}" ]; then
	log "setting git user.name to $RC_GIT_USER_NAME"
	git config --global user.name "$RC_GIT_USER_NAME"
fi
if [ -n "${RC_GIT_USER_EMAIL:-}" ]; then
	log "setting git user.email to $RC_GIT_USER_EMAIL"
	git config --global user.email "$RC_GIT_USER_EMAIL"
fi

# A safety belt for the worktree setup: the container can see the shared git
# dir but not the *other* worktrees' host paths, so from in here they all look
# like they "point to a non-existent location" and become prune candidates
# once past gc.worktreePruneExpire (default 3 months). A routine `git gc`
# inside the container would then unregister worktrees that are perfectly
# healthy on the host — verified: it really does list all of them as
# removable.
#
# This covers `git gc`/`gc --auto`, which pass this value through as --expire.
# It does NOT cover an explicit `git worktree prune`: that defaults to
# expiring everything and ignores the config. Don't run it in here.
log "disabling worktree pruning during gc"
git config --global gc.worktreePruneExpire never

# Per-feature create-time setup: scripts/<name>/on-create.sh for every feature
# devcontainer.json actually declares. Mostly claiming the mount points of the
# volumes those features contributed on the host side.
run_feature_hooks on-create.sh
