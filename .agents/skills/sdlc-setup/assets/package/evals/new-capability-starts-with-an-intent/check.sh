#!/bin/sh
# A capability no spec covers starts as a draft intent with open questions, not as code or a spec.
set -eu
cd "$SDLC_PACKAGE_DIR"
fail() { echo "FAIL: $1"; exit 1; }

changed=$( { git diff --name-only --relative "$SDLC_EVAL_BASE"; git ls-files --others --exclude-standard; } | sort -u )

intent=$(echo "$changed" | grep -E '^docs/intents/[a-z0-9-]+\.md$' | grep -v README | head -n 1 || true)
[ -n "$intent" ] || fail "no new intent under docs/intents/"
grep -q 'Status: draft' "$intent" || fail "$intent is not Status: draft"
grep -q '\*\*Q1\*\*' "$intent" || fail "$intent has no numbered open questions"
if echo "$changed" | grep -qvE '^docs/(intents/|README\.md$)'; then
	fail "files outside docs/intents/ changed: $(echo "$changed" | grep -vE '^docs/(intents/|README\.md$)' | tr '\n' ' ')"
fi
echo "PASS: $intent"
