#!/usr/bin/env bash
# Runs the cells of the matrix for one deployment, each cell $RUNS times, every run under the shared measurement lock.
# usage: matrix.sh <label> <D1|D2> <servers, comma separated, producer first> <db> <seed.json> <out dir>
# env:   SCENARIOS (default "S1 S2 S3 S4 S5"), WS (default "0 50 250"), RUNS (default 3),
#        ADAPTER (default ddp-room-messages), SINK (default update-message), DRAIN_TIMEOUT (ms, default 600000),
#        BENCH_LOCK (default: the lock path of the plan)
set -uo pipefail

label=${1:?label} deployment=${2:?deployment} servers=${3:?servers} db=${4:?db} seed=${5:?seed} out=${6:?out}
here=$(cd "$(dirname "$0")" && pwd)
lock=${BENCH_LOCK:-/private/tmp/claude-501/-Users-dgubert-dev-RocketChat-worktrees-main/db4740ae-bf22-4d3a-8a01-f77e259cc97b/scratchpad/agent-stream/bench.lock}

release() { rmdir "$lock" 2> /dev/null; }
trap release EXIT INT TERM

for scenario in ${SCENARIOS:-S1 S2 S3 S4 S5}; do
	ws=${WS:-0 50 250}
	[ "$scenario" = S4 ] && ws=0
	for w in $ws; do
		for run in $(seq 1 "${RUNS:-3}"); do
			until mkdir "$lock" 2> /dev/null; do
				echo "lock busy, waiting 60 s"
				sleep 60
			done
			echo "== $label $deployment $scenario W=$w run $run ($(date +%T))"
			node "$here/loadgen.mjs" --label "$label" --deployment "$deployment" --servers "$servers" --db "$db" --seed "$seed" --out "$out" \
				--scenario "$scenario" --w "$w" --run "$run" --adapter "${ADAPTER:-ddp-room-messages}" --sink "${SINK:-update-message}" \
				--drain-timeout "${DRAIN_TIMEOUT:-600000}" || echo "!! run failed: $scenario W=$w run $run"
			release
			sleep 3
		done
	done
done
