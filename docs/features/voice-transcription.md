# Voice message transcription

Automatic speech-to-text for voice messages. When enabled, each new audio
attachment is marked `pending`, a `transcription` core service job runs the
configured engine, and the transcript is persisted on the attachment and
broadcast to connected clients.

## Engines

| Engine | Setting | Notes |
| --- | --- | --- |
| `whisper-cpp-server` (default) | `AI_Voice_Transcription_Whisper_Server_URL` | Local HTTP `whisper-server` (`POST /inference`). Serializes requests on a mutex — keep `AI_Voice_Transcription_Max_Concurrent_Jobs` at `1` per instance unless you put a load balancer in front of multiple whisper replicas. |
| `openai-compatible` | `AI_Voice_Transcription_OpenAI_*` | `POST {baseUrl}/audio/transcriptions` with a Bearer token. Uses dedicated CE settings rather than the EE-gated LLM keys. |

## Running whisper locally

Pick the path that matches your host.

### macOS (Apple Silicon or Intel) — native

The published `ghcr.io/ggml-org/whisper.cpp` image is linux/amd64 only, so on Apple
Silicon Docker Desktop runs it under Rosetta, where model initialization can hang
while the port is already bound. Run the native build instead:

```bash
development/whisper/run-native-macos.sh start     # build/install, download model, serve
development/whisper/run-native-macos.sh status
development/whisper/run-native-macos.sh test      # smoke test against samples/jfk.wav
development/whisper/run-native-macos.sh stop
```

The script is idempotent. It prefers an existing `whisper-server` on `PATH`, falls
back to `brew install whisper.cpp`, and only then clones and builds
`ggml-org/whisper.cpp` with CMake. Upstream sources, models, logs and pid files all
live under the cache directory — nothing is written into this repo. It passes
`--convert` whenever `ffmpeg` is present, which is what makes the recorder's mp3
acceptable, and detaches into its own session so the server survives the terminal
that started it.

| Variable | Default | Purpose |
| --- | --- | --- |
| `WHISPER_CPP_DIR` | `~/Library/Caches/whisper.cpp` | Cache root for models, source build, logs, pid files |
| `WHISPER_MODEL` | `ggml-base.bin` | Model file name (downloaded on first use) or absolute path |
| `WHISPER_HOST` | `127.0.0.1` | Bind address |
| `WHISPER_PORT` | `8080` | Bind port |
| `WHISPER_SERVER_BIN` | — | Explicit binary, skips discovery |
| `WHISPER_THREADS` | performance core count | Inference threads |

On an M1 Max with `ggml-base.bin`, whisper.cpp selects the Metal backend and
transcribes the 11-second `jfk.wav` sample in roughly 170 ms warm (~660 ms on the
first request, which includes graph warm-up).

### Linux — Docker sidecar

```bash
docker compose -f development/docker-compose-whisper.yml up
```

This starts:

1. A one-shot `whisper-models` container that downloads `ggml-base.bin` (override with `MODEL=…`) into a volume.
2. A `whisper` container from `ghcr.io/ggml-org/whisper.cpp:main` listening on `http://localhost:8080` with `--convert` so the mp3 produced by the recorder is accepted.

GPU variants are a one-line image swap, for example:

```bash
WHISPER_IMAGE=ghcr.io/ggml-org/whisper.cpp:main-cuda docker compose -f development/docker-compose-whisper.yml up
```

## Pointing Rocket.Chat at the server

Under **Administration → AI → Voice Transcription**, set
`AI_Voice_Transcription_Enabled` to `true` and `AI_Voice_Transcription_Engine` to
`whisper-cpp-server`. The correct URL depends on where Rocket.Chat itself runs:

| Rocket.Chat deployment | `AI_Voice_Transcription_Whisper_Server_URL` |
| --- | --- |
| Monolith on the host (`yarn dsv`) | `http://127.0.0.1:8080` |
| Rocket.Chat or the transcription service in Docker | `http://host.docker.internal:8080` |
| whisper as a compose sidecar on the same network | `http://whisper:8080` |

`localhost` inside a container is the container itself, so the Docker rows need
`host.docker.internal`, which resolves only when the service has a host-gateway
mapping. `docker-compose-local.yml` and `apps/meteor/ee/server/services/docker-compose.yml`
both declare `extra_hosts: ['host.docker.internal:host-gateway']` on
`transcription-service` for this reason.

The same can be applied over REST against a running dev server:

```bash
ADMIN=http://localhost:3000
# obtain X-Auth-Token / X-User-Id via /api/v1/login first
for kv in \
  'AI_Voice_Transcription_Enabled:true' \
  'AI_Voice_Transcription_Engine:"whisper-cpp-server"' \
  'AI_Voice_Transcription_Whisper_Server_URL:"http://127.0.0.1:8080"' \
  'SSRF_Allowlist:"127.0.0.1"'; do
  curl -sS -X POST "$ADMIN/api/v1/settings/${kv%%:*}" \
    -H "X-Auth-Token: $TOKEN" -H "X-User-Id: $USER_ID" \
    -H 'Content-Type: application/json' \
    -d "{\"value\": ${kv#*:}}"
done
```

## Settings

Under **Administration → AI → Voice Transcription**:

- `AI_Voice_Transcription_Enabled` (public) — master switch; also controls whether `sendFileMessage` writes the `pending` marker.
- Engine, provider URLs/keys, optional BCP-47 language (empty = auto-detect).
- Max file size (KB), timeout (seconds), max concurrent jobs.

User preference `showVoiceTranscriptions` (default `true`) hides the transcript UI without disabling the service.

## SSRF allowlist (required for local whisper)

The service fetches the engine URL through `@rocket.chat/server-fetch` with
`ignoreSsrfValidation: false`, so any host that resolves into a private range is
rejected before the request is made. Every local whisper setup is in a private
range, which means **`SSRF_Allowlist` must contain the whisper host or transcription
silently fails** with `error: 'engine-unreachable'` on the attachment.

Add the matching entry under **Administration → General → SSRF Allowlist**:

| Whisper server URL | `SSRF_Allowlist` entry |
| --- | --- |
| `http://127.0.0.1:8080` | `127.0.0.1` or `127.0.0.1:8080` |
| `http://host.docker.internal:8080` | `host.docker.internal` |
| `http://whisper:8080` | `whisper` |

Entries are newline- or comma-separated and match either the bare host or `host:port`.
Note that `localhost` resolves to `127.0.0.1`, so allowlist the resolved form.

## E2E rooms

Encrypted rooms and `t: 'e2e'` messages are skipped. No `pending` marker is
written and no job is enqueued — the ciphertext is never sent to an engine.
Client-side transcription for E2E rooms is a follow-up.

## Microservices mode

In monolith mode the `TranscriptionService` is registered in-process. In
microservices mode the standalone runner `ee/apps/transcription-service`
owns the service over the broker (the runner lives under `ee/apps` because
microservices deployment itself is EE; the feature code is community).

## Scaling

`whisper-server` processes one inference at a time. To scale throughput, run
N whisper replicas behind a load balancer and raise
`AI_Voice_Transcription_Max_Concurrent_Jobs` to match the replica count. Do
not raise concurrency against a single whisper process.
