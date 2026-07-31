#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from devcontainer.json's onCreateCommand, once per
# container create/rebuild.
#
# This is onCreate rather than postCreate because updateContentCommand runs
# *between* the two, and it needs the volumes below to already be writable.
set -euo pipefail

log() { printf '\033[1;34m[on-create]\033[0m %s\n' "$1"; }

# The three shared volumes (docker-compose.yml) arrive already owned by uid 1000
# — ensure-gh-auth.sh and ensure-claude-config.sh set that up on the host,
# because the subpath directories have to exist before the container starts
# anyway. This is the belt-and-braces pass for a volume seeded some other way
# (restored, copied in by hand): all three hold secrets, and ssh outright
# refuses a private key whose permissions are too open. Cheap — small files.
#
# Deliberately targeted rather than all of /home/vscode: a recursive chown there
# would walk into the .config/nvim bind mount and rewrite ownership of the
# host's files. Note that Docker creates any *missing parent* of a mount target
# as root before the container runs, so if you nest a volume under a path that
# is not in the base image (~/.local/share for the optional nvim volume), its
# parents need claiming here too.
log "claiming ~/.claude, ~/.config/gh and ~/.ssh"
sudo chown -R vscode:vscode /home/vscode/.claude /home/vscode/.config/gh /home/vscode/.ssh
sudo chmod 700 /home/vscode/.claude /home/vscode/.config/gh /home/vscode/.ssh

# ~/.yarn is exactly the "missing parent" case in the note above: nothing in the
# base image creates it, so Docker makes it as root before mounting the shared
# yarn cache at ~/.yarn/berry. yarn writes install-state and its own files
# alongside berry/, so the parent has to be ours too. Not recursive — the volume
# itself arrives owned by uid 1000 (ensure-yarn-cache.sh) and holds a warm cache
# of tens of thousands of files.
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
	/workspaces/rocket.chat/node_modules \
	/workspaces/rocket.chat/apps/meteor/.meteor/local

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
