#!/usr/bin/env bash
#
# Runs on the HOST from devcontainer.json's initializeCommand, before the
# container is created.
#
# Everything here is a prerequisite of container *create*, not setup that could
# be deferred to a later lifecycle hook — see each script's header for what
# breaks without it. Two recurring reasons: compose refuses to create the
# container when an external volume is missing, and it is the only hook that runs
# on the host, so files it stages exist nowhere the container can reach until it
# does.
#
# It is also where docker-compose.overrides.yml is assembled. Contributors below
# stage fragments (lib/overrides.sh) and the merge happens once at the end, so
# the generated file is written in one shot rather than grown in place.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$here/lib/features.sh"
source "$here/lib/overrides.sh"

# Fragments are staged in a temp directory, not in the repo: only the merged
# result belongs in .devcontainer/. Cleared on any exit, including a failure
# partway through — a half-collected staging directory must never be merged on
# the next run.
overrides_reset
trap overrides_cleanup EXIT

# Contributes the git-dir mounts when this checkout is a linked worktree, and
# nothing at all when it is not.
bash "$here/init-worktree.sh"

# Passes your host git author identity through to the container, where
# on-create.sh writes it into the container's global git config. Nothing to
# contribute when the host has no identity configured.
bash "$here/init-git-identity.sh"

# Brings up the shared Turborepo remote cache. The devcontainer attaches to its
# network as external, so the network must exist before compose runs.
bash "$here/ensure-turbo-cache.sh"

# Creates the shared Yarn cache volume (~/.yarn/berry: the package zips and
# metadata index) — external volume, mounted through a subpath that has to exist
# before the container starts — and it is needed early: `updateContentCommand`
# (yarn install) is the first thing that reads it.
#
# Not feature-gated: the toolchain is the point of this container, not an opt-in.
bash "$here/ensure-yarn-cache.sh"

# Per-feature host-side setup: scripts/<name>/initialize.sh for every feature
# devcontainer.json actually declares. Each contributes its own compose fragment,
# so a feature that is commented out leaves no volume to create and no mount
# pointing at one.
run_feature_hooks initialize.sh

# Everything staged above, merged into the single generated compose file that
# devcontainer.json includes.
overrides_write
