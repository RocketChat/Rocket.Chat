#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from scripts/on-create.sh, once per container
# create/rebuild, and only when devcontainer.json declares the github-cli
# feature (feature.id).
set -euo pipefail

log() { printf '\033[1;34m[on-create:gh]\033[0m %s\n' "$1"; }

# The shared gh-auth volume already arrives owned by the right uid —
# ensure-gh-auth.sh sets that up on the host, because the subpath directories
# have to exist before the container starts anyway. This is the belt-and-braces
# pass for a volume seeded some other way (restored, copied in by hand): both
# subpaths hold secrets, and ssh outright refuses a private key whose permissions
# are too open. Cheap — small files.
#
# Deliberately targeted rather than all of /home/vscode; see the note in
# scripts/on-create.sh for why, and for the missing-parent case.
log "claiming ~/.config/gh and ~/.ssh"
sudo chown -R vscode:vscode /home/vscode/.config/gh /home/vscode/.ssh
sudo chmod 700 /home/vscode/.config/gh /home/vscode/.ssh
