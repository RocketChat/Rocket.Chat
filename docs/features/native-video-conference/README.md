# LiveKit group calls and recording

Ported from [#40726](https://github.com/RocketChat/Rocket.Chat/pull/40726) minus that PR's persistent-chat
work, which this branch already carries from
[the persistent-chat feature](../video-conference-persistent-chat/README.md). The two are **not yet wired
together**: a LiveKit call renders inline in its room and follows the user as a floating widget, rather than in
the `/conference/:id` window. Joining them up is the next step.

Deployment: [deploying-livekit.md](./deploying-livekit.md).

LiveKit ships as a **native provider of the Video Conference feature** — not as a parallel "VoIP TeamCollab" thing. The room-sidebar camera button starts a LiveKit-backed call exactly the way it starts a Jitsi/Google Meet call today; the only difference is the embedded provider returns control to a React context that owns the LK session.

This doc covers the two product slices that live on top of that integration:

1. **LiveKit group calls.** Channel-scoped multi-party calls routed through a LiveKit SFU. Grid + spotlight, screen sharing, hand-raise / reactions, floating widget when navigating away from the call's room.
2. **Cloud recording.** Egress-based room composite recording. The output file is registered as a standard `Uploads` document and posted as a **thread reply** under the call's "call ongoing" block message.

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
│   ┌──────────────────────────┐                                    │
│   │ REST                     │                                    │
│   │   /transport.config      │                                    │
│   │   /recording.*           │                                    │
│   │   /leave                 │                                    │
│   └──────────────────────────┘                                    │
│                                                                    │
│   ┌──────────────────────────┐                                    │
│   │ Client (React)           │                                    │
│   │   VideoConfButton →      │                                    │
│   │   VideoConfManager →     │                                    │
│   │   LiveKitVideoConf       │                                    │
│   │     Context              │                                    │
│   └──────────────────────────┘                                    │
└─────────┬──────────────────────────────────────────────────┬───────┘
          │ Twirp HTTPS (RoomService, Egress)                │
          │ HS256 JWT                                        │ wss
          ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ LiveKit (Cloud or self-hosted)                                     │
│   - SFU media routing                                              │
│   - Egress workers (room composite -> S3)                          │
└────────────────────────────────────────────────────────────────────┘
```

Deployables beyond the Meteor monolith:

- **LiveKit** — Cloud or self-hosted. The same instance handles SFU + Egress. A turnkey self-hosted setup is provided at `deploy/livekit/` (CloudFormation + bootstrap; see §11).
- **S3 bucket** — must be the same bucket Rocket.Chat's `FileUpload` is configured against, so the recorded file lands in a path the existing file-serving pipeline already knows how to read.


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
| `messages.started` | ID of the "call ongoing" block message. **Recording thread replies use this as `tmid`.** |
| `recording` | `{ egressId, startedAt, endedAt?, storage, uploadId?, filename?, messageSent? }`. `messageSent` guards against double-post on restart-resumed pollers. |

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

### REST APIs

All endpoints live in `apps/meteor/ee/server/api/videoConferenceLiveKit.ts`. All authorise the caller as a member of the room and rate-limit per user.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/video-conference.livekit.transport.config?callId=…` | Returns `{ serverUrl, token, roomName }` for the client. |
| `POST` | `/v1/video-conference.livekit.leave` | Marks the user left. Supports `keepalive` for `beforeunload`. |
| `POST` | `/v1/video-conference.livekit.recording.start` | Starts egress + persists state + schedules poller. |
| `POST` | `/v1/video-conference.livekit.recording.stop` | Calls `stopEgress`; poller continues until LK reports terminal. |
| `GET` | `/v1/video-conference.livekit.recording.status?callId=…` | UI polling. |

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
| `recording-state` | server → all | yes | `{ recording: boolean }`. Drives UI badges. |

### UI surfaces (`packages/ui-voip/src/views/MediaCallRoomSection/`)

- **Recording pill** — calls `/recording.start`.
- **Reactions popover** — stays open for multiple clicks; outside-click to dismiss.
- **Hand-raise** — auto-lowers after 3s of continuous speech (driven by `useAudioLevel`).


Camera tiles fall back to the avatar when `track.enabled && !track.muted && track.readyState === 'live'` is false (`useStreamHasLiveVideo` hook). For remote LK tracks, also check `publication.isMuted`.

---

## 8. Runtime flows

### Starting a call

1. User clicks the camera button on the room sidebar.
2. `VideoConfButton` → `VideoConfManager.startCall(rid)` — mints a `VideoConference` doc with `providerName: 'livekit'` and returns `{ url: '', callId, rid }`. Empty `url` signals embedded.
3. `VideoConfManager` emits `'call/joinEmbedded'` with `{ callId, rid, providerName, preferences }` (preferences = mic/cam state from preflight).
4. `VideoConfProvider` routes to `useLiveKitVideoConf().joinCall(...)`.
5. `LiveKitVideoConfContext` fetches `/transport.config`, mounts `<LiveKitRoom>` in the portal with `initialAudioEnabled` / `initialVideoEnabled` from preferences.
6. LK connects.

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

## 9. Self-hosting LiveKit + Egress

A turnkey single-EC2 deployment lives at `deploy/livekit/`:

- **`cloudformation.yaml`** — CloudFormation template. Provisions a VPC (or reuses an existing one), security group, Elastic IP, IAM role for SSM access, and an EC2 instance whose user-data installs Docker + Compose and brings up four containers: `livekit-server`, `livekit/egress`, `redis`, `caddy` (auto-TLS via Let's Encrypt). Multi-arch (x86_64 + arm64) AMI selection driven by InstanceType.
- **[`deploying-livekit.md`](./deploying-livekit.md)** — Full walkthrough: prerequisites, key pair, existing-VPC reuse path (for accounts at the per-region VPC quota), parameter overrides, DNS setup, cert wait, Rocket.Chat wiring, troubleshooting (every gotcha encountered during initial deploy is documented), iterating, teardown, cost notes.

S3 credentials for recording are passed per-request by Rocket.Chat — the egress container has no static creds.

For the LK + Egress workload to accept a room-composite recording job, the box needs ≥4 vCPU (egress default `cpu_cost.room_composite_cpu_cost`). The template defaults to `t4g.large` (2 vCPU) for cheap testing and adds a `cpu_cost` override in the egress config so it accepts the job at quality risk on busy rooms; bump to `t4g.xlarge` for proper recording.

---

## 10. Known limitations

- **Single-process worker**. Supervisor only respawns one. No horizontal scaling story yet — for many concurrent rooms in a single workspace, you'd want multiple worker processes or external workers.
- **Self-hosted Egress CPU.** Room-composite recording requires ≥4 vCPU by default. The `cpu_cost` override is documented in [deploying-livekit.md](./deploying-livekit.md) but trades quality for cost.
- **STS / AssumeRole for recording.** Today, recording requires long-lived S3 credentials in the per-request payload. STS with `ExternalId` would be more secure for cloud-hosted LK reading on-prem S3 — designed but not implemented.

---

End.
