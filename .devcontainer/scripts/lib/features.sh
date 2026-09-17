#!/usr/bin/env bash
#
# Sourced, not executed. Decides which of the scripts/<name>/ hook directories
# run, from the `features` block in devcontainer.json.
#
# The rule: a directory that ships a `feature.id` file only runs when
# devcontainer.json declares one of the ids listed in it. Comment a feature out
# and none of its hooks fire — and because its compose fragment is contributed
# from one of those hooks (see lib/overrides.sh), none of its mounts or volumes
# exist either. A directory with no feature.id is unconditional.
#
# Directory names are deliberately NOT derived from feature ids: `gh` owns
# ghcr.io/devcontainers/features/github-cli, and the mapping only gets less
# guessable as features are added. The file is the mapping.
#
# No jq and no python: this is sourced on the host from initializeCommand, where
# neither is a given (ensure-gh-auth.sh already treats jq as optional for that
# reason). devcontainer.json is JSONC, so a small awk pass strips comments and
# the ids are matched as object keys — a commented-out feature must not count,
# which is the whole point.

_features_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_features_scripts_dir="$(cd "$_features_dir/.." && pwd)"
_features_json="$(cd "$_features_dir/../.." && pwd)/devcontainer.json"

# Strips // line comments and /* */ blocks, skipping anything inside a string
# literal — a naive `s|//.*||` would truncate the line holding
# "http://turbo-cache:3000" and could hide whatever followed it.
_features_strip_jsonc() {
	awk '
	{
		out = ""
		i = 1
		n = length($0)
		while (i <= n) {
			c = substr($0, i, 1)
			if (in_block) {
				if (c == "*" && substr($0, i + 1, 1) == "/") { in_block = 0; i += 2; continue }
				i++
				continue
			}
			if (in_string) {
				out = out c
				# Backslash escapes the next character, \" included, so consume both.
				if (c == "\\") { out = out substr($0, i + 1, 1); i += 2; continue }
				if (c == "\"") in_string = 0
				i++
				continue
			}
			if (c == "\"") { in_string = 1; out = out c; i++; continue }
			if (c == "/" && substr($0, i + 1, 1) == "/") break
			if (c == "/" && substr($0, i + 1, 1) == "*") { in_block = 1; i += 2; continue }
			out = out c
			i++
		}
		print out
	}
	# in_block persists across lines on purpose: awk globals are not per-record.
	' "$_features_json"
}

# feature_declared <feature-id> — true when devcontainer.json declares it.
#
# Matched as an object key rather than a bare substring, with the `:<version>`
# suffix optional, so the id in feature.id stays version-agnostic and a mention
# in prose or in some other value cannot pass for a declaration.
feature_declared() {
	local id="$1"
	_features_strip_jsonc | grep -Eq "\"${id//./\\.}(:[^\"]*)?\"[[:space:]]*:"
}

# feature_dir_enabled <dir> — true when <dir>/feature.id is satisfied, or when
# there is no feature.id (an unconditional directory).
#
# Several ids in one file means "any of these", for a directory whose hooks are
# worth running for more than one feature.
feature_dir_enabled() {
	local dir="$1" id
	[ -f "$dir/feature.id" ] || return 0
	# `|| [ -n "$id" ]` so a last line without a trailing newline still counts.
	while IFS= read -r id || [ -n "$id" ]; do
		id="${id%%#*}"
		id="${id//[[:space:]]/}"
		[ -n "$id" ] || continue
		feature_declared "$id" && return 0
	done <"$dir/feature.id"
	return 1
}

# run_feature_hooks <hook-filename> — runs scripts/<name>/<hook> for every
# directory that ships one and whose feature is declared.
#
# Directories are visited in glob order, i.e. alphabetically. Nothing here
# depends on that order — each feature's setup is independent — but it does mean
# the sequence is stable rather than filesystem-dependent.
run_feature_hooks() {
	local hook="$1" dir name
	for dir in "$_features_scripts_dir"/*/; do
		dir="${dir%/}"
		[ -d "$dir" ] || continue
		# lib/ and any other plain helper directory falls out here.
		[ -f "$dir/$hook" ] || continue
		name="$(basename "$dir")"
		if ! feature_dir_enabled "$dir"; then
			printf '\033[1;33m[%s]\033[0m skipping %s — its feature is not declared in devcontainer.json\n' \
				"${hook%.sh}" "$name"
			continue
		fi
		bash "$dir/$hook"
	done
}
