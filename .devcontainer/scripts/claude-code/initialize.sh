#!/usr/bin/env bash
#
# Runs on the HOST from scripts/initialize.sh, before the container is created,
# and only when devcontainer.json declares the claude-code feature (feature.id).
#
# The host-side entry point for everything the claude-code feature needs: the
# compose fragment (shared config volume, and the capabilities the egress
# firewall requires), the volume itself, and the skills staged out of your host
# config for the container to pick up.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$here/../lib/overrides.sh"

# Required by init-firewall.sh (post-start.sh) to manage iptables/ipset inside
# the container. Contributed by the feature that needs them rather than granted
# unconditionally in docker-compose.yml: NET_ADMIN is most of what a container
# needs to rewrite its own networking, and without Claude Code there is nothing
# in here asking for it.
overrides_add claude-code service <<-'YAML'
	cap_add:
	  - NET_ADMIN
	  - NET_RAW
YAML

# Claude Code's config dir — auth, settings, history, installed skills — shared by
# every worktree, so one login covers all of them. External with a fixed name is
# what makes that work; see gh/initialize.sh for the long version of why an
# ordinary volume (or a devcontainer.json `mounts` entry, which becomes one) would
# be namespaced per worktree instead.
#
# The `claude/` subpath keeps the volume root a container for named entries rather
# than being ~/.claude itself, so a sibling can be added later without moving what
# is already stored. ensure-claude-config.sh creates it — a subpath mount fails on
# a path that is not already in the volume.
overrides_add claude-code service-volumes <<-'YAML'
	- type: volume
	  source: claude-config
	  target: /home/vscode/.claude
	  volume:
	    subpath: claude
YAML

overrides_add claude-code volumes <<-'YAML'
	claude-config:
	  external: true
	  name: rc-claude-config
YAML

bash "$here/ensure-claude-config.sh"

bash "$here/stage-skills.sh"
