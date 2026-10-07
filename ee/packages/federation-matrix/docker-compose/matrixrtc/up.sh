#!/usr/bin/env bash
# Starts the environment and waits until both servers and both SFUs answer.
#
# Usage: ./up.sh [--recreate] [--interop]
#   --recreate  recreate rc1 and rc2 on the current image (after ./build-image.sh) and drop
#               the untagged images of earlier builds
#   --interop   also start hs1 (Synapse) and element

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RECREATE=false
PROFILE_ARGS=()
while [[ $# -gt 0 ]]; do
	case "$1" in
		--recreate) RECREATE=true; shift ;;
		--interop) PROFILE_ARGS=(--profile interop); shift ;;
		-h|--help) sed -n '2,8p' "$0"; exit 0 ;;
		*) echo "Unknown option: $1" >&2; exit 1 ;;
	esac
done

[[ -f .env ]] || ./init-env.sh

env_value() { grep -E "^$1=" .env | tail -1 | cut -d= -f2-; }
CA_CERT="$(env_value CERTS_DIR)/ca/rootCA.crt"
IMAGE="$(env_value RC_IMAGE)"
IMAGE="${IMAGE:-rocketchat/rocket.chat:matrixrtc-poc}"

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
	echo "Image $IMAGE not found; build it first with ./build-image.sh" >&2
	exit 1
fi

docker compose ${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"} up -d
if [[ "$RECREATE" == true ]]; then
	docker compose up -d --force-recreate --no-deps rc1 rc2
	# Earlier builds of build-image.sh, now untagged and unused (the label is set by that script).
	docker image prune -f --filter label=org.rocket.chat.matrixrtc.git-head >/dev/null
fi

wait_for() {
	local name="$1" url="$2" limit="${3:-300}" start=$SECONDS
	printf 'waiting for %-8s %s ' "$name" "$url"
	until curl -fsS --max-time 5 --cacert "$CA_CERT" "$url" >/dev/null 2>&1; do
		if (( SECONDS - start > limit )); then
			echo "TIMEOUT after ${limit}s"
			return 1
		fi
		printf '.'
		sleep 3
	done
	echo " up ($((SECONDS - start))s)"
}

wait_for livekit1 http://localhost:7980 60
wait_for livekit2 http://localhost:7990 60
wait_for rc1 https://rc1/api/info
wait_for rc2 https://rc2/api/info
if [[ ${#PROFILE_ARGS[@]} -gt 0 ]]; then
	wait_for hs1 https://hs1/_matrix/client/versions 120
	wait_for element https://element 60
fi

# Federation and the LiveKit provider are enterprise modules: without a valid licence the server
# answers its federation API with 403 and never registers the LiveKit settings.
for h in rc1 rc2; do
	code="$(curl -s -o /dev/null -w '%{http_code}' --cacert "$CA_CERT" "https://$h/_matrix/federation/v1/version" || true)"
	if [[ "$code" == 200 ]]; then
		echo "federation on $h: enabled"
	else
		echo "WARNING: federation on $h answers HTTP $code; check the licence: docker compose logs $h | grep License" >&2
	fi
done

cat <<INFO

  rc1       https://rc1           (LiveKit ws://localhost:7980)
  rc2       https://rc2           (LiveKit ws://localhost:7990)
  admin     admin / admin on both servers
  seed      ./seed.sh   creates alice@rc1 and carol@rc2 and a federated DM between them
  logs      ./logs.sh [service...]
INFO
