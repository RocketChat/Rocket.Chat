#!/usr/bin/env bash
# Checks that the tools needed to run Rocket.Chat from source are installed.
# Usage: scripts/check-deps.sh [--install]
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL=0
case "${1:-}" in
	--install) INSTALL=1 ;;
	'') ;;
	-h|--help) echo "Usage: $0 [--install]"; exit 0 ;;
	*) echo "Unknown option: $1" >&2; echo "Usage: $0 [--install]" >&2; exit 2 ;;
esac

# Versions are read from the repo so the script never drifts from the pins.
NODE_PIN="$(awk '/"volta"/{v=1} v && /"node"/{gsub(/[",]/,"",$2); print $2; exit}' "$ROOT/package.json")"
NODE_RANGE="$(awk '/"engines"/{e=1} e && /"node"/{sub(/^[^:]*: *"/,""); sub(/",?$/,""); print; exit}' "$ROOT/package.json")"
YARN_PIN="$(sed -n 's/.*"packageManager": *"yarn@\([^"]*\)".*/\1/p' "$ROOT/package.json")"
METEOR_PIN="$(sed 's/METEOR@//' "$ROOT/apps/meteor/.meteor/release")"

FAILED=0
ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAILED=1; }
has() { command -v "$1" >/dev/null 2>&1; }

install_node() {
	if has volta; then volta install "node@$NODE_PIN"
	elif has fnm; then fnm install "$NODE_PIN" && eval "$(fnm env)" && fnm use "$NODE_PIN"
	elif [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
		. "${NVM_DIR:-$HOME/.nvm}/nvm.sh" && nvm install "$NODE_PIN" && nvm use "$NODE_PIN"
	else
		echo "    No Node version manager found. Install Volta (https://volta.sh) and re-run with --install."
		return 1
	fi
}

# Node's own satisfies check would need the semver package, which is not installed yet;
# engines only uses ">=a <b" pairs joined by "||".
node_satisfies() {
	node -e '
		const v = process.versions.node.split(".").map(Number);
		const cmp = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
		const ok = process.argv[1].split("||").some((range) => range.trim().split(/\s+/).every((c) => {
			const [, op, ver] = c.match(/^(>=|<=|>|<|=)?(.+)$/);
			const d = cmp(v, ver.split(".").map(Number));
			return { ">=": d >= 0, "<=": d <= 0, ">": d > 0, "<": d < 0 }[op] ?? d === 0;
		}));
		process.exit(ok ? 0 : 1);
	' "$NODE_RANGE"
}

echo "Node.js (pinned $NODE_PIN, engines \"$NODE_RANGE\")"
if ! has node && [ $INSTALL -eq 1 ]; then install_node; fi
if ! has node; then
	fail "node not found"
elif node_satisfies; then
	NODE_V="$(node -v | sed 's/^v//')"
	if [ "$NODE_V" = "$NODE_PIN" ]; then ok "node $NODE_V"; else warn "node $NODE_V satisfies engines but is not the pinned $NODE_PIN"; fi
else
	if [ $INSTALL -eq 1 ] && install_node && node_satisfies; then ok "node $(node -v) installed"
	else fail "node $(node -v) does not satisfy \"$NODE_RANGE\""; fi
fi

echo "Yarn (pinned $YARN_PIN via packageManager)"
YARN_V="$(cd "$ROOT" && yarn --version 2>/dev/null)"
if [ "$YARN_V" != "$YARN_PIN" ] && [ $INSTALL -eq 1 ] && has node; then
	has corepack || npm install -g corepack
	corepack enable && YARN_V="$(cd "$ROOT" && yarn --version 2>/dev/null)"
fi
if [ "$YARN_V" = "$YARN_PIN" ]; then ok "yarn $YARN_V"
elif [ -z "$YARN_V" ]; then fail "yarn not found — run: corepack enable"
else fail "yarn $YARN_V, expected $YARN_PIN — run: corepack enable"; fi

echo "Meteor (project release $METEOR_PIN)"
if ! has meteor && [ $INSTALL -eq 1 ]; then
	curl -fsSL "https://install.meteor.com/?release=$METEOR_PIN" | sh
	export PATH="$HOME/.meteor:$PATH"
fi
# The meteor tool downloads the project's release on first run inside apps/meteor.
if has meteor; then ok "meteor found at $(command -v meteor)"
else fail "meteor not found — run: curl https://install.meteor.com/?release=$METEOR_PIN | sh"; fi

echo "Git"
if has git; then ok "$(git --version)"; else fail "git not found — install it from https://git-scm.com"; fi

if [ "$(uname)" = "Darwin" ]; then
	echo "Watchman (recommended on macOS for file watching)"
	if ! has watchman && [ $INSTALL -eq 1 ] && has brew; then brew install watchman; fi
	if has watchman; then ok "watchman $(watchman --version)"; else warn "watchman not found — run: brew install watchman"; fi
fi

echo "Workspace dependencies"
if [ ! -f "$ROOT/node_modules/.yarn-state.yml" ] && [ $INSTALL -eq 1 ] && [ $FAILED -eq 0 ]; then
	(cd "$ROOT" && yarn install)
fi
if [ -f "$ROOT/node_modules/.yarn-state.yml" ]; then ok "node_modules installed"
else fail "node_modules missing — run: yarn"; fi

echo
if [ $FAILED -eq 0 ]; then echo "All set. Start the app with: yarn dev"
else echo "Some requirements are missing.$([ $INSTALL -eq 0 ] && echo ' Re-run with --install to fix what can be fixed automatically.')"; fi
exit $FAILED
