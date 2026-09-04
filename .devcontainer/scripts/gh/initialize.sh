#!/usr/bin/env bash
#
# Runs on the HOST from scripts/initialize.sh, before the container is created,
# and only when devcontainer.json declares the github-cli feature (feature.id).
#
# The host-side entry point for everything the gh feature needs: the compose
# fragment that mounts your shared GitHub auth, and the volume it mounts from.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$here/../lib/overrides.sh"

# GitHub auth, shared by every worktree — log in once, not once per checkout.
# Both halves come from ONE volume through subpaths, mounted at the paths gh and
# ssh look in by default, so nothing needs configuring and `gh auth login` writes
# a new key straight into the shared volume.
#
# Long syntax because `subpath` has no short form. It needs Compose >= 2.26 /
# Engine >= 25, and the subdirectories must already exist in the volume —
# ensure-gh-auth.sh creates them, below.
#
# Contributed here rather than checked into docker-compose.yml so that dropping
# the feature drops the mounts with it: the volume is external, and compose fails
# the create outright on an external volume that nothing created.
overrides_add gh service-volumes <<-'YAML'
	- type: volume
	  source: gh-auth
	  target: /home/vscode/.config/gh
	  volume:
	    subpath: gh
	- type: volume
	  source: gh-auth
	  target: /home/vscode/.ssh
	  volume:
	    subpath: ssh
YAML

# Everything `gh auth login` produces: gh's own config (hosts.yml, with the OAuth
# token) under gh/, and the SSH key it generates and uploads under ssh/.
#
# External with a fixed name is what makes it shared. An ordinary volume would be
# namespaced per compose project, i.e. per worktree (`<worktree>_devcontainer_<name>`
# in `docker volume ls` is the proof), and each copy would start empty — one
# `gh auth login` per checkout, forever. Being external also puts it out of reach
# of `docker compose down -v`.
#
# It cannot be a devcontainer.json `mounts` entry either: those are folded into a
# generated compose override as ordinary volumes and come out prefixed too.
overrides_add gh volumes <<-'YAML'
	gh-auth:
	  external: true
	  name: rc-devcontainer-gh-auth
YAML

bash "$here/ensure-gh-auth.sh"
