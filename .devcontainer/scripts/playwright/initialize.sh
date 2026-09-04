#!/usr/bin/env bash
#
# Runs on the HOST from scripts/initialize.sh, before the container is created,
# and only when devcontainer.json declares the playwright-deps feature
# (feature.id).
#
# The host-side entry point for everything the playwright feature needs: the
# compose fragment that mounts the shared browser cache, and the volume it mounts
# from.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$here/../lib/overrides.sh"

# Playwright's browser downloads, shared by every worktree — download once, not
# once per checkout and not again on every rebuild. Mounted at the path
# PLAYWRIGHT_BROWSERS_PATH defaults to on Linux, so nothing needs configuring and
# a `playwright install` for a newly bumped version lands in the shared volume.
#
# Long syntax because `subpath` has no short form. It needs Compose >= 2.26 /
# Engine >= 25, and the subdirectory must already exist in the volume —
# ensure-playwright-browsers.sh creates it, below.
#
# Contributed here rather than checked into docker-compose.yml so that dropping
# the feature drops the mount with it: the volume is external, and compose fails
# the create outright on an external volume that nothing created.
overrides_add playwright service-volumes <<-'YAML'
	- type: volume
	  source: playwright-browsers
	  target: /home/vscode/.cache/ms-playwright
	  volume:
	    subpath: ms-playwright
YAML

overrides_add playwright volumes <<-'YAML'
	playwright-browsers:
	  external: true
	  name: rc-devcontainer-playwright-browsers
YAML

bash "$here/ensure-playwright-browsers.sh"
