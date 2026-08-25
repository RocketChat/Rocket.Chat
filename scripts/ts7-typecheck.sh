#!/usr/bin/env bash
#
# TS7 (native `tsc`) typecheck canary.
#
# Runs the workspace TypeScript 7 compiler in --noEmit mode across every
# workspace package. Since the shared @rocket.chat/tsconfig base now carries
# the TS7-required options (target es2022, moduleResolution bundler, explicit
# ambient `types`), no CLI overrides are needed anymore — this script only
# tallies which packages are green.
#
# PREREQUISITE: package `dist` folders must be freshly built (run `turbo run
# build` first). Consumers resolve `@rocket.chat/*` types from built `.d.ts`
# (core-typings has no `types`/`exports`, only `main: dist/index.js`); a stale
# dist produces false errors that are NOT TS7-specific.
#
# Non-blocking by design — prints a per-package tally and always exits 0 so it
# can run as a CI canary while the migration is in progress.

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# The hoisted workspace compiler. Packages still pinned to TS5.x for their own
# toolchain (typia/ttsc, eslint-config) are typechecked with TS7 here anyway —
# that is the point of the canary.
TSC="$ROOT/node_modules/typescript/bin/tsc"
if [ ! -x "$TSC" ] && [ ! -f "$TSC" ]; then
	echo "workspace typescript not found at $TSC — run yarn install first" >&2
	exit 1
fi
echo "Using $(node "$TSC" --version 2>/dev/null || "$TSC" --version)"

total_pkgs=0
green=0
declare -a FAILED

for tsconfig in packages/*/tsconfig.json ee/packages/*/tsconfig.json ee/apps/*/tsconfig.json apps/*/tsconfig.json; do
	[ -f "$tsconfig" ] || continue
	pkg="$(dirname "$tsconfig")"
	total_pkgs=$((total_pkgs + 1))
	out="$("$TSC" --noEmit -p "$tsconfig" 2>&1)"
	errs="$(printf '%s\n' "$out" | grep -cE 'error TS[0-9]+')"
	if [ "$errs" -eq 0 ]; then
		green=$((green + 1))
	else
		FAILED+=("$pkg=$errs")
		printf '::group::%s (%s errors)\n%s\n::endgroup::\n' "$pkg" "$errs" "$out"
	fi
done

echo ""
echo "================ TS7 canary summary ================"
echo "green: $green / $total_pkgs packages"
if [ "${#FAILED[@]}" -gt 0 ]; then
	printf '%s\n' "${FAILED[@]}" | sort -t= -k2 -rn
fi
echo "===================================================="
echo "Canary is non-blocking; see grouped logs above for details."
exit 0
