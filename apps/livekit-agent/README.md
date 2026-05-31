# Rocket.Chat LiveKit transcription agent

Long-running Node service that joins each Rocket.Chat group call as a hidden LiveKit participant, transcribes each speaker's microphone in real time via the **Gemini Live API** (Gemini 3 Flash Live), and broadcasts the transcripts back to the room over LK's data channel.

The Rocket.Chat client (`LiveKitMediaCallProvider`) listens for those `{type:"transcript",…}` messages and renders them as live captions on each speaker's tile — interim transcripts in italics, finals snap to full opacity.

Stateless, scales horizontally, deployed independently of Rocket.Chat.

## Why Gemini Live

Gemini Live uses a bidirectional websocket: we stream PCM in, transcripts come out incrementally as the model "hears" the speaker. End-to-end latency is typically 200–500 ms, similar to Deepgram / OpenAI Realtime. No chunking, no per-chunk RTT cost.

Free tier on AI Studio is generous enough for routine use; the model name is configurable via `GEMINI_LIVE_MODEL` so you can pin to a different variant (e.g. `gemini-2.5-flash-native-audio`).

## Requirements

- Node.js 20+
- LiveKit URL + API key/secret (the same ones Rocket.Chat uses)
- Free Gemini API key — <https://aistudio.google.com/apikey>

## Run locally

```sh
yarn install
cp .env.example .env  # fill the four required keys
yarn dev
```

The worker idles until LiveKit dispatches it into a room (which happens automatically when a group call starts).

## Run with Docker

```sh
docker build -t rc-livekit-agent .
docker run --rm \
  -e LIVEKIT_URL=wss://your-project.livekit.cloud \
  -e LIVEKIT_API_KEY=… \
  -e LIVEKIT_API_SECRET=… \
  -e GEMINI_API_KEY=… \
  rc-livekit-agent
```

## Environment

| var | required | default | notes |
| --- | --- | --- | --- |
| `LIVEKIT_URL` | yes | — | `wss://` for Cloud, your hostname for self-hosted |
| `LIVEKIT_API_KEY` | yes | — | matches Rocket.Chat's `VoIP_TeamCollab_LiveKit_Api_Key` |
| `LIVEKIT_API_SECRET` | yes | — | matches Rocket.Chat's `VoIP_TeamCollab_LiveKit_Api_Secret` |
| `GEMINI_API_KEY` | yes | — | from aistudio.google.com/apikey |
| `GEMINI_LIVE_MODEL` | no | `gemini-3-flash-live` | swap for `gemini-2.5-flash-native-audio` etc. if needed |
| `STT_LANGUAGE_HINT` | no | — | BCP-47 code (e.g. `pt-BR`); empty = auto-detect |
| `AGENT_IDENTITY` | no | `transcription-agent` | the participant identity the agent uses; Rocket.Chat hides this id from the participant list |

## How it works

1. Agent connects to a room with `autoSubscribe: AUDIO_ONLY`.
2. For each remote audio track, opens a **Gemini Live** websocket with `inputAudioTranscription` enabled. The session's system instruction tells the model "only transcribe, do not respond" so we never burn tokens on assistant replies.
3. LK's `AudioStream` is created with `sampleRate: 16000, numChannels: 1` — LK does the resampling for us; Gemini Live requires 16 kHz mono PCM.
4. Each PCM frame is base64-encoded and forwarded via `session.sendRealtimeInput({ audio: { data, mimeType: 'audio/pcm;rate=16000' } })`.
5. Gemini emits `serverContent.inputTranscription` events as the speaker talks. We surface each one as a `transcript` data message keyed by the speaker's participant identity, with `isFinal` reflecting whether the utterance has been finalised.
6. The Rocket.Chat client renders the text in a caption box above the speaker's tile (interim = lighter / italic, final = solid).

The agent identity (`AGENT_IDENTITY`) is filtered out of the participants list client-side, so users don't see an empty "transcription-agent" tile.

## Limitations

- **Per-session lifetime**: Gemini Live sessions have a maximum length (currently 10–15 min on the free tier; check the latest quota in AI Studio). The agent does not auto-reconnect mid-track yet — long calls will lose captions until the next track event. PRs welcome.
- **Concurrent sessions**: Free tier limits the number of concurrent Live sessions per project. A call with N speakers opens N sessions, so a 5-person call needs ≥5 concurrent slots. Paid tier raises this substantially.

## Switching the STT backend

Everything except `transcribeTrack` is room plumbing. To swap to another streaming STT (Deepgram, OpenAI Realtime, Speechmatics, faster-whisper) replace `openLiveSession` with the equivalent streaming client; the message shape published back to the room stays identical so the Rocket.Chat client doesn't change.
