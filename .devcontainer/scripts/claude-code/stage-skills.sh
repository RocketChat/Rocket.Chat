#!/usr/bin/env bash
#
# Runs on the HOST from initialize.sh (devcontainer.json's initializeCommand),
# before the container is created or started.
#
# Copies your user-level Claude Code skills into .devcontainer/.host-skills/ so
# the workspace bind mount carries them into the container, where
# install-skills.sh puts them in place and then deletes the staging directory
# again. Two halves are needed because the container's ~/.claude is a named
# volume — nothing on the host is visible inside it.
#
# Why copy on the host instead of bind-mounting the skills directory and copying
# in the container: skills are commonly symlinks into a separate checkout (e.g.
# ~/.agents/skills/<name>), and those targets are not mounted into the
# container, so the links would resolve to nothing in there. `cp -RL` here
# dereferences them while the targets still exist.
#
# Source honours $CLAUDE_CONFIG_DIR, falling back to ~/.claude — the same
# resolution Claude Code itself uses.
#
# Idempotent: re-runs on every create/start and fully rebuilds the staging
# directory, so removing a skill on the host removes it in the container too.
#
# To opt out entirely, see the marker file / env var below.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
src="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"
out="$root/.devcontainer/.host-skills"
optout="$root/.devcontainer/.skip-skills"

log() { printf '\033[1;34m[stage-skills]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[stage-skills] WARNING:\033[0m %s\n' "$1" >&2; }

# An empty staging directory is not the same as no staging directory: the
# container side reads staging as authoritative, so this is what tells it to
# remove skills it installed on an earlier run. (No staging directory at all
# means "the host half didn't run", and it leaves everything alone.)
stage_empty() {
	rm -rf "$out"
	mkdir -p "$out"
}

# Opting out. The marker file is the dependable one: initializeCommand inherits
# the environment of whatever launched the editor, which for a GUI launch is
# usually not your shell — so an exported variable may simply not be there. The
# variable is for scripted/CI use of the devcontainer CLI.
if [ -f "$optout" ]; then
	log "opted out by .devcontainer/.skip-skills — not copying host skills"
	stage_empty
	exit 0
fi
if [ "${DEVCONTAINER_SKIP_SKILLS:-0}" != "0" ]; then
	log "opted out by DEVCONTAINER_SKIP_SKILLS — not copying host skills"
	stage_empty
	exit 0
fi

if [ ! -d "$src" ]; then
	log "no skills directory at $src — nothing to stage"
	stage_empty
	exit 0
fi

# Build beside the target and swap, so an interrupted run can't leave the
# container reading a half-copied skill.
tmp="$out.tmp.$$"
rm -rf "$tmp"
mkdir -p "$tmp"
trap 'rm -rf "$tmp"' EXIT

count=0
shopt -s nullglob
for entry in "$src"/*; do
	name="$(basename "$entry")"
	# False for a symlink whose target is gone — worth saying out loud, since the
	# skill works on the host only for as long as the target exists.
	if [ ! -e "$entry" ]; then
		warn "skipping '$name' — broken symlink"
		continue
	fi
	# A skill is a directory (SKILL.md plus its references). Anything else in
	# here is not one.
	[ -d "$entry" ] || continue
	cp -RL "$entry" "$tmp/$name"
	count=$((count + 1))
done
shopt -u nullglob

rm -rf "$out"
mv "$tmp" "$out"
trap - EXIT

log "staged $count skill(s) from $src"
