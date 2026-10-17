#!/usr/bin/env bash
# Stops and removes the containers. Data (mongo, hs1) is kept unless --volumes is passed.
#
# Usage: ./down.sh [--volumes]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ARGS=()
case "${1:-}" in
	'') ;;
	-v|--volumes) ARGS=(--volumes) ;;
	-h|--help) sed -n '2,4p' "$0"; exit 0 ;;
	*) echo "Unknown option: $1" >&2; exit 1 ;;
esac

docker compose --profile interop down ${ARGS[@]+"${ARGS[@]}"}
