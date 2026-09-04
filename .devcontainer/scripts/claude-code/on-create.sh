#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from scripts/on-create.sh, once per container
# create/rebuild, and only when devcontainer.json declares the claude-code
# feature (feature.id).
set -euo pipefail

log() { printf '\033[1;34m[on-create:claude-code]\033[0m %s\n' "$1"; }

# The shared claude-config volume already arrives owned by the right uid —
# ensure-claude-config.sh sets that up on the host, because the volume has to
# exist before the container starts anyway. This is the belt-and-braces
# pass for a volume seeded some other way (restored, copied in by hand); 0700
# because it holds the OAuth credentials in ~/.claude/.credentials.json.
#
# Deliberately targeted rather than all of /home/vscode; see the note in
# scripts/on-create.sh for why.
log "claiming ~/.claude"
sudo chown -R vscode:vscode /home/vscode/.claude
sudo chmod 700 /home/vscode/.claude
