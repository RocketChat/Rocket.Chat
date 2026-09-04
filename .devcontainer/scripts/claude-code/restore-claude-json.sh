#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from scripts/claude-code/post-start.sh, on every start.
#
# Restores ~/.claude.json from the newest file in ~/.claude/backups when it is
# missing.
#
# Why it goes missing: the shared config volume is mounted at ~/.claude, but
# .claude.json is a sibling *file*, not inside that directory — so it lives in
# the container's writable layer and a rebuild takes it with it. What survives is
# the backups/ directory Claude Code writes inside ~/.claude before each rewrite
# of the file, which is exactly the copy we want back. Auth itself is in
# ~/.claude/.credentials.json and is never affected; what this saves is the rest
# — onboarding state, per-project history and trust, MCP server entries.
#
# Only ever restores a *missing* file: an existing ~/.claude.json is the live
# one, newer than any backup by definition, and Claude Code may already be
# running against it.
set -euo pipefail

# Matches the CLI's own resolution, as install-skills.sh does. Both the config
# file and backups/ move with $CLAUDE_CONFIG_DIR when it is set.
config_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
if [ -n "${CLAUDE_CONFIG_DIR:-}" ]; then
	config="$CLAUDE_CONFIG_DIR/.claude.json"
else
	config="$HOME/.claude.json"
fi
backups="$config_dir/backups"

log() { printf '\033[1;34m[restore-claude-json]\033[0m %s\n' "$1"; }

if [ -e "$config" ]; then
	exit 0
fi

if [ ! -d "$backups" ]; then
	log "no backups at $backups — starting with a fresh config"
	exit 0
fi

# Newest by mtime rather than by name: the filenames end in an epoch-ms stamp
# that happens to sort correctly today, but mtime is what "latest" actually
# means and it does not care about the naming scheme. -maxdepth 1 -type f keeps
# it to the backup files themselves.
latest="$(find "$backups" -maxdepth 1 -type f -name '.claude.json.backup.*' \
	-printf '%T@\t%p\n' | sort -rn | head -n 1 | cut -f2-)"

if [ -z "$latest" ]; then
	log "no backups in $backups — starting with a fresh config"
	exit 0
fi

cp "$latest" "$config"
# The backups are 0600 and this file holds the same thing they do; don't let it
# land wider because of the umask.
chmod 600 "$config"

log "restored $config from $(basename "$latest")"
