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
# Installs made by fnm, nvm or the Meteor installer only reach this script's shell; the caller must run these.
NEXT=''
ok() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAILED=1; }
has() { command -v "$1" >/dev/null 2>&1; }

install_node() {
	if has volta; then volta install "node@$NODE_PIN"
	elif has fnm; then
		fnm install "$NODE_PIN" && eval "$(fnm env)" && fnm use "$NODE_PIN" && NEXT="$NEXT  fnm use $NODE_PIN\n"
	elif [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
		. "${NVM_DIR:-$HOME/.nvm}/nvm.sh" && nvm install "$NODE_PIN" && nvm use "$NODE_PIN" && NEXT="$NEXT  nvm use $NODE_PIN\n"
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
node_version() { has node && node -v | sed 's/^v//'; }
NODE_V="$(node_version)"
if [ "$NODE_V" != "$NODE_PIN" ] && [ $INSTALL -eq 1 ]; then install_node; NODE_V="$(node_version)"; fi
if [ -z "$NODE_V" ]; then fail "node not found"
elif [ "$NODE_V" = "$NODE_PIN" ]; then ok "node $NODE_V"
elif node_satisfies; then warn "node $NODE_V satisfies engines but is not the pinned $NODE_PIN$([ $INSTALL -eq 0 ] && echo ' — re-run with --install')"
else fail "node $NODE_V does not satisfy \"$NODE_RANGE\""; fi

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
	if ! has meteor && [ -x "$HOME/.meteor/meteor" ]; then
		export PATH="$HOME/.meteor:$PATH"
		NEXT="$NEXT  export PATH=\"\$HOME/.meteor:\$PATH\"   # add it to your shell profile too\n"
	fi
fi
# The meteor tool downloads the project's release on first run inside apps/meteor.
if has meteor; then ok "meteor found at $(command -v meteor)"
else fail "meteor not found — run: curl https://install.meteor.com/?release=$METEOR_PIN | sh"; fi

echo "Git"
if has git; then ok "$(git --version)"; else fail "git not found — install it from https://git-scm.com"; fi

# Outside macOS, @parcel/watcher prefers Watchman over inotify, and Watchman breaks Meteor's watcher.
if [ "$(uname)" != "Darwin" ] && has watchman; then
	echo "Watchman"
	warn "watchman is installed and Meteor's file watching may fail — see docs/meteor-modern-stack.md"
fi

echo
if [ -n "$NEXT" ]; then printf 'Run in your shell before continuing:\n%b\n' "$NEXT"; fi
if [ $FAILED -eq 0 ]; then echo "All set. Install the workspace with: yarn"
else echo "Some requirements are missing.$([ $INSTALL -eq 0 ] && echo ' Re-run with --install to fix what can be fixed automatically.')"; fi
exit $FAILED
