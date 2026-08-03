#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from devcontainer.json's postStartCommand, on every
# start.
#
# Nothing unconditional here so far: every post-start step belongs to a feature,
# and each lives in scripts/<name>/post-start.sh.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$here/lib/features.sh"

run_feature_hooks post-start.sh
