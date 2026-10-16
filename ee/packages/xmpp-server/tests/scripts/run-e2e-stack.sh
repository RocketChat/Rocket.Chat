#!/usr/bin/env bash
# Brings up Rocket.Chat and Openfire federating over XMPP, then runs the end-to-end suite against them.
set -euo pipefail

PACKAGE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_ROOT="$(cd "$PACKAGE_ROOT/../../.." && pwd)"
COMPOSE=(docker compose -f "$PACKAGE_ROOT/docker-compose.test.yml")
CERTS_DIR="$PACKAGE_ROOT/docker-compose/certs/generated"
SERVICES=(authorization-service presence-service xmpp-server-service)
MAX_WAIT_SECONDS=300

export XMPP_STACK_RC_PORT="${XMPP_STACK_RC_PORT:-3000}"
export XMPP_STACK_SERVICE_PORT="${XMPP_STACK_SERVICE_PORT:-3039}"
export XMPP_STACK_OPENFIRE_C2S_PORT="${XMPP_STACK_OPENFIRE_C2S_PORT:-5222}"
export XMPP_STACK_OPENFIRE_ADMIN_PORT="${XMPP_STACK_OPENFIRE_ADMIN_PORT:-9090}"

IMAGE_TAG=""
SKIP_BUILD=false
RUN_TESTS=true
KEEP_RUNNING=false

usage() {
	cat <<EOF
Usage: $(basename "$0") [options] [-- <node --test arguments>]

Builds Rocket.Chat, authorization-service, presence-service and xmpp-server-service from the
working tree, starts them with Openfire, runs the end-to-end suite, and tears everything down.

  --image-tag TAG   use the images CI published to ghcr.io/rocketchat/rocket.chat/* under TAG
                    (for example pr-12345 or develop) instead of building
  --skip-build      reuse the images a previous run built
  --no-test         start the stack and leave it running without running the suite
  --keep-running    leave the stack running after the suite
  --down            tear down a stack left running and exit
  -h, --help        show this help

Arguments after -- replace the suite's default file list, e.g.
  $(basename "$0") -- --test-name-pattern='stores a message' tests/end-to-end/remote-muc.spec.ts

ENTERPRISE_LICENSE (a license with the federation module) must be set in the environment or
in $PACKAGE_ROOT/.env. The license is checked against XMPP_STACK_ROOT_URL, http://rc.host by
default.
EOF
}

log() {
	echo "==> $*"
}

down() {
	# the license is only read when containers are created
	ENTERPRISE_LICENSE="${ENTERPRISE_LICENSE:-unused}" "${COMPOSE[@]}" down -v --remove-orphans
	rm -rf "$CERTS_DIR"
}

TEST_ARGS=()
while [[ $# -gt 0 ]]; do
	case "$1" in
		--image-tag)
			IMAGE_TAG="${2:?--image-tag needs a tag}"
			shift 2
			;;
		--skip-build)
			SKIP_BUILD=true
			shift
			;;
		--no-test)
			RUN_TESTS=false
			KEEP_RUNNING=true
			shift
			;;
		--keep-running)
			KEEP_RUNNING=true
			shift
			;;
		--down)
			down
			exit 0
			;;
		-h | --help)
			usage
			exit 0
			;;
		--)
			shift
			TEST_ARGS=("$@")
			break
			;;
		*)
			echo "Unknown option: $1" >&2
			usage >&2
			exit 1
			;;
	esac
done

if [[ -z "${ENTERPRISE_LICENSE:-}" ]] && ! grep -qs '^ENTERPRISE_LICENSE=.' "$PACKAGE_ROOT/.env"; then
	echo "ENTERPRISE_LICENSE is not set; export it or add it to $PACKAGE_ROOT/.env (see .env.example)" >&2
	exit 1
fi

# The bundle carries only the host's platform packages; the image runs on linux-musl
add_musl_platform_packages() {
	local node_modules=$1 arch dir name version target dest
	case "$(docker info --format '{{.Architecture}}')" in
		aarch64 | arm64) arch=arm64 ;;
		*) arch=x64 ;;
	esac

	while IFS= read -r dir; do
		name="$(node -p "require('$dir/package.json').name")"
		version="$(node -p "require('$dir/package.json').version")"
		case "$name" in
			@img/sharp-libvips-*) target="@img/sharp-libvips-linuxmusl-$arch" ;;
			@img/sharp-*) target="@img/sharp-linuxmusl-$arch" ;;
			@napi-rs/pinyin-*) target="@napi-rs/pinyin-linux-$arch-musl" ;;
			@esbuild/*) target="@esbuild/linux-$arch" ;;
			*) continue ;;
		esac
		dest="$(dirname "$dir")/${target#*/}"
		if [[ ! -d "$dest" ]]; then
			log "Adding $target@$version next to $name"
			mkdir -p "$dest"
			curl -fsSL "$(npm view "$target@$version" dist.tarball)" | tar xz -C "$dest" --strip-components=1
		fi
	done < <(find "$node_modules" -type d \( -path '*/@img/sharp-*' -o -path '*/@napi-rs/pinyin-*' -o -path '*/@esbuild/*' \) -prune)
}

build_images() {
	local build_dir turbo_version filters=(--filter=@rocket.chat/meteor^...)
	build_dir="$(mktemp -d "${TMPDIR:-/tmp}/rc-xmpp-stack-XXXXXX")"
	export XMPP_STACK_BUILD_DIR="$build_dir" XMPP_STACK_REPO_ROOT="$REPO_ROOT"

	for service in "${SERVICES[@]}"; do
		filters+=("--filter=@rocket.chat/$service...")
	done
	log "Building workspace packages"
	(cd "$REPO_ROOT" && yarn turbo run build "${filters[@]}")

	log "Building the Meteor bundle"
	(cd "$REPO_ROOT/apps/meteor" && METEOR_DISABLE_OPTIMISTIC_CACHING=1 meteor build --server-only --directory "$build_dir/rocketchat")
	add_musl_platform_packages "$build_dir/rocketchat/bundle/programs/server/npm/node_modules"

	# Each service image builds from the pruned workspace closure, as CI does in .github/actions/build-docker
	turbo_version="$(node -p "require('$REPO_ROOT/package.json').devDependencies.turbo")"
	for service in "${SERVICES[@]}"; do
		log "Staging $service"
		(cd "$REPO_ROOT" && npx -y "turbo@$turbo_version" prune "@rocket.chat/$service" --skip-infer --use-gitignore=false --out-dir "$build_dir/$service" >/dev/null)
		find "$build_dir/$service" \( -name node_modules -o -name .turbo \) -type d -prune -exec rm -rf {} +
	done

	log "Building images"
	"${COMPOSE[@]}" build
	rm -rf "$build_dir"
}

wait_for() {
	local service=$1 url=$2 elapsed=0
	log "Waiting for $service at $url"
	until curl -fsS -o /dev/null "$url" 2>/dev/null; do
		if [[ -n "$("${COMPOSE[@]}" ps --status exited --quiet "$service")" ]]; then
			echo "$service exited" >&2
			return 1
		fi
		if ((elapsed >= MAX_WAIT_SECONDS)); then
			echo "$service did not answer within ${MAX_WAIT_SECONDS}s" >&2
			return 1
		fi
		sleep 5
		elapsed=$((elapsed + 5))
	done
}

finish() {
	local status=$?
	if ((status != 0)); then
		"${COMPOSE[@]}" logs --tail 100 rocketchat xmpp-server-service openfire || true
	fi
	if [[ "$KEEP_RUNNING" == true ]]; then
		log "Stack left running:"
		log "  Rocket.Chat          http://localhost:$XMPP_STACK_RC_PORT (rocketchat.internal.admin.test / rocketchat.internal.admin.test), XMPP domain rc.test"
		log "  xmpp-server-service  http://localhost:$XMPP_STACK_SERVICE_PORT/stats"
		log "  Openfire             xmpp://localhost:$XMPP_STACK_OPENFIRE_C2S_PORT, domain openfire.test; admin console http://localhost:$XMPP_STACK_OPENFIRE_ADMIN_PORT (admin / admin)"
		log "  CA certificate       $CERTS_DIR/ca.pem"
		log "Tear down with: $0 --down"
	else
		down
	fi
	exit "$status"
}

log "Removing any previous stack"
down

if [[ -n "$IMAGE_TAG" ]]; then
	export XMPP_STACK_REGISTRY=ghcr.io/rocketchat/rocket.chat XMPP_STACK_TAG="$IMAGE_TAG"
	log "Pulling images tagged $IMAGE_TAG"
	"${COMPOSE[@]}" pull rocketchat "${SERVICES[@]}"
elif [[ "$SKIP_BUILD" == false ]]; then
	build_images
fi

trap finish EXIT
log "Starting the stack"
"${COMPOSE[@]}" up -d --no-build

wait_for rocketchat "http://localhost:$XMPP_STACK_RC_PORT/api/info"
wait_for xmpp-server-service "http://localhost:$XMPP_STACK_SERVICE_PORT/health"
wait_for openfire "http://localhost:$XMPP_STACK_OPENFIRE_ADMIN_PORT/login.jsp"

if [[ "$RUN_TESTS" == true ]]; then
	log "Running the end-to-end suite"
	cd "$PACKAGE_ROOT"
	export NODE_EXTRA_CA_CERTS="$CERTS_DIR/ca.pem"
	export XMPP_E2E_XMPP_DOMAIN=openfire.test
	export XMPP_E2E_XMPP_SERVICE="xmpp://localhost:$XMPP_STACK_OPENFIRE_C2S_PORT"
	export XMPP_E2E_SERVICE_URL="http://localhost:$XMPP_STACK_SERVICE_PORT"
	export TEST_API_URL="http://localhost:$XMPP_STACK_RC_PORT"
	if [[ ${#TEST_ARGS[@]} -gt 0 ]]; then
		node --import tsx --test --test-concurrency=1 --test-force-exit "${TEST_ARGS[@]}"
	else
		yarn test:e2e
	fi
fi
