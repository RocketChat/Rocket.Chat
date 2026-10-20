#!/usr/bin/env bash
# Rebuilds the ESM Fuselage dist, the bench page with and without the Tamagui compiler, and diffs computed styles
# against the pilot (out-head).
set -e
cd "$(dirname "$0")/.."
WT=$PWD
(cd packages/fuselage && FUSELAGE_ESM=1 node_modules/.bin/vite build --mode production --outDir ../../perf/frames-dist-esm >/dev/null)
TAMAGUI_EXTRACT=1 TAMAGUI_COMPILER_STATS=1 TAMAGUI_COMPILER_STATS_FILE="$WT/perf/stats-app.json" FUSELAGE_DIST=perf/frames-dist-esm OUT="$WT/perf/out-frames-x" \
	node_modules/.bin/vite build -c perf/bench/vite.config.mjs 2>&1 | grep -A3 "compiler stats:" || true
FUSELAGE_DIST=perf/frames-dist-esm OUT="$WT/perf/out-frames" node_modules/.bin/vite build -c perf/bench/vite.config.mjs >/dev/null 2>&1
for s in ${SCENARIOS:-message}; do
	echo "== $s pilot vs compiled"; node perf/computed-ab.mjs out-head out-frames-x "$s" | tail -4
	echo "== $s pilot vs compiled, hover"; node perf/computed-ab.mjs out-head out-frames-x "$s" hover | tail -4
	echo "== $s pilot vs runtime frames"; node perf/computed-ab.mjs out-head out-frames "$s" | tail -2
done
