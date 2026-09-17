#!/usr/bin/env bash
#
# Run whisper-server natively on macOS (Apple Silicon or Intel) for local voice
# message transcription, as an alternative to development/docker-compose-whisper.yml.
#
# Docker Desktop on Apple Silicon runs the linux/amd64 whisper.cpp image under
# Rosetta, where model initialization can hang while the port is already bound.
# Running the native Metal/Accelerate build avoids the emulation layer entirely.
#
# Usage:
#   development/whisper/run-native-macos.sh [start|stop|restart|status|logs|test]
#
# Environment:
#   WHISPER_CPP_DIR    cache root for models, logs and a source build
#                      (default: ~/Library/Caches/whisper.cpp)
#   WHISPER_MODEL      model file name or absolute path (default: ggml-base.bin)
#   WHISPER_HOST       bind address (default: 127.0.0.1)
#   WHISPER_PORT       bind port (default: 8080)
#   WHISPER_SERVER_BIN explicit whisper-server binary, skips discovery
#   WHISPER_THREADS    inference threads (default: physical core count)

set -euo pipefail

WHISPER_CPP_DIR="${WHISPER_CPP_DIR:-${HOME}/Library/Caches/whisper.cpp}"
WHISPER_MODEL="${WHISPER_MODEL:-ggml-base.bin}"
WHISPER_HOST="${WHISPER_HOST:-127.0.0.1}"
WHISPER_PORT="${WHISPER_PORT:-8080}"
WHISPER_THREADS="${WHISPER_THREADS:-$(sysctl -n hw.perflevel0.physicalcpu 2>/dev/null || sysctl -n hw.physicalcpu)}"

MODELS_DIR="${WHISPER_CPP_DIR}/models"
RUN_DIR="${WHISPER_CPP_DIR}/run"
SRC_DIR="${WHISPER_CPP_DIR}/src"
PID_FILE="${RUN_DIR}/whisper-server-${WHISPER_PORT}.pid"
LOG_FILE="${RUN_DIR}/whisper-server-${WHISPER_PORT}.log"
BASE_URL="http://${WHISPER_HOST}:${WHISPER_PORT}"

MODEL_BASE_URL='https://huggingface.co/ggerganov/whisper.cpp/resolve/main'
WHISPER_CPP_REPO='https://github.com/ggml-org/whisper.cpp.git'

log() { printf '[whisper] %s\n' "$*" >&2; }
die() { printf '[whisper] error: %s\n' "$*" >&2; exit 1; }

# Resolve a whisper-server binary, building from source only when nothing else exists.
resolve_server_bin() {
	if [[ -n "${WHISPER_SERVER_BIN:-}" ]]; then
		[[ -x "${WHISPER_SERVER_BIN}" ]] || die "WHISPER_SERVER_BIN is not executable: ${WHISPER_SERVER_BIN}"
		printf '%s' "${WHISPER_SERVER_BIN}"
		return
	fi

	local found
	if found="$(command -v whisper-server 2>/dev/null)"; then
		printf '%s' "${found}"
		return
	fi

	if command -v brew >/dev/null 2>&1; then
		log 'installing whisper.cpp via Homebrew'
		brew install whisper.cpp >&2
		if found="$(command -v whisper-server 2>/dev/null)"; then
			printf '%s' "${found}"
			return
		fi
	fi

	build_from_source
}

build_from_source() {
	local built="${SRC_DIR}/build/bin/whisper-server"
	if [[ -x "${built}" ]]; then
		printf '%s' "${built}"
		return
	fi

	command -v cmake >/dev/null 2>&1 || die 'cmake is required to build whisper.cpp (brew install cmake)'
	command -v git >/dev/null 2>&1 || die 'git is required to clone whisper.cpp'

	if [[ ! -d "${SRC_DIR}/.git" ]]; then
		log "cloning whisper.cpp into ${SRC_DIR}"
		mkdir -p "$(dirname "${SRC_DIR}")"
		git clone --depth 1 "${WHISPER_CPP_REPO}" "${SRC_DIR}" >&2
	fi

	log 'building whisper-server (Metal + Accelerate)'
	cmake -S "${SRC_DIR}" -B "${SRC_DIR}/build" -DCMAKE_BUILD_TYPE=Release -DWHISPER_BUILD_SERVER=ON >&2
	cmake --build "${SRC_DIR}/build" --config Release --target whisper-server -j "$(sysctl -n hw.ncpu)" >&2

	[[ -x "${built}" ]] || die "build finished but ${built} is missing"
	printf '%s' "${built}"
}

# Absolute model path, downloading the ggml weights on first use.
resolve_model() {
	local model_path="${WHISPER_MODEL}"
	[[ "${model_path}" = /* ]] || model_path="${MODELS_DIR}/${WHISPER_MODEL}"

	if [[ ! -s "${model_path}" ]]; then
		[[ "${WHISPER_MODEL}" = /* ]] && die "model not found: ${model_path}"
		mkdir -p "${MODELS_DIR}"
		log "downloading ${WHISPER_MODEL} (this happens once)"
		curl -fL --retry 3 --retry-delay 2 --progress-bar \
			-o "${model_path}.part" "${MODEL_BASE_URL}/${WHISPER_MODEL}" >&2
		mv "${model_path}.part" "${model_path}"
	fi

	printf '%s' "${model_path}"
}

# Detach into a new session so the server survives the caller's terminal or
# process group being torn down. macOS ships no setsid(1), but perl exposes it.
session_launcher() {
	if command -v setsid >/dev/null 2>&1; then
		printf '%s' 'setsid'
	elif command -v perl >/dev/null 2>&1; then
		printf '%s' 'perl'
	else
		printf '%s' 'none'
	fi
}

server_pid() {
	[[ -s "${PID_FILE}" ]] || return 1
	local pid
	pid="$(cat "${PID_FILE}")"
	[[ "${pid}" =~ ^[0-9]+$ ]] || return 1
	kill -0 "${pid}" 2>/dev/null || return 1
	printf '%s' "${pid}"
}

wait_until_ready() {
	local pid="$1" attempt
	for attempt in $(seq 1 120); do
		kill -0 "${pid}" 2>/dev/null || die "whisper-server exited during startup, see ${LOG_FILE}"
		if curl -fsS -o /dev/null --max-time 2 "${BASE_URL}/" 2>/dev/null; then
			log "ready after ~${attempt}s"
			return 0
		fi
		sleep 1
	done
	die "whisper-server did not become ready within 120s, see ${LOG_FILE}"
}

cmd_start() {
	local pid
	if pid="$(server_pid)"; then
		log "already running (pid ${pid}) on ${BASE_URL}"
		return 0
	fi

	local bin model
	bin="$(resolve_server_bin)"
	model="$(resolve_model)"
	mkdir -p "${RUN_DIR}"

	local convert=()
	if command -v ffmpeg >/dev/null 2>&1; then
		# --convert makes whisper-server accept the mp3/ogg the recorder produces.
		convert=(--convert --tmp-dir "${RUN_DIR}")
	else
		log 'ffmpeg not found; starting without --convert (16kHz WAV input only)'
	fi

	log "binary   ${bin} ($(file -b "${bin}" 2>/dev/null || echo unknown))"
	log "model    ${model}"
	log "endpoint ${BASE_URL}/inference"

	local server_cmd=(
		"${bin}"
		--host "${WHISPER_HOST}"
		--port "${WHISPER_PORT}"
		--model "${model}"
		--threads "${WHISPER_THREADS}"
		--language auto
		"${convert[@]}"
	)

	case "$(session_launcher)" in
		setsid) nohup setsid "${server_cmd[@]}" </dev/null >>"${LOG_FILE}" 2>&1 & ;;
		perl) nohup perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV or die $!' -- "${server_cmd[@]}" </dev/null >>"${LOG_FILE}" 2>&1 & ;;
		*)
			log 'no setsid/perl available; the server will not survive a terminal close'
			nohup "${server_cmd[@]}" </dev/null >>"${LOG_FILE}" 2>&1 &
			;;
	esac
	pid=$!
	disown "${pid}" 2>/dev/null || true
	printf '%s' "${pid}" >"${PID_FILE}"

	wait_until_ready "${pid}"
	log "started pid ${pid} | log ${LOG_FILE}"
	log "stop with: ${BASH_SOURCE[0]} stop"
}

cmd_stop() {
	local pid
	if ! pid="$(server_pid)"; then
		rm -f "${PID_FILE}"
		log 'not running'
		return 0
	fi

	kill "${pid}" 2>/dev/null || true
	local attempt
	for attempt in $(seq 1 15); do
		kill -0 "${pid}" 2>/dev/null || break
		sleep 1
	done
	kill -0 "${pid}" 2>/dev/null && kill -9 "${pid}" 2>/dev/null || true
	rm -f "${PID_FILE}"
	log "stopped pid ${pid}"
}

cmd_status() {
	local pid
	if pid="$(server_pid)"; then
		log "running pid ${pid} on ${BASE_URL} | log ${LOG_FILE}"
		ps -o pid,%cpu,rss,etime,comm -p "${pid}" >&2
	else
		log 'not running'
		return 1
	fi
}

cmd_logs() {
	[[ -f "${LOG_FILE}" ]] || die "no log file at ${LOG_FILE}"
	tail -f "${LOG_FILE}"
}

# Smoke test against the bundled JFK sample.
cmd_test() {
	local sample="${WHISPER_CPP_DIR}/samples/jfk.wav"
	if [[ ! -s "${sample}" ]]; then
		mkdir -p "$(dirname "${sample}")"
		curl -fL --retry 3 -o "${sample}" \
			'https://raw.githubusercontent.com/ggml-org/whisper.cpp/master/samples/jfk.wav' >&2
	fi
	curl -fsS "${BASE_URL}/inference" \
		-F "file=@${sample}" \
		-F 'response_format=json' \
		-F 'temperature=0'
	printf '\n'
}

case "${1:-start}" in
	start) cmd_start ;;
	stop) cmd_stop ;;
	restart)
		cmd_stop
		cmd_start
		;;
	status) cmd_status ;;
	logs) cmd_logs ;;
	test) cmd_test ;;
	*) die "unknown command: $1 (expected start|stop|restart|status|logs|test)" ;;
esac
