#!/usr/bin/env bash
# Creates (or completes) the gitignored .env next to this script.
#
# Licences and signing keys are copied from the .env of a matrix-homeserver-local checkout,
# whose traefik/certs directory also provides the TLS certificates. LiveKit key pairs are
# generated once. Variables already present in .env are kept, so re-running is safe.
# Values are never printed.
#
# Usage: ./init-env.sh [path/to/matrix-homeserver-local]
#        (default: $MATRIX_LOCAL_DIR, else ~/Projects/matrix-homeserver-local)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
SRC_DIR="${1:-${MATRIX_LOCAL_DIR:-$HOME/Projects/matrix-homeserver-local}}"
SRC_ENV="$SRC_DIR/.env"
CERTS_DIR="$SRC_DIR/traefik/certs"

[[ -f "$SRC_ENV" ]] || { echo "not found: $SRC_ENV" >&2; exit 1; }
for f in ca/rootCA.crt rc1.pem rc1-key.pem rc2.pem rc2-key.pem hs1.pem hs1-key.pem element.pem element-key.pem; do
	[[ -f "$CERTS_DIR/$f" ]] || { echo "missing certificate: $CERTS_DIR/$f" >&2; exit 1; }
done

umask 077
touch "$ENV_FILE"
chmod 600 "$ENV_FILE"

has_var() { grep -qE "^$1=.+" "$ENV_FILE"; }

set_var() {
	local name="$1" value="$2"
	if has_var "$name"; then
		echo "  kept      $name"
		return
	fi
	# Drop an empty placeholder line before appending the value.
	if grep -qE "^$name=" "$ENV_FILE"; then
		grep -vE "^$name=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
		mv "$ENV_FILE.tmp" "$ENV_FILE"
	fi
	printf '%s=%s\n' "$name" "$value" >> "$ENV_FILE"
	echo "  set       $name"
}

copy_var() {
	local name="$1" value
	value="$(grep -E "^$name=" "$SRC_ENV" | tail -1 | cut -d= -f2-)"
	[[ -n "$value" ]] || { echo "  MISSING   $name (not set in $SRC_ENV)" >&2; return 1; }
	set_var "$name" "$value"
}

echo "Writing $ENV_FILE"
set_var CERTS_DIR "$CERTS_DIR"
set_var RC_IMAGE "rocketchat/rocket.chat:matrixrtc-poc"
copy_var ENTERPRISE_LICENSE_RC1
copy_var ENTERPRISE_LICENSE_RC2
copy_var MATRIX_SIGNING_KEY_RC1
copy_var MATRIX_SIGNING_KEY_RC2
# Hex only, so the values need no quoting inside LiveKit's YAML config.
set_var LIVEKIT1_API_KEY "APIrc1$(openssl rand -hex 6)"
set_var LIVEKIT1_API_SECRET "$(openssl rand -hex 24)"
set_var LIVEKIT2_API_KEY "APIrc2$(openssl rand -hex 6)"
set_var LIVEKIT2_API_SECRET "$(openssl rand -hex 24)"
