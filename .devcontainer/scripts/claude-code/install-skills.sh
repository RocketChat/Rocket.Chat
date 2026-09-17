#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from devcontainer.json's postStartCommand, on every
# start.
#
# Installs the skills that stage-skills.sh copied into
# .devcontainer/.host-skills/ (carried in by the workspace bind mount) into the
# container's Claude Code config directory. Honours $CLAUDE_CONFIG_DIR and falls
# back to ~/.claude, matching the CLI's own resolution.
#
# Copied rather than symlinked so the skills keep working if the workspace mount
# ever moves, and so editing one in here can't write back to the host checkout.
# The staging directory is deleted once the copy lands — it is inside the host
# checkout (bind mount), and leaving a duplicate of every skill sitting in the
# repo is noise for anything that walks the tree.
#
# Runs on every start, not just onCreate, so editing a skill on the host only
# needs a container restart.
set -euo pipefail

staged="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/.host-skills"
config_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
dest="$config_dir/skills"
# What the previous run installed. Used to prune skills that have since been
# removed on the host, without touching skills written directly in the
# container — those were never in here.
manifest="$config_dir/.host-skills.manifest"

log() { printf '\033[1;34m[install-skills]\033[0m %s\n' "$1"; }

if [ ! -d "$staged" ]; then
	# initializeCommand always writes this (empty at worst) and this script
	# removes it again at the end, so its absence means the host half did not run
	# for this start — e.g. the container was brought up with plain
	# `docker compose up`. Leave whatever is installed alone.
	#
	# An *empty* staging directory is a different signal: the host deliberately
	# contributed nothing (no skills, or the sync is opted out), and the prune
	# below removes what an earlier run installed.
	log "nothing staged at $staged — skipping"
	exit 0
fi

mkdir -p "$dest"

if [ -f "$manifest" ]; then
	while IFS= read -r name; do
		[ -n "$name" ] || continue
		[ -d "$staged/$name" ] && continue
		[ -d "$dest/$name" ] || continue
		log "removing '$name' — no longer on the host"
		rm -rf "$dest/$name"
	done <"$manifest"
fi

count=0
: >"$manifest"
shopt -s nullglob
for entry in "$staged"/*; do
	[ -d "$entry" ] || continue
	name="$(basename "$entry")"
	# Replace rather than merge, so a file deleted from a skill on the host does
	# not survive in the container copy.
	rm -rf "$dest/$name"
	cp -R "$entry" "$dest/$name"
	printf '%s\n' "$name" >>"$manifest"
	count=$((count + 1))
done
shopt -u nullglob

# Hand the host checkout back clean. Safe to remove: initializeCommand rebuilds
# it from scratch on the next create/start, and the manifest above — which lives
# in the config volume, not here — is what carries state between runs.
rm -rf "$staged"

log "installed $count skill(s) into $dest"
