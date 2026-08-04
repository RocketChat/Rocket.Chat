#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from devcontainer.json's updateContentCommand, on
# create/rebuild and whenever the tool decides the content is stale.
#
# This is where the workspace is made usable: dependencies, then whatever the
# declared features need from *inside* an installed workspace. It runs after
# onCreateCommand — so the volumes it writes into are already claimed — and
# before postStartCommand, which is what applies the egress firewall. That
# ordering is load-bearing for anything here that downloads: at this point there
# is still unrestricted network.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$here/lib/features.sh"

log() { printf '\033[1;34m[update-content]\033[0m %s\n' "$1"; }

cd "$(cd "$here/../.." && pwd)"

log "installing dependencies"
yarn install

# Between install and build on purpose: a hook can rely on node_modules — which
# is how a feature gets at a tool pinned by the repo rather than a version of its
# own — but must not need build output. Nothing here should be expensive enough
# to be worth deferring past the build.
run_feature_hooks update-content.sh

log "building workspace packages"
yarn build
