# LiveKit group calls, recording, and live captions

Branch: `feat/vc-poc` (base: `develop`).

LiveKit ships as a **native provider of the Video Conference feature** — not as a parallel "VoIP TeamCollab" thing. The room-sidebar camera button starts a LiveKit-backed call exactly the way it starts a Jitsi/Google Meet call today; the only difference is the embedded provider returns control to a React context that owns the LK session.

This doc covers the three product slices that live on top of that integration:

1. **LiveKit group calls.** Channel-scoped multi-party calls routed through a LiveKit SFU. Grid + spotlight, screen sharing, hand-raise / reactions, floating widget when navigating away from the call's room.
2. **Cloud recording.** Egress-based room composite recording. The output file is registered as a standard `Uploads` document and posted as a **thread reply** under the call's "call ongoing" block message.
3. **Live captions, persisted transcripts, and AI summary.** A worker subprocess inside Meteor joins each room as a hidden participant, transcribes each speaker through Gemini Live, and broadcasts captions on the LK data channel. Captions are opt-in per user; take-notes additionally persists final transcripts; on call end, an AI summary plus a raw transcript `.md` file are posted as thread replies under the same parent.

---

## 1. Deployment topology

```
┌────────────────────────────────────────────────────────────────────┐
│ Rocket.Chat monolith (Meteor)                                      │
│                                                                    │
│   ┌──────────────────────────┐   ┌─────────────────────────────┐   │
│   │ Video Conference service │   │ ee/server/lib/livekit/*     │   │
│   │   (existing)             │   │   config / token / egress   │   │
│   │   + LiveKit provider     │◀──│   recording (poll+finalize) │   │
│   │     (embedded)           │   │   roomService / cleanup     │   │
│   └──────────────────────────┘   └─────────────────────────────┘   │
│                                                                    │
│   ┌──────────────────────────┐   ┌─────────────────────────────┐   │
│   │ REST                     │   │ ee/server/lib/livekit-agent │   │
│   │   /transport.config      │   │   supervisor.ts             │   │
│   │   /recording.*           │   │     ↓ child_process.spawn   │   │
│   │   /transcription.*       │   │   summary.ts (Gemini)       │   │
│   │   /transcript.append     │   └──────────────┬──────────────┘   │
│   │   /leave                 │                  │                  │
│   └──────────────────────────┘                  │                  │
│                                                 ▼                  │
│   ┌──────────────────────────┐   ┌─────────────────────────────┐   │
│   │ Client (React)           │   │ private/livekit-agent/      │   │
│   │   VideoConfButton →      │   │   worker.mjs (subprocess)   │   │
│   │   VideoConfManager →     │   │     @livekit/agents         │   │
│   │   LiveKitVideoConf       │   │     @livekit/rtc-node       │   │
│   │     Context              │   │     @google/genai           │   │
│   └──────────────────────────┘   └─────────────────────────────┘   │
└─────────┬──────────────────────────────────────────────────┬───────┘
          │ Twirp HTTPS (RoomService, Egress)                │
          │ HS256 JWT                                        │ wss
          ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ LiveKit (Cloud or self-hosted)                                     │
│   - SFU media routing                                              │
│   - Egress workers (room composite -> S3)                          │
│   - Auto-dispatch -> any registered agent worker                   │
└────────────────────────────────────────────────────────────────────┘
```

Deployables beyond the Meteor monolith:

- **LiveKit** — Cloud or self-hosted. The same instance handles SFU + Egress + agent dispatch. A turnkey self-hosted setup is provided at `deploy/livekit/` (CloudFormation + bootstrap; see §11).
- **S3 bucket** — must be the same bucket Rocket.Chat's `FileUpload` is configured against, so the recorded file lands in a path the existing file-serving pipeline already knows how to read.

The transcription worker is **not a separate service** — it runs as a child process of Meteor, managed by the supervisor. The old `apps/livekit-agent/` workspace was removed.

---

## 2. Settings

All settings live in `apps/meteor/ee/server/settings/video-conference.ts`, under the `Video_Conference` group, `VideoConf_LiveKit` subsection.

### Core

| Setting | Type | Default | Purpose |
|---|---|---|---|
| `VideoConf_LiveKit_Enabled` | boolean | `false` | Master toggle. Gates the embedded provider registration. |
| `VideoConf_LiveKit_Mode` | select | `self_hosted` | Doc hint (`self_hosted` / `cloud`). No runtime effect. |
| `VideoConf_LiveKit_Url` | string | — | Full `wss://` URL the client connects to. |
| `VideoConf_LiveKit_Api_Key` | string (secret) | — | LK API key. Mints participant tokens + Twirp calls. |
| `VideoConf_LiveKit_Api_Secret` | password | — | Paired with the key. |

### Recording

| Setting | Type | Default | Purpose |
|---|---|---|---|
| `VideoConf_LiveKit_Recording_Enabled` | boolean | `false` | Gates the recording button + APIs. |
| `VideoConf_LiveKit_Recording_Storage` | select | `s3` | `local`, `s3`, `filestore`, or `both`. |
| `VideoConf_LiveKit_Recording_Local_Path` | string | `/out` | When storage is `local`, where egress writes. |
| `VideoConf_LiveKit_Recording_S3_Access_Key` | string (secret) | — | Dedicated S3 credentials for LK Egress. **Deliberately separate** from `FileUpload_S3_*`. |
| `VideoConf_LiveKit_Recording_S3_Secret_Key` | password | — | Paired. |

The bucket / region / endpoint come from `FileUpload_S3_*` — recording lands in the same bucket as user uploads, then is registered as an `Uploads` doc.

### Agent (transcription worker)

| Setting | Type | Default | Purpose |
|---|---|---|---|
| `VideoConf_LiveKit_Agent_Mode` | select | `off` | `off` (no worker) or `embedded` (supervisor spawns the worker subprocess). |
| `VideoConf_LiveKit_Agent_Gemini_Api_Key` | password (secret) | — | Worker uses this for the Gemini Live API. Free tier sufficient for evaluation. |
| `VideoConf_LiveKit_Agent_Gemini_Model` | string | `gemini-3.1-flash-live-preview` | Override per project access. |
| `VideoConf_LiveKit_Agent_Language_Hint` | string | — | BCP-47 fallback (e.g. `pt-BR`). Per-call picker overrides this. |
| `VideoConf_LiveKit_Summary_Enabled` | boolean | `false` | When true, generate an AI summary at end-of-call. |
| `VideoConf_LiveKit_Summary_Gemini_Model` | string | `gemini-2.5-flash` | Model used for summarization. |

The supervisor at `apps/meteor/ee/server/lib/livekit-agent/supervisor.ts` materializes these settings into env vars for the worker subprocess on each spawn. There is no longer a separate `.env` file to maintain.

---

## 3. Data model

The LK feature persists state on the existing **`VideoConference`** collection (`packages/models/src/models/VideoConference.ts`, `packages/core-typings/src/IVideoConference.ts`). The discriminator is `providerName === 'livekit'`.

Fields the LK flow uses:

| Field | Purpose |
|---|---|
| `providerName` | `'livekit'` for our calls. |
| `type` | `'direct'` / `'videoconference'` / `'livechat'` (existing field, untouched). |
| `status` | `CALLING` / `STARTED` / `EXPIRED` / `ENDED` / `DECLINED`. |
| `rid` | Room the call belongs to. Drives "active call in room" lookup. |
| `participants[]` | Per-participant join/leave tracking: `{ identity, joinedAt, leftAt? }`. |
| `messages.started` | ID of the "call ongoing" block message. **All recording/summary/transcript thread replies use this as `tmid`.** |
| `recording` | `{ egressId, startedAt, endedAt?, storage, uploadId?, filename?, messageSent? }`. `messageSent` guards against double-post on restart-resumed pollers. |
| `transcription` | `{ enabled, startedAt?, startedBy?, endedAt? }`. Gates `transcript[]` writes. |
| `transcript[]` | `[{ participantId, text, startedAt, endedAt? }]`. Populated by the worker via `POST /transcript.append`. |
| `summary` | `{ generatedAt, messageId?, transcriptMessageId? }`. Set by `summary.ts` after end-of-call processing. |

Notes:
- The legacy `IMediaCall` model (with `kind: 'direct'\|'group'` and `service: 'webrtc'\|'livekit'` discriminators) still exists for legacy P2P calls but **is not used by the LK path** anymore.
- Existing `isDirectVideoConference()` / `isGroupVideoConference()` type guards work as-is — LK calls are just one provider among many to `VideoConferenceModel`.

---

## 4. Provider invocation flow

LK is wired in as an **embedded** Video Conference provider — the same shape the built-in "free" Jitsi provider uses, except its UI lives in the Meteor client instead of a popup.

```
User clicks camera button on room sidebar
   │
   ▼
VideoConfButton (packages/ui-video-conf/src/VideoConfButton/VideoConfButton.tsx)
   │
   ▼
VideoConfManager.startCall(rid)          ← apps/meteor/client/lib/VideoConfManager.ts
   │   • mints a VideoConference doc with providerName='livekit'
   │   • returns { url: '', callId, rid } — empty url signals embedded
   │
   ▼ emits 'call/joinEmbedded' { callId, rid, providerName, preferences }
   │
   ▼
VideoConfProvider                         ← apps/meteor/client/providers/VideoConfProvider.tsx
   │   subscribes to the event, dispatches to the matching context
   │
   ▼
useLiveKitVideoConf().joinCall({ callId, rid, preferences })
   │   ← apps/meteor/client/views/videoConference/livekit/LiveKitVideoConfContext.tsx
   │
   ▼
Fetches /transport.config → mounts <LiveKitRoom> in a portal
```

Two interface bits make this work:

- **`IVideoConfProvider.capabilities.embedded: boolean`** (`packages/core-typings/src/VideoConferenceCapabilities.ts`). The LK provider sets this to `true`; the embedded code path looks for it.
- **`VideoConfService.validateProvider`** was gated to skip the apps-engine validation pass when the provider declares `embedded: true` — built-in embedded providers don't go through the apps-engine handshake.

The result: zero new UI surface in the room header. Users start LK calls the same way they start any other VC.

---

## 5. Server-side architecture

### `apps/meteor/ee/server/lib/livekit/`

Self-contained module for everything that talks to LK or AWS. Files largely unchanged from the original implementation, just consumed by the VideoConf integration instead of the old MediaCalls path.

- **`config.ts`** — `getLiveKitConfig()` reads all `VideoConf_LiveKit_*` settings; `isLiveKitFullyConfigured()` validates them. Cached per setting-change tick.
- **`token.ts`** — `createLiveKitAccessToken({ identity, roomName, ttl })` for client participants; `createLiveKitApiToken()` for server→LK admin calls. Both use `signHS256` from `@rocket.chat/jwt`.
- **`roomService.ts`** — `countRoomParticipants(roomName)` via LK's Twirp `ListParticipants`. Returns -1 on error (conservatively "still active") so we never aggressively clean up a real call because of a transient API blip.
- **`egress.ts`** — `startRoomCompositeEgress(roomName, { filepath, layout })`, `stopEgress(egressId)`, `listEgress(egressId)`. `filepath` includes `.mp4` explicitly because LK auto-appends a default extension that would otherwise diverge from the upload key we registered.
- **`mediaCallRecording.ts`** — orchestration. `startMediaCallRecording(callId, userId)`: pre-allocates an `uploadId` (UUID), computes the S3 key matching the FileUpload convention (`<workspaceId>/uploads/<rid>/<userId>/<uploadId>.mp4`), starts egress with that as the `filepath`, writes `recording: { egressId, uploadId, ... }` onto the `VideoConference` doc, schedules the poller.
- **`recordingPoller.ts`** — in-memory map of active polls. Each poll calls `listEgress(egressId)` every 10s, up to 4h. On terminal status, invokes `finalizeRecordingFromEgress`. `resumeActiveRecordingPollers()` runs at server boot and re-spawns polls for any `VideoConference` doc with `recording.egressId` set and `recording.messageSent` unset.
- **`finalizeRecording.ts`** — idempotent finaliser. Inserts an `Uploads` doc with the pre-allocated `_id` and `AmazonS3.path = uploadKey`, then calls `sendFileMessage(rid, uploadDoc, { tmid: messages.started })` to **post as a thread reply** under the "call ongoing" block message. Marks `recording.messageSent = true` to guard against double-post.
- **`cleanup.ts`** — registers a 1-minute cron that asks LK for each active call's participant count and ends calls with 0 LK participants older than 60s. Safety net for crashed-tab cases the `/leave` endpoint doesn't catch.

### `apps/meteor/ee/server/lib/livekit-agent/`

New module that owns the worker process and end-of-call summary generation.

- **`supervisor.ts`** — Watches `VideoConf_LiveKit_Agent_Mode`. When `embedded`:
  - Resolves `worker.mjs` location (handles dev tree, built bundle, and packaged-assets paths).
  - Symlinks the worker dir's `node_modules` → `programs/server/npm/node_modules/` so the worker's ESM imports of `@livekit/agents` etc. resolve inside the Meteor bundle. (Necessary because `private/` files are copied without dep tracing.)
  - Mints env from settings (LIVEKIT_URL/KEY/SECRET, GEMINI_API_KEY/MODEL, STT_LANGUAGE_HINT, ROOM_NAME_PREFIX, METEOR_BASE_URL, METEOR_SHARED_SECRET).
  - `child_process.spawn(node, [workerPath, 'start'], { env })`. Streams stdout/stderr to the system logger with a `[livekit-agent:<pid>]` prefix.
  - Exponential-backoff respawn on crash (1s → 30s cap), considered "stable" after STABLE_RUN_MS uptime (resets backoff).
  - **dlopen-failure detection**: if stderr contains `ERR_DLOPEN_FAILED` or `Cannot find native binding`, stops respawning — that's a binding/musl issue, not a transient crash. See §7 for the Alpine FFI build that fixes this in production.
- **`summary.ts`** — End-of-call processing. When the call ends with non-empty `transcript[]` and `Summary_Enabled`:
  - Calls Gemini (`Summary_Gemini_Model`) to generate a summary + action items.
  - Posts the summary as a thread reply under `messages.started`.
  - Uploads the raw transcript as a `.md` file (UTF-8 BOM + `Content-Type: text/markdown; charset=utf-8` to fix Latin-script mojibake) and posts it as another thread reply.
  - Persists `summary.messageId` and `summary.transcriptMessageId` on the `VideoConference` doc.

### REST APIs

All endpoints live in `apps/meteor/ee/server/api/videoConferenceLiveKit.ts`. All authorise the caller as a member of the room and rate-limit per user.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/video-conference.livekit.transport.config?callId=…` | Returns `{ serverUrl, token, roomName }` for the client. |
| `POST` | `/v1/video-conference.livekit.leave` | Marks the user left. Supports `keepalive` for `beforeunload`. |
| `POST` | `/v1/video-conference.livekit.recording.start` | Starts egress + persists state + schedules poller. |
| `POST` | `/v1/video-conference.livekit.recording.stop` | Calls `stopEgress`; poller continues until LK reports terminal. |
| `GET` | `/v1/video-conference.livekit.recording.status?callId=…` | UI polling. |
| `POST` | `/v1/video-conference.livekit.transcription.start` | Enables take-notes (`transcription.enabled = true`). Also publishes `transcription-state: true` on LK data channel so the worker enables persistence. |
| `POST` | `/v1/video-conference.livekit.transcription.stop` | Disables take-notes. |
| `GET` | `/v1/video-conference.livekit.transcription.status?callId=…` | UI polling. |
| `POST` | `/v1/video-conference.livekit.transcript.append` | Worker POSTs final transcripts here. Bearer auth: `lkagent:<API_SECRET>`. |

---

## 6. Client-side architecture

### Provider tree

```
VideoConfManager (singleton, apps/meteor/client/lib/VideoConfManager.ts)
   │   emits 'call/joinEmbedded'
   ▼
VideoConfProvider (apps/meteor/client/providers/VideoConfProvider.tsx)
   │   subscribes; routes to per-provider context
   ▼
LiveKitVideoConfProvider
   └─ exposes LiveKitVideoConfContext
        (apps/meteor/client/views/videoConference/livekit/LiveKitVideoConfContext.tsx)
        useLiveKitVideoConf() → { activeCall, joinCall, leaveCall }
```

`LiveKitVideoConfProvider` mounts a hidden `<LiveKitRoom>` via `createPortal` to a sibling DOM node, so the LK connection persists across React route changes — navigating between channels does not disconnect the call.

Inside `<LiveKitRoom>`, an inner provider reads LK hooks (`useParticipants`, `useTracks`, `useLocalParticipant`) and pushes the computed value into `MediaCallViewContext` (shared with the legacy P2P UI). `MediaCallRoomSection` consumes that context unchanged.

### Data-channel messages

All inter-client and worker↔client comms ride the LK data channel. Current message types:

| Type | Direction | Reliable? | Purpose |
|---|---|---|---|
| `hand` | client ↔ all | yes | `{ raised, raisedAt }`. Hand-raise aggregation. |
| `reaction` | client ↔ all | no | `{ emoji, reactionId? }`. Floating reactions. 3.5s TTL on receivers. |
| `transcript` | worker → all | no | `{ participantId, text, isFinal, ts }`. Live captions. |
| `captions-request` | client ↔ all + worker | yes | `{ requested: boolean }`. Per-user opt-in. Worker ref-counts active requesters. |
| `transcription-state` | server → all + worker | yes | `{ enabled: boolean }`. Take-notes gate. Worker enables persistence path when true. |
| `call-language` | client → all + worker | yes | `{ code, label }`. Picker broadcast. Worker restarts active Gemini sessions on change. |
| `recording-state` | server → all | yes | `{ recording: boolean }`. Drives UI badges. |

### UI surfaces (`packages/ui-voip/src/views/MediaCallRoomSection/`)

- **Caption pill** — per-user toggle. Publishes `captions-request`. When at least one user has it on (or take-notes is on), the worker transcribes; otherwise it idles.
- **Language pill** — `🌐 <lang>` next to the captions pill. Click → 10-language popover (`packages/ui-voip/src/utils/callLanguages.ts`: 10 BCP-47 entries, US English default, Brazilian Portuguese included). Click publishes `call-language`.
- **Take-notes / recording pills** — call `/transcription.start` and `/recording.start` respectively.
- **Reactions popover** — stays open for multiple clicks; outside-click to dismiss.
- **Hand-raise** — auto-lowers after 3s of continuous speech (driven by `useAudioLevel`).

Agent participants are filtered out of the participants grid by a three-pronged check (kind + identity prefix + agent-job-ID pattern) — `useParticipants()` doesn't always re-emit when only `kind` flips.

Camera tiles fall back to the avatar when `track.enabled && !track.muted && track.readyState === 'live'` is false (`useStreamHasLiveVideo` hook). For remote LK tracks, also check `publication.isMuted`.

---

## 7. The transcription worker

`apps/meteor/private/livekit-agent/worker.mjs` — pure ESM, Node 22. Spawned by the supervisor (§5) as a child process. `private/` is treated as static assets by Meteor's bundler (not crawled for deps), which is why the supervisor symlinks `node_modules`.

### Behavior

1. **Boot diagnostics.** First log message reports node version, arch, resolved `@livekit/rtc-node` path, and the list of `.node` files in `@livekit/rtc-ffi-bindings/`. Tells you in one line which binding got dlopen'd.
2. **Registers with LK as an unnamed worker** (`WorkerOptions` without `agentName`) — opts into auto-dispatch, so LK assigns one job per room to one worker. With N workers, jobs balance across them automatically.
3. **`ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY)`** in `entry`. Note the positional args (the SDK fails with "encryption_type required field not set" if you pass them as an options object).
4. **Handler registration is done BEFORE `ctx.connect`** so we don't miss `trackPublished` events fired during the join handshake.
5. **Manual subscribe on `trackPublished`.** `@livekit/agents` `AutoSubscribe.AUDIO_ONLY` only subscribes to tracks that exist at connect time — tracks published after the agent joins are announced but never subscribed. We explicitly call `publication.setSubscribed(true)` for audio in the `trackPublished` handler.
6. **Captions gating.** Two independent signals open the transcription path:
   - `captions-request` — per-user, ref-counted by identity in a `Set`.
   - `transcription-state` — single boolean (take-notes on/off).
   While either is non-empty, the worker opens a Gemini Live session per subscribed audio track. When both go to empty, sessions close.
7. **Gemini Live session per speaker.** `responseModalities: [Modality.AUDIO]` (native-audio model rejects `TEXT`), `inputAudioTranscription: {}`, tight `silenceDurationMs: 600` for more frequent finals, `systemInstruction` includes the current language label so output is in the right script.
8. **PCM pump.** `AudioStream(track, { sampleRate: 16000, numChannels: 1 })` per track. LK does the resampling.
9. **Transcript publishing.** Each interim/final fires `{ type: 'transcript', participantId, text, isFinal, ts }` on the LK data channel.
10. **Persistence.** On `isFinal` and only when `transcription-state` is enabled, POSTs to `/transcript.append` with bearer `lkagent:<API_SECRET>`.
11. **Language change.** When `call-language` arrives with a new label, the worker closes all active Gemini sessions and re-opens them with the new `systemInstruction`. ~1 round-trip gap, acceptable for a deliberate user action.

### Alpine deployment: musl FFI binding from source

`@livekit/rtc-ffi-bindings` only publishes glibc binaries on npm. The prod image is Alpine (musl), so we **build the binding from source** in a multi-stage Dockerfile.

`apps/meteor/.docker/Dockerfile.alpine` has a `lk-ffi-build` stage that:
- Clones `livekit/rust-sdks` at the pinned `LK_FFI_VER` with `--recurse-submodules` (so `yuv-sys/libyuv` is populated).
- Installs the cargo build deps on Alpine (`build-base`, `protobuf-dev`, `clang17-libclang`, `openssl-dev`, `glib-dev`, `dbus-dev`, …).
- Inlines three **fortify-source stub** symbols (`__memcpy_chk`, `__vsnprintf_chk`, `__fdelt_chk`) — LK's prebuilt `libwebrtc.a` is glibc-compiled and imports these, but musl doesn't ship them. The stubs are trivial pass-through wrappers compiled into a `.o` and linked via `RUSTFLAGS="-C link-arg=…"`.
- `cargo build --release` with `target-feature=-crt-static` (Alpine's rustc defaults to static-CRT which is illegal for cdylib).
- Copies the produced `librtc_node_ffi_bindings.so` as `rtc-node.linux-<x64|arm64>-musl.node` into `@livekit/rtc-ffi-bindings/` in the final image. The NAPI loader's first lookup matches this filename so the binding loads without any platform-specific sibling package.

Runtime image installs `glib` + `libstdc++` — the only dynamic deps the built binding has beyond bare musl.

---

## 8. Runtime flows

### Starting a call

1. User clicks the camera button on the room sidebar.
2. `VideoConfButton` → `VideoConfManager.startCall(rid)` — mints a `VideoConference` doc with `providerName: 'livekit'` and returns `{ url: '', callId, rid }`. Empty `url` signals embedded.
3. `VideoConfManager` emits `'call/joinEmbedded'` with `{ callId, rid, providerName, preferences }` (preferences = mic/cam state from preflight).
4. `VideoConfProvider` routes to `useLiveKitVideoConf().joinCall(...)`.
5. `LiveKitVideoConfContext` fetches `/transport.config`, mounts `<LiveKitRoom>` in the portal with `initialAudioEnabled` / `initialVideoEnabled` from preferences.
6. LK connects, agent worker is auto-dispatched.

### Captions (opt-in, ephemeral)

1. User clicks the caption pill → client publishes `{ type: 'captions-request', requested: true }` on the data channel.
2. Worker receives it, adds the user's identity to its requester set. If this was the first requester, the worker opens Gemini Live sessions for each currently-subscribed audio track.
3. Gemini emits `inputTranscription` events (interim + final).
4. Worker publishes `{ type: 'transcript', participantId, text, isFinal, ts }` on the data channel.
5. Every client's `LiveKitVideoConfContext` updates `activeCaptions[speakerId]`. `CallTile` reveals the text via `useProgressiveText` (~80 char/sec).
6. Other users' captions stay independent — opting out only stops the worker if you were the last requester.

### Take-notes (persisted transcription)

1. User clicks take-notes → client `POST /transcription.start`.
2. Server sets `VideoConference.transcription.enabled = true` and publishes `{ type: 'transcription-state', enabled: true }` on data channel.
3. Worker enables the persistence path. On each final transcript, in addition to broadcasting (if captions were on), POSTs to `/transcript.append` with the bearer token.
4. Server appends to `VideoConference.transcript[]`.
5. On call end → summary path (below).

### Recording

1. User clicks record → `POST /recording.start`.
2. Server pre-allocates `uploadId` (UUID), computes S3 key `<workspaceId>/uploads/<rid>/<userId>/<uploadId>.mp4`, calls `startRoomCompositeEgress` with that as the `filepath`.
3. Persists `recording: { egressId, uploadId, uploadKey, … }`.
4. `startRecordingPoll(callId, egressId)` schedules 10s polls (up to 4h).
5. User clicks stop (or call ends). `stopEgress` is called; poller keeps going until LK reports terminal status.
6. `finalizeRecording`:
   - Inserts `Uploads` doc with the pre-allocated `_id`, `store: 'AmazonS3:Uploads'`, `AmazonS3: { path: uploadKey }`, `complete: true`.
   - `sendFileMessage(rid, uploadDoc, { tmid: VideoConference.messages.started })` — **thread reply** under the call's block message.
   - Sets `recording.messageSent = true` (idempotency guard).

### End-of-call summary

1. Call ends (everyone leaves or cleanup cron triggers).
2. If `transcript[]` is non-empty and `Summary_Enabled`, `summary.ts` runs:
   - Builds a prompt from `transcript[]`, calls Gemini (`Summary_Gemini_Model`).
   - Posts the summary text as a thread reply under `messages.started`. Persists `summary.messageId`.
   - Uploads the raw transcript as `.md` (UTF-8 BOM + `text/markdown; charset=utf-8`) and posts as another thread reply. Persists `summary.transcriptMessageId`.

---

## 9. Self-hosting LiveKit + Egress

A turnkey single-EC2 deployment lives at `deploy/livekit/`:

- **`cloudformation.yaml`** — CloudFormation template. Provisions a VPC (or reuses an existing one), security group, Elastic IP, IAM role for SSM access, and an EC2 instance whose user-data installs Docker + Compose and brings up four containers: `livekit-server`, `livekit/egress`, `redis`, `caddy` (auto-TLS via Let's Encrypt). Multi-arch (x86_64 + arm64) AMI selection driven by InstanceType.
- **`deploy.md`** — Full walkthrough: prerequisites, key pair, existing-VPC reuse path (for accounts at the per-region VPC quota), parameter overrides, DNS setup, cert wait, Rocket.Chat wiring, troubleshooting (every gotcha encountered during initial deploy is documented), iterating, teardown, cost notes.

S3 credentials for recording are passed per-request by Rocket.Chat — the egress container has no static creds.

For the LK + Egress workload to accept a room-composite recording job, the box needs ≥4 vCPU (egress default `cpu_cost.room_composite_cpu_cost`). The template defaults to `t4g.large` (2 vCPU) for cheap testing and adds a `cpu_cost` override in the egress config so it accepts the job at quality risk on busy rooms; bump to `t4g.xlarge` for proper recording.

---

## 10. Known limitations

- **Per-Gemini-session lifetime cap (~15 min)**. Worker doesn't reconnect mid-track. Long monologues lose captions until the next `trackSubscribed` event (re-opens the session). Manual-subscribe workaround keeps this happening for late publishers.
- **Language drift mid-session**. `systemInstruction` is fixed at session creation. The per-call language picker restart mitigates but doesn't eliminate; Gemini can still drift if the speaker code-switches.
- **Single-process worker**. Supervisor only respawns one. No horizontal scaling story yet — for many concurrent rooms in a single workspace, you'd want multiple worker processes or external workers.
- **Self-hosted Egress CPU.** Room-composite recording requires ≥4 vCPU by default. The `cpu_cost` override is documented in `deploy.md` but trades quality for cost.
- **No E2EE.** The worker needs plaintext audio to transcribe; enabling LK E2EE means turning captions off.
- **STS / AssumeRole for recording.** Today, recording requires long-lived S3 credentials in the per-request payload. STS with `ExternalId` would be more secure for cloud-hosted LK reading on-prem S3 — designed but not implemented.

---

End.
