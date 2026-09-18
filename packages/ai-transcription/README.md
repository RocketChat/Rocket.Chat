# @rocket.chat/ai-transcription

Pluggable speech-to-text engines for voice message transcription.

This package keeps transcription provider calls and response normalization
outside of the Rocket.Chat services. It is intentionally framework-light:
callers inject configuration, logger and `fetch`, which makes the code usable
from the monolith or from a standalone service process.

Current responsibilities:

- `whisper-cpp-server` engine: multipart upload to a local `whisper-server`
  `/inference` endpoint.
- `openai-compatible` engine: multipart upload to `/audio/transcriptions`.
- Engine factory from a plain configuration object.
- Typed errors carrying the machine codes persisted on the attachment.

Engines do not retry and do not cap concurrency; `whisper-server` serializes
requests on a mutex, so the caller is responsible for limiting parallel jobs.
