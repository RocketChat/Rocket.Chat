#!/usr/bin/env bash
set -euo pipefail

clean=false
if [[ $# -eq 1 && "$1" == --clean ]]; then
	clean=true
elif [[ $# -ne 0 ]]; then
	printf 'Usage: bash scripts/meteor-cache.sh [--clean]\n' >&2
	exit 2
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
local_dir="$root/apps/meteor/.meteor/local"
cache_dirs=()
shopt -s nullglob
for directory in "$local_dir"/{build,bundler-cache,isopacks,plugin-cache,server-cache} "$local_dir"/.build*.build*; do
	if [[ -d "$directory" ]]; then
		cache_dirs+=("$directory")
	fi
done

if [[ ${#cache_dirs[@]} -eq 0 ]]; then
	printf 'Meteor bundle cache: 0.00 GB (0 KiB). Nothing to clean.\n'
	exit 0
fi

cache_kib=$(du -sk "${cache_dirs[@]}" | awk '{ total += $1 } END { printf "%.0f", total }')
awk -v kib="$cache_kib" 'BEGIN { printf "Meteor bundle cache: %.2f GB (%.0f KiB).\n", kib * 1024 / 1000000000, kib }'

if [[ "$clean" == true ]]; then
	rm -rf -- "${cache_dirs[@]}"
	printf 'Cleared Meteor bundle cache. The next Meteor start will rebuild it.\n'
elif (( cache_kib * 1024 > 5000000000 )); then
	printf 'Cache exceeds 5 GB. Stop Meteor, then run from the repository root: bash scripts/meteor-cache.sh --clean\n'
fi
