#!/usr/bin/env bash
# Follows the logs of the given services (all when none given).
#
# Usage: ./logs.sh [service...]     e.g. ./logs.sh rc1 rc2     ./logs.sh livekit1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker compose --profile interop logs --follow --tail "${TAIL:-200}" "$@"
