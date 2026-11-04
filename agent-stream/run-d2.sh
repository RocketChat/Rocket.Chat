#!/usr/bin/env bash
# D2: two monolith instances on one Mongo, joined by the instance broker. A starts first, so it runs the migrations.
# usage: run-d2.sh <portA> <portB> <db>
set -euo pipefail
here=$(dirname "$0")
"$here/start-instance.sh" "${1:?portA}" "${3:?db}"
"$here/start-instance.sh" "${2:?portB}" "$3"
