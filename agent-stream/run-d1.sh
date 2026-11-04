#!/usr/bin/env bash
# D1: one monolith instance. usage: run-d1.sh <port> <db>
set -euo pipefail
here=$(dirname "$0")
"$here/start-instance.sh" "${1:?port}" "${2:?db}"
