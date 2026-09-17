#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from scripts/on-create.sh, once per container
# create/rebuild, and only when devcontainer.json declares the playwright-deps
# feature (feature.id).
set -euo pipefail

log() { printf '\033[1;34m[on-create:playwright]\033[0m %s\n' "$1"; }

# Named volumes mount as root:root, so `playwright install` — running as vscode
# from updateContentCommand, which is the next hook after this one — gets EACCES
# without this. The shared volume itself already arrives owned by the right uid
# (ensure-playwright-browsers.sh, host side), so only the mount point needs it.
#
# ~/.cache is the missing-parent case described in scripts/on-create.sh: nothing
# in the base image guarantees it, so Docker creates it as root before mounting
# ms-playwright underneath — and a root-owned ~/.cache breaks every *other* tool
# that writes there too (yarn, turbo, deno). Non-recursive on purpose: whatever is
# already inside those caches was written by vscode, and a recursive walk of a warm
# browser cache is pointless work on every create.
log "claiming ~/.cache/ms-playwright"
sudo chown vscode:vscode /home/vscode/.cache /home/vscode/.cache/ms-playwright
