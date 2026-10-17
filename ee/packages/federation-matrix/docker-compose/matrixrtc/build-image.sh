#!/usr/bin/env bash
# Builds the Rocket.Chat image used by rc1 and rc2 from the current checkout.
#
# Same steps as tests/scripts/run-integration-tests.sh: a server-only Meteor
# bundle built into a temp dir outside the repo, then the release-standard
# target of apps/meteor/.docker/Dockerfile.alpine.
#
# Usage: ./build-image.sh [--no-packages] [--tag <image>]
#   --no-packages  skip `yarn build` of the workspace packages (turbo, incremental: only
#                  changed packages rebuild). The Meteor bundle takes packages/ and
#                  ee/packages/ from their dist/, so skip it only when none of them changed.
#   --tag          image tag (default: RC_IMAGE from .env, else
#                  rocketchat/rocket.chat:matrixrtc-poc)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
DEFAULT_IMAGE="rocketchat/rocket.chat:matrixrtc-poc"

BUILD_PACKAGES=true
IMAGE=""

while [[ $# -gt 0 ]]; do
	case "$1" in
		--no-packages) BUILD_PACKAGES=false; shift ;;
		--tag) IMAGE="$2"; shift 2 ;;
		-h|--help) sed -n '2,14p' "$0"; exit 0 ;;
		*) echo "Unknown option: $1" >&2; exit 1 ;;
	esac
done

if [[ -z "$IMAGE" && -f "$SCRIPT_DIR/.env" ]]; then
	IMAGE="$(grep -E '^RC_IMAGE=' "$SCRIPT_DIR/.env" | tail -1 | cut -d= -f2- || true)"
fi
IMAGE="${IMAGE:-${RC_IMAGE:-$DEFAULT_IMAGE}}"

command -v meteor >/dev/null || { echo "meteor not found in PATH" >&2; exit 1; }
command -v docker >/dev/null || { echo "docker not found in PATH" >&2; exit 1; }

START=$SECONDS
elapsed() { local s=$((SECONDS - START)); printf '%dm%02ds' $((s / 60)) $((s % 60)); }
log() { printf '[build-image %s +%s] %s\n' "$(date '+%H:%M:%S')" "$(elapsed)" "$*"; }

# Outside the repo: Meteor follows the workspace symlinks when building inside it.
BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/rc-matrixrtc-build-XXXXXX")"
trap 'rm -rf "$BUILD_DIR"' EXIT

log "repo:  $REPO_ROOT"
GIT_HEAD="$(git -C "$REPO_ROOT" rev-parse HEAD)"
log "HEAD:  $(git -C "$REPO_ROOT" log -1 --format='%h %s' "$GIT_HEAD")"
DIRTY="$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no | wc -l | tr -d ' ')"
log "dirty tracked files: $DIRTY (the bundle includes uncommitted changes)"
log "image: $IMAGE"

if [[ "$BUILD_PACKAGES" == true ]]; then
	log "yarn build (workspace packages)..."
	(cd "$REPO_ROOT" && yarn build)
fi

log "meteor build --server-only -> $BUILD_DIR"
(cd "$REPO_ROOT/apps/meteor" && METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --server-only --directory "$BUILD_DIR")
log "meteor build done"

# Same base as the Dockerfile's builder stage, so the swapped binaries match the image.
NODE_BASE="$(grep -m1 -E '^FROM node:' "$REPO_ROOT/apps/meteor/.docker/Dockerfile.alpine" | awk '{print $2}')"
log "swapping host-only native packages for $NODE_BASE ones"
docker run --rm \
	-v "$BUILD_DIR:/build" \
	-v "$SCRIPT_DIR/fix-bundle-natives.js:/fix-bundle-natives.js:ro" \
	"$NODE_BASE" node /fix-bundle-natives.js /build/bundle/programs/server/npm/node_modules

log "docker build (target release-standard)..."
docker build \
	--file "$REPO_ROOT/apps/meteor/.docker/Dockerfile.alpine" \
	--target release-standard \
	--label "org.rocket.chat.matrixrtc.git-head=$GIT_HEAD" \
	--label "org.rocket.chat.matrixrtc.dirty-files=$DIRTY" \
	--tag "$IMAGE" \
	"$BUILD_DIR"

log "done: $IMAGE built in $(elapsed)"
log "restart the servers with: $SCRIPT_DIR/up.sh --recreate"
