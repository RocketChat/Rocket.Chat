# LiveKit group calls

Ported from [#40726](https://github.com/RocketChat/Rocket.Chat/pull/40726) minus that PR's persistent-chat
work, which this branch already carries from
[the persistent-chat feature](../video-conference-persistent-chat/README.md). The two are **not yet wired
together**: a LiveKit call renders inline in its room and follows the user as a floating widget, rather than in
the `/conference/:id` window. Joining them up is the next step.


LiveKit ships as a **native provider of the Video Conference feature** — not as a parallel "VoIP TeamCollab" thing. The room-sidebar camera button starts a LiveKit-backed call exactly the way it starts a Jitsi/Google Meet call today; the only difference is the embedded provider returns control to a React context that owns the LK session.

What that integration provides:

1. **LiveKit group calls.** Channel-scoped multi-party calls routed through a LiveKit SFU. Grid + spotlight, screen sharing, hand-raise / reactions, floating widget when navigating away from the call's room.

---

## 1. Deployment topology

```
┌────────────────────────────────────────────────────────────────────┐
│ Rocket.Chat monolith (Meteor)                                      │
│                                                                    │
│   ┌──────────────────────────┐   ┌─────────────────────────────┐   │
│   │ Video Conference service │   │ ee/server/lib/livekit/*     │   │
│   │   (existing)             │   │   config / token            │   │
│   │   + LiveKit provider     │◀──│   roomService / cleanup     │   │
│   │     (embedded)           │   │   roomService / cleanup     │   │
│   └──────────────────────────┘   └─────────────────────────────┘   │
│                                                                    │
│   ┌──────────────────────────┐                                    │
│   │ REST                     │                                    │
│   │   /transport.config      │                                    │
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
          │ Twirp HTTPS (RoomService)                        │
          │ HS256 JWT                                        │ wss
          ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ LiveKit (Cloud or self-hosted)                                     │
│   - SFU media routing                                              │
└────────────────────────────────────────────────────────────────────┘
```

Beyond the Meteor monolith this needs a **LiveKit** deployment — Cloud or self-hosted — reachable over `wss`. Point the settings below at it.


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
| `messages.started` | ID of the "call ongoing" block message. Threaded replies about the call hang off it. |

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
- **`cleanup.ts`** — registers a 1-minute cron that asks LK for each active call's participant count and ends calls with 0 LK participants older than 60s. Safety net for crashed-tab cases the `/leave` endpoint doesn't catch.

### REST APIs

All endpoints live in `apps/meteor/ee/server/api/videoConferenceLiveKit.ts`. All authorise the caller as a member of the room and rate-limit per user.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/video-conference.livekit.transport.config?callId=…` | Returns `{ serverUrl, token, roomName }` for the client. |
| `POST` | `/v1/video-conference.livekit.leave` | Marks the user left. Supports `keepalive` for `beforeunload`. |

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

### UI surfaces (`packages/ui-voip/src/views/MediaCallRoomSection/`)

- **Reactions popover** — stays open for multiple clicks; outside-click to dismiss.
- **Hand-raise** — auto-lowers after 3s of continuous speech (driven by `useAudioLevel`).


Camera tiles fall back to the avatar when `track.enabled && !track.muted && track.readyState === 'live'` is false (`useStreamHasLiveVideo` hook). For remote LK tracks, also check `publication.isMuted`.

---

## 7. Runtime flows

### Starting a call

1. User clicks the camera button on the room sidebar.
2. `VideoConfButton` → `VideoConfManager.startCall(rid)` — mints a `VideoConference` doc with `providerName: 'livekit'` and returns `{ url: '', callId, rid }`. Empty `url` signals embedded.
3. `VideoConfManager` emits `'call/joinEmbedded'` with `{ callId, rid, providerName, preferences }` (preferences = mic/cam state from preflight).
4. `VideoConfProvider` routes to `useLiveKitVideoConf().joinCall(...)`.
5. `LiveKitVideoConfContext` fetches `/transport.config`, mounts `<LiveKitRoom>` in the portal with `initialAudioEnabled` / `initialVideoEnabled` from preferences.
6. LK connects.

## 8. Known limitations

- **Single-process worker**. Supervisor only respawns one. No horizontal scaling story yet — for many concurrent rooms in a single workspace, you'd want multiple worker processes or external workers.

---

End.
