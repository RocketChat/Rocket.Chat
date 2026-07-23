#!/usr/bin/env bash
#
# TS7 (native `tsc`, ex-`tsgo`) typecheck canary.
#
# Runs the native TypeScript 7 compiler in --noEmit mode across every workspace
# package, applying via CLI flags the options TS7 requires but our TS5.x base
# tsconfig can't set yet (TS5.9 rejects `bundler` + `commonjs`, so the base
# config must stay on `node`/`es5` until we drop TS5). This lets both
# toolchains coexist: TS5.x still emits `dist` (typia/ts-patch), TS7 only
# typechecks here.
#
# PREREQUISITE: package `dist` folders must be freshly built (run `turbo run
# build` first). Consumers resolve `@rocket.chat/*` types from built `.d.ts`
# (core-typings has no `types`/`exports`, only `main: dist/index.js`); a stale
# dist produces false errors that are NOT TS7-specific.
#
# Non-blocking by design — prints a per-package tally and always exits 0 so it
# can run as a CI canary while the migration is in progress.

set -uo pipefail

TS_VERSION="${TS7_VERSION:-7}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Isolated TS7 install so it never clashes with the pinned TS5.x devDep.
TS7_DIR="$(mktemp -d)"
trap 'rm -rf "$TS7_DIR"' EXIT
echo "Installing typescript@${TS_VERSION} into $TS7_DIR ..."
( cd "$TS7_DIR" && npm init -y >/dev/null 2>&1 && npm i "typescript@${TS_VERSION}" >/dev/null 2>&1 )
TSC="$TS7_DIR/node_modules/.bin/tsc"
echo "Using $("$TSC" --version)"

# Options TS7 needs that the base tsconfig can't carry yet: the shared base
# still targets es5 / moduleResolution node (both removed in TS7), and TS7 no
# longer auto-includes ambient @types, so node/jest must be named explicitly.
OVERRIDES=(--noEmit --target es2022 --types node,jest,webpack-env)

# `bundler` resolution can't be forced on packages that pin a node16/nodenext
# family `module` (TS5095/TS5109) — those already use a TS7-valid resolution,
# so we only override resolution for the rest.
resolution_override() {
	# Grep the package's own tsconfig; the node16/nodenext pins live there, not
	# in the shared base. Case-insensitive match on the `module` value.
	if grep -iqE '"module"[[:space:]]*:[[:space:]]*"node(16|18|20|next)"' "$1"; then
		echo ""
	else
		echo "--moduleResolution bundler"
	fi
}

total_pkgs=0
green=0
declare -a FAILED

for tsconfig in packages/*/tsconfig.json ee/packages/*/tsconfig.json ee/apps/*/tsconfig.json apps/*/tsconfig.json; do
	[ -f "$tsconfig" ] || continue
	pkg="$(dirname "$tsconfig")"
	total_pkgs=$((total_pkgs + 1))
	# shellcheck disable=SC2046
	out="$("$TSC" "${OVERRIDES[@]}" $(resolution_override "$tsconfig") -p "$tsconfig" 2>&1)"
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
