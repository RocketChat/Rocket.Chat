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
│   │   + LiveKit provider     │◀──│   roomService / presence    │   │
│   │     (embedded)           │   │                             │   │
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
          │ HS256 JWT (access tokens, minted locally)        │ wss
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

| Setting                        | Type            | Default       | Purpose                                                  |
| ------------------------------ | --------------- | ------------- | -------------------------------------------------------- |
| `VideoConf_LiveKit_Enabled`    | boolean         | `false`       | Master toggle. Gates the embedded provider registration. |
| `VideoConf_LiveKit_Mode`       | select          | `self_hosted` | Doc hint (`self_hosted` / `cloud`). No runtime effect.   |
| `VideoConf_LiveKit_Url`        | string          | —             | Full `wss://` URL the client connects to.                |
| `VideoConf_LiveKit_Api_Key`    | string (secret) | —             | LK API key. Mints participant tokens + Twirp calls.      |
| `VideoConf_LiveKit_Api_Secret` | password        | —             | Paired with the key.                                     |

## 3. Data model

The LK feature persists state on the existing **`VideoConference`** collection (`packages/models/src/models/VideoConference.ts`, `packages/core-typings/src/IVideoConference.ts`). The discriminator is `providerName === 'livekit'`.

Fields the LK flow uses:

| Field              | Purpose                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| `providerName`     | `'livekit'` for our calls.                                                           |
| `type`             | `'direct'` / `'videoconference'` / `'livechat'` (existing field, untouched).         |
| `status`           | `CALLING` / `STARTED` / `EXPIRED` / `ENDED` / `DECLINED`.                            |
| `rid`              | Room the call belongs to. Drives "active call in room" lookup.                       |
| `users[]`          | The roster, and the only record of who is in the call — see [presence leases](../video-conference-persistent-chat/README.md#knowing-who-is-still-in-the-call). LiveKit keeps no second list of its own. |
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
- **`token.ts`** — `createLiveKitAccessToken({ identity, roomName, ttl })` for client participants, using `signHS256` from `@rocket.chat/jwt`.

There is deliberately **no server→LiveKit control path**: no admin token, no Twirp client, and nothing that asks the SFU who is in a room. Who is in a call is the roster's answer, held by [presence leases](../video-conference-persistent-chat/README.md#knowing-who-is-still-in-the-call) that the conference window renews — the same mechanism for every provider. Asking LiveKit as well meant two records that could disagree, and the disagreement is worse than the staleness it was meant to fix.

### REST APIs

All endpoints live in `apps/meteor/ee/server/api/videoConferenceLiveKit.ts`, rate-limited per user. Authorization is `canAccessConference` — conference membership **or** access to the call's room — the same rule every conference endpoint uses, and deliberately not room access alone: a call member added from outside the room (the third person in a DM call) has no subscription to check, and checking for one refuses them their own call. See [Access Control](../video-conference-persistent-chat/README.md#access-control).

| Method | Path                                                     | Purpose                                                       |
| ------ | -------------------------------------------------------- | ------------------------------------------------------------- |
| `GET`  | `/v1/video-conference.livekit.transport.config?callId=…` | Returns `{ serverUrl, token, roomName }` for the client.      |

Leaving is **not** one of them: the LiveKit bridge reports a departure to `/v1/video-conference.leave`, the same endpoint every other provider uses (with `keepalive`, so it survives a tab close).

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

### Which devices a call uses

The preflight is the only place devices are chosen, and it remembers the choice in `localStorage`
(`videoconf-call-preferences`, via `useCallPreferences`). Two rules keep that choice and the call in agreement:

- **Applied as capture _defaults_, not capture options.** `audio` and `video` on `<LiveKitRoom>` describe the track
  published on the way in, so a call joined muted — the normal way to join — used to throw the chosen microphone away
  along with the `false`, and unmuting later opened whichever device the browser preferred. `audioCaptureDefaults` /
  `videoCaptureDefaults` are read every time a track is created, including that one. LiveKit merges them over its own
  audio defaults (echo cancellation and friends survive) and seeds the room's active-device map from them.
- **The room is asked which device is in use — nothing else is trusted to know.** The app's own device store
  (`DeviceProvider`) is only ever written from inside a call, so on arrival it answers with its own fallback, the first
  device the browser happened to enumerate, and the device chosen in the preflight reads as unselected in the in-call
  menu. `LiveKitVideoConfProvider` instead listens for `RoomEvent.ActiveDeviceChanged`, reads
  `room.getActiveDevice(kind)`, and corrects the store from it. That value is the device _obtained_ rather than the one
  requested, so a device that cannot actually capture shows the one the browser fell back to.

Picking a device in the in-call menu therefore only calls `room.switchActiveDevice`; the record follows from the event.
Matching a recorded device against a menu entry goes through `isSameDevice` (`packages/ui-voip/src/utils/deviceLabels.ts`),
because browsers list the system default twice — as the `default` alias and under its own id — and the two halves of that
pair are held by different parts of the app.

### What the preflight and the call agree on

Noise cancelling, send resolution and background blur are chosen in the same two menus in both places — the mic menu
and the camera menu — with the device rows above them and a header per group. Both screens read and write the same
`localStorage` bucket, so a choice made before a call is the choice the call arrives with.

For that to be honest the preflight camera has to be a **LiveKit track**, not a bare `getUserMedia` stream
(`usePreviewVideoTrack`): blur is a `TrackProcessor`, a processor needs a `LocalTrack` to attach to, and nothing about
MediaPipe blur needs a room. Built this way the preview runs the same processor at the same strength the call will,
and the resolution choice is real here rather than notional, because the track is created with it. A raw stream could
only ever have shown an unblurred picture beside a blurred promise.

Handing that track to the room on join — `publishTrack` takes a pre-created one — is the next step, and would remove
both the re-acquire on entry and the reason a remembered blur level is not applied on arrival.

### Send resolution

The camera menu offers **Auto / 1080p / 720p / 360p / 180p**, and the local tile carries a badge saying what is
actually going out, read from `getRTCStatsReport()`'s tallest `outbound-rtp` layer every three seconds
(`useSendResolution`). The two are worth separating: the encoder picks simulcast layers for the bandwidth it has, so
what leaves the machine is frequently not what the camera captured.

**Known defect:** `useVideoQuality` restarts the camera with a `resolution` preset, which is a capture constraint —
an `ideal` hint to the camera, not a cap on the encoder. It should be publish options (`videoEncoding`, simulcast
layer config, `setPublishingLayers`) instead. As it stands the picker asks the camera nicely and the badge tells the
truth about the result, which is why the two can disagree.

### Background blur

Two ways of doing it, and which one runs is whichever can — the same arrangement as noise cancelling:

- **The camera's own**, via the `backgroundBlur` constraint. Free: the platform does it before the frames reach us.
  Some platforms let the app control it; others expose an OS-controlled effect that the app can only observe.
- **Ours**, `BackgroundBlurProcessor` in `apps/meteor/client/views/videoConference/livekit/`: MediaPipe segmentation
  in a dedicated worker and a WebGL2 compositor, as a LiveKit `TrackProcessor`. Works anywhere with Worker,
  ImageBitmap, OffscreenCanvas, WebGL2 and canvas-capture support, and it is not free — it loads MediaPipe's JS/WASM
  runtime and a TFLite model from `public/mediapipe/` the first time a level is picked. All assets are
  shipped with the application, so airgapped workspaces work out of the box.

**Ask `getCapabilities()`, never `applyConstraints`.** `applyConstraints({ backgroundBlur: true })` _resolves
happily_ on a browser that has never heard of the constraint — an unrecognised non-required constraint is dropped
per spec — and `getSettings().backgroundBlur` stays `undefined`. Trying it and believing the result ships a switch
that reports success and blurs nothing.

The camera menu offers it as **one row per strength** — No blur / Light / Medium / Strong — the same shape as the
camera rows above it, because "how much" is a choice and a switch could only ever say "on". Where a controllable
_camera_ is doing the blurring the list is No blur / Medium only. An OS effect that reports only `[true]` is observed
but not offered as a switch, because only a two-value capability can be changed by the application. `none` by default
(it is a deliberate look, and ours costs device resources), remembered, and the row in use says who is doing the work: _By your
camera_ or _Processed on this device_. Changing strength is a number on the running processor, so only the first
choice in a call is slow — and turning blur off leaves the processor attached, passing frames through untouched,
because detaching one re-publishes the camera.

The same background-effects section also offers **Choose background image…** when the WebGL processor is available.
The file is decoded locally, reduced to at most 2560 pixels on its longest side, and uploaded to a dedicated texture
once; its bytes never leave the browser or enter call preferences. The final shader samples it with the equivalent of
`object-fit: cover` and composites the refined person matte over it. The decoded image is retained for the current page
session, so moving to blur and back is instant and a preflight selection carries into the call without storing a large
data URL in localStorage.

#### Why this is ours and not `@livekit/track-processors`

The library shipped this feature first and was replaced, for one reason: it composites the background into a texture
at **a quarter of the frame's size** and stretches it back, and the factor is a constant.

```js
const downsampleFactor = 4;
blurRadius = radius ? Math.max(1, Math.floor(radius / downsampleFactor)) : null;
const bgBlurTextureWidth = Math.floor(canvas.width / downsampleFactor);
```

At 1080p that is a 480×270 background on a 1920×1080 frame. That upscale — not the radius — is the blockiness that
read as "low quality", and no value we passed could change it. It is also why the levels were once indistinguishable:
they were 0.1 / 1 / 2, and everything under 4 floors to the same clamped 1. Setting blur to 0.1 and _still_ seeing a
heavy, coarse background is what found it.

Ours keeps the expensive rendering stages on WebGL2:

1. MediaPipe returns a continuous confidence matte rather than a binary category verdict;
2. a joint bilateral shader refines that matte against the camera image, so its boundary follows image edges instead
   of being feathered blindly; HD inputs use a half-resolution matte because the semantic boundary contains no useful
   per-pixel detail, then the final sampler restores it smoothly at full resolution;
3. the background is represented as colour multiplied by background coverage, and both are blurred progressively
   through consecutive texels on adaptive lower-resolution buffers; a matte-aware four-tap downsample builds only the
   reduced surface the blur consumes instead of regenerating a complete video mip pyramid on every camera frame;
4. the final full-resolution pass divides colour by coverage and blends the sharp person over it.

The coverage division prevents hair, skin and clothes from bleeding outwards into a coloured halo. Texture clamping
also fixes the canvas implementation's other defect: it enlarged the background to hide soft outer edges, which moved
the room relative to the sharp subject. `supportsBackgroundBlur()` therefore asks for WebGL2 and a capturable canvas.

Strengths are **fractions of frame height** (0.016 / 0.032 / 0.064), not pixels. The same track is watched at whatever
size the other end's tile happens to be, so what has to hold across resolutions is the blur relative to the picture;
pixels would make every level three times lighter as the camera got better.

#### Two things about the mask that are not what they look like

**Segment a scaled-down copy of the frame, never the frame.** MediaPipe returns a mask the size of the image it was
given, and reading a 1920×1080 mask back off the GPU costs about 60ms a frame. The model resizes its input to its own
size regardless, so a frame-sized mask was only ever its own output stretched back up — we hand it a copy at exactly
`SEGMENTER.input` and stretch the mask ourselves when compositing. Measured on an M2 Max, per blurred frame at 1080p:

|                                           | 720p | 1080p |
| ----------------------------------------- | ---- | ----- |
| mask read at frame size                   | 50ms | 94ms  |
| mask read at model size, two-class model  | 12ms | 9ms   |
| mask read at model size, multiclass model | 35ms | 20ms  |

Segmentation is what remains, so it runs in a dedicated worker on its own clock — initially `SEGMENT_INTERVAL`, a
20Hz target that resolves to about 15Hz on the processor's 30fps camera callback clock.
The main thread transfers a model-sized ImageBitmap in and receives a transferred confidence buffer back. Its measured
end-to-end duration then controls that interval up to 120ms, keeping model inference and mask readback near 60% of one
worker core without periodically stalling the UI and WebRTC encoder.
Low-amplitude confidence changes are stabilized in a reused byte buffer to suppress edge flicker, while large changes
are accepted immediately so real motion does not inherit the lag of an ordinary exponential average.

The processor also measures output FPS, total frame work, compositor time and segmentation time. Sustained frame
pressure progressively lowers only the background and matte working resolutions; the subject and final composite
stay full resolution. Recovery waits for several seconds of headroom to prevent quality oscillation. These values and
the active adaptive level appear in **Connection info → Background blur** during a call. Camera callbacks are capped
at 30fps before any texture upload or compositing; some devices deliver 60fps even though WebRTC is configured to send
30, and processing the extra frames only competes with the encoder.

**Which confidence is the person comes from the model, not from us.** The two answers are opposites:

| model                                         | labels                                                              | the person is                  |
| --------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| `selfie_segmenter_landscape`, 256×144, 244 KB | `selfie`                                                            | confidence mask **0** directly |
| `selfie_multiclass_256x256`, 256×256, 15.6 MB | `background`, `hair`, `body-skin`, `face-skin`, `clothes`, `others` | **1 − background confidence**  |

`personConfidence()` derives that rule from `segmenter.getLabels()`. The user chooses between them as **Quality**
(multiclass, the default) and **Performance** (selfie) — in the camera menu when blur is active, and in the
preflight. The choice is persisted in `videoconf-call-preferences` alongside blur level. Quality's separate `hair`
class holds an edge far better and is worth being 65× the download and about twice the work per frame; Performance
is for machines where that cost drops the camera below usable frame rates.

Both models segment every person they can see. A meeting background should follow the participant at the camera,
not a person walking behind them, so the stabilized matte is split into connected foreground components at model
resolution. Initial acquisition must overlap the broad central 70% of the camera; later frames must remain close to
the previous centroid, making the choice sticky while allowing normal continuous movement to reach an edge. A new
person at the border cannot take over after the caller leaves. Only the tracked component and its two-pixel soft
edge are kept, which also removes isolated furniture false positives.

#### Two things a processor changes about a track

Once a processor is attached, `track.mediaStreamTrack` is the **processed** track, and a processed track belongs to
no device. Both of these followed from that, and both are fixed:

- **The local tile showed the raw camera**, so blur went out to the call while the person who switched it on saw
  themselves unblurred. It now renders the processor's `processedTrack`, in a `MediaStream` held in a ref keyed by
  the track so re-renders don't hand the video element a new object.
- **`useStreamHasLiveVideo` reported it as not producing frames.** It gates on `!track.muted`, and a track that comes
  out of a canvas rather than a camera reports `muted` until its first frame and does not reliably announce it — so
  the tile fell back to the avatar and looked black. A track with no device behind it is now treated as synthetic, where `live`
  and `enabled` are enough; a real camera track still needs `!muted`, so a paused camera still shows the avatar.
- **The camera stopped being selected in its own menu**, because `currentCameraDeviceId` read the processed track's
  empty `deviceId` — which also made choosing the camera already in use look like a change, restarting the track
  into a black frame. It reads the id from the track's constraints now.

### Noise cancelling

Two filters, and which one runs is not a preference — it is whichever can actually work.

**Krisp** (`@livekit/krisp-noise-filter`) is licensed through **LiveKit Cloud**. On a self-hosted server it fails in
the worst possible way: `isKrispNoiseFilterSupported()` returns true, `setProcessor` succeeds, the WASM worklet
starts, models download — and then `setEnabled(true)` calls an authentication endpoint, gets **404**, and leaves
`isEnabled()` false. The result is a filter that is attached, routing every audio sample through a worklet, and
filtering nothing. That is what "noise cancelling seems not to work" was: it had never once been on.

So `useNoiseSuppression` checks the _result_ of `setEnabled` rather than assuming it, and a filter that will not
turn on is `destroy()`ed and taken out of the path instead of left there costing latency for nothing.

**The browser's own** (`noiseSuppression` on the mic constraints) is the fallback, and on a self-hosted workspace it
is what everyone gets. It is a property of the microphone rather than a processor, so switching it means
`restartTrack` — a brief gap in the audio, which is why it is not the mechanism where Krisp works.

**RNNoise** sits between them: Xiph's recurrent network (~85KB of weights) in an AudioWorklet, which is what Jitsi
ships. It removes typing, chairs and the road outside, which the browser's own leaves in. Its worklet and WASM are
served from `apps/meteor/public/noise-suppressor/` rather than a CDN — deliberately, since this exists for the
deployments that cannot reach Krisp's licensing server, and those often cannot reach a CDN either. Switching it out
rewires straight through rather than tearing the graph down, so there is no gap and nothing renegotiates.

The mic menu offers all three as **one row per method**, weakest first: Off / Basic (your browser) / Good (RNNoise) /
Best (Krisp). Each is _proven_ before being offered rather than taken from a support flag — Krisp reports itself
supported, attaches, starts its worklet and only then fails the entitlement check, so a flag-based list would show a
choice that quietly does nothing. Proving it is also what starts it, so the cost is paid once. The choice is
remembered, and a remembered method that is no longer possible falls back to the best on offer.

(Those assets are copied into `public/` for now; they should be a build step rather than committed binaries.)

Diagnosing it again: `KrispNoiseFilter({ debugLogs: true })` turns on Krisp's own logging.

### What a microphone looks like

`VoiceActivity` (`packages/ui-voip/src/components/VoiceActivity.tsx`) is three bars that rise with how loudly
someone is talking. At rest the three are equal, which reads as a row of dots — a mic that is on and hearing
nothing. Unequal bars at rest would claim a voice that isn't there; nothing at all would read as broken.

It replaces the mic icon wherever the mic is live, rather than sitting next to one, and answers what a static icon
cannot: whether a mic that is _on_ is picking anything up.

| Where                   | Mic on                                                                          | Mic off                |
| ----------------------- | ------------------------------------------------------------------------------- | ---------------------- |
| Tile corner             | blue disc, bars                                                                 | dark disc, crossed mic |
| Members panel           | blue disc, bars, and — for anyone but the reader — a button to ask them to mute | _nothing_              |
| Mic button in the strip | bars in place of the chevron                                                    | the chevron            |

The blue is `Palette.stroke['stroke-highlight']`, the same blue the tile's speaking ring uses, so the two agree
about what "someone is talking" looks like.

A muted member's row says nothing on purpose. Everyone in the call already hears the silence, so a crossed-out mic
there would repeat it once per row, for the rows there is least to say about. The reader's own row shows the level
and no button: muting yourself is what the strip's own control is for.

Give the component a level if you already measure one — a tile lighting its speaking ring does — and it uses that;
give it a stream and it measures for itself. That is what keeps two analysers off the same microphone.

The name over a tile is plain text with a shadow rather than text on a plate. A dark pill under every name put a
permanent rectangle over the bottom of everyone's camera, and the shadow keeps the name legible over whatever the
camera is showing without covering any of it. A raised hand is the one thing that gives a name a plate — the green
one — which is what makes that green mean something.

### Data-channel messages

All inter-client and worker↔client comms ride the LK data channel. Current message types:

| Type       | Direction     | Reliable? | Purpose                                                              |
| ---------- | ------------- | --------- | -------------------------------------------------------------------- |
| `hand`     | client ↔ all | yes       | `{ raised, raisedAt, rebroadcast? }`. Hand-raise aggregation.        |
| `reaction` | client ↔ all | no        | `{ emoji, reactionId? }`. Floating reactions. 3.5s TTL on receivers. |
| `mute`     | client ↔ all | yes       | `{ target }`. Asks one participant to mute themselves.               |

**`hand`** carries `rebroadcast: true` when it is a hand being restated for someone who arrived after it went up.
Only a _new_ hand chimes (`playHandRaiseChime`), so joining a call where three hands are already up is silent
rather than announcing all three; the chime is otherwise played for everyone, including the raiser, for whom it is
confirmation that the room was told. Whose hand has already been announced is tracked in a ref rather than read
from state, because a decision made inside a state updater is made again every time React re-runs it.

**`mute` is a request, not an act.** Everyone in the call receives it and only its target acts on it, by muting its
own microphone — the only place a microphone can actually be turned off — and telling its owner who asked
(`You_were_muted_by__name__`). A client that ignored the message would stay unmuted, which is the honest shape of
this without server-side moderation: nothing here reaches into anyone's machine. The asking lives in the call's
members panel, where the people in the call are; nobody is offered it against themselves.

### Where a raised hand and a reaction are shown

Neither is drawn on the raiser's own tile any more, and for the same reason: a call can be larger than the tiles it
shows, and both were invisible in exactly the calls where they matter most.

- **Reactions** rise from the bottom-left of the call area (`CallReactions`), each carrying the sender's name —
  which is what keeps them attributable now that position no longer says who sent them. The bottom _left_ because
  the controls own the middle of that edge, and rising through them would put an emoji over the hang-up button.
- **Raised hands** are stated next to the participants button (`CallRaisedHands`): the person at the front of the
  queue, with `+N` when others are waiting, and the whole queue in order behind a click. Nothing is rendered when
  nobody has their hand up. The members panel marks who is waiting, without the ordering — that is the header's to
  state.

### UI surfaces (`packages/ui-voip/src/views/MediaCallRoomSection/`)

- **Reactions popover** — stays open for multiple clicks; outside-click to dismiss.
- **Hand-raise** — auto-lowers after 3s of continuous speech (driven by `useAudioLevel`).
- **Speaking-while-muted indicator** — a pulsing warning dot on the mic button, shown when the user is talking with their microphone muted. See _Speaking-while-muted detection_ below.

Camera tiles fall back to the avatar when `track.enabled && !track.muted && track.readyState === 'live'` is false (`useStreamHasLiveVideo` hook). For remote LK tracks, also check `publication.isMuted`.

### Member presence in the call panel

`CallMemberItem` shows each member's online/away/offline status via `ReactiveUserStatus` regardless of whether they have joined, are ringing, or were invited. The presence dot appears for all members, not only joined ones, so the caller can see whether an invited person is online before they pick up.

### Speaking-while-muted detection

LiveKit stops the microphone track when the user mutes, so its own `isSpeaking` / `audioLevel` go silent. The `useSpeakingWhileMuted` hook (`apps/meteor/client/views/videoConference/livekit/useSpeakingWhileMuted.ts`) works around this by opening a parallel `getUserMedia` capture from the same device while muted. It samples the raw audio level via an `AnalyserNode` at 100ms intervals and reports `true` when speech exceeds the threshold for 400ms continuously — long enough to filter out bumps and coughs. The capture is torn down the moment the mic is unmuted or the component unmounts.

The hook is wired through `LiveKitVideoConfProvider` into `MediaCallViewContext.speakingWhileMuted`. The mic button in `MediaCallRoomSection` responds by showing a pulsing dot and changing its tooltip to "You are muted — click to unmute".

### Active speaker and layout

`useActiveSpeakerId` samples audio from remote participants only — the local participant is excluded so the user can never promote themselves to the spotlight or the sidebar's featured tile. When no one is speaking, the spotlight and sidebar fall back to the first remote participant rather than defaulting to the local user.

This applies to both layout modes in `CallStage`:

- **Spotlight**: the featured tile is the active speaker, falling back to the first remote participant.
- **Sidebar**: the large tile is the active speaker, with the remaining participants in a scrollable strip. The local participant only appears in the strip, never as the featured tile.

### Presenting indicator

`CallPresenting` renders a pill in the call top bar (inside `ConferenceEmbeddedPage`'s `CallTopBar`, alongside `CallRaisedHands`) showing who is screen-sharing. The presenter list is derived in a `useMemo`: the local screen track (`streams.localScreen.active`) and any remote participant whose `screenStream` is truthy.

When the local user is presenting, the pill shows a desktop icon, the user's name with "(You, presenting)", and a red "Stop presenting" button wired to `onToggleScreenSharing`. When a remote user is presenting, it shows their avatar and "(presenting)". If multiple people share simultaneously, the first presenter is displayed with a `+N` overflow count for the rest.

### Ringback tone for the caller

When the caller is in a DM-style call and at least one invited member's phone is ringing, a dialtone plays in a loop (`dialtone.mp3` via `useCustomSound().callSounds.playDialer()`). The effect lives in `ConferenceEmbeddedPage` and checks `isRingingVideoConferenceMember` on each member, filtering out the caller themselves. The tone stops when everyone has either joined or stopped ringing.

---

## 7. Runtime flows

### Starting a call

1. User clicks the camera button on the room sidebar.
2. `VideoConfButton` → `VideoConfManager.startCall(rid)` — mints a `VideoConference` doc with `providerName: 'livekit'` and returns `{ url: '', callId, rid }`. Empty `url` signals embedded.
3. `VideoConfManager` emits `'call/joinEmbedded'` with `{ callId, rid, providerName, preferences }` (preferences = whether to arrive with mic/cam on, plus which mic, camera and speaker, all from the preflight).
4. `VideoConfProvider` routes to `useLiveKitVideoConf().joinCall(...)`.
5. `LiveKitVideoConfContext` fetches `/transport.config` and mounts `<LiveKitRoom>` in the portal: `audio`/`video` say whether to publish each track, and the chosen devices go in the room's `audioCaptureDefaults` / `videoCaptureDefaults` — see below.
6. LK connects.

### Calling a user from the user card or sidebar

The video-call button on the user card (hover/click a username) and in the sidebar user-info panel comes from `useVideoCallAction`. It creates a DM on-demand when one does not yet exist:

1. User clicks the video icon on the user card or user-info panel.
2. `useVideoCallAction` loads capabilities and closes the user card.
3. If a DM subscription already exists, its `rid` is used directly. If not, `POST /v1/im.create` creates the DM first and returns the new room's `rid`.
4. `dispatchPopup({ rid })` opens the `StartCallPopup` → standard call flow from there.

## 8. Who gets rung

Ringing is for the people a call is actually aimed at:

| Room                        | Rings  | Why                                                                        |
| --------------------------- | ------ | -------------------------------------------------------------------------- |
| Direct message (2 people)   | yes    | `direct` type; rung when the caller arrives, not when the call is created. |
| Multi-person direct message | yes    | Exactly the set of people meant, which is what makes ringing them right.   |
| Channel, team               | **no** | A call there is an invitation to whoever is around, not a summons.         |
| Added to a call in progress | yes    | They are being called _now_. Capped at `VIDEO_CONF_RINGING_LIMIT`.         |

A channel call is not silent, it is _announced_: a message in the room, and a row in the ongoing-calls list for
every member who could join it. Ringing a roomful of people who were not being called is the thing being avoided —
the more so because a channel is somewhere someone joined once, not a group they assembled to talk to.

The room decides whether ringing is possible; the caller decides whether it happens. The preflight carries a
**Ring participants** switch (default on, remembered in `videoconf-call-preferences` — see `useCallRingPreference`),
and it is shown only on the screen where confirming _creates_ the call, since a call that already exists was created
with its answer and a switch wired to nothing is worse than no switch. Adding people to a call in progress asks the
same question, and remembers the same answer: it is one habit, not two.

## 9. Discussion navigation in conference chat

When a member lacks read access to the call's room, the server creates a discussion and sets `discussionRid` on
the video conference record. The conference chat panel must navigate to that discussion so the member can
participate.

`useConferenceEmbedded` resolves the chat target as:

```
rid:  info.discussionRid  ||  info.rid
tmid: (no discussionRid  &&  chatMode === 'thread')  ?  info.messages.started  :  undefined
```

`discussionRid` takes priority regardless of `VideoConf_Persistent_Chat_Mode`. When a discussion exists, the
panel shows the discussion room directly — `tmid` is cleared so the panel does not try to render a thread inside
the discussion. When no discussion exists, the behaviour depends on the chat mode: `thread` opens the started
message as a thread in the parent room; `main_room` shows the parent room's timeline.

The `video-conference/${callId}/updated` stream event fires when `discussionRid` is set, which invalidates the
conference query and causes the panel to re-resolve its target — the navigation is reactive, not polled.

## 10. Known limitations

- **Single-process worker**. Supervisor only respawns one. No horizontal scaling story yet — for many concurrent rooms in a single workspace, you'd want multiple worker processes or external workers.

- **The send-resolution picker aims at the camera, not the encoder.** See _Send resolution_ above.

- **MediaPipe's WASM and model come from a CDN.** A workspace with no way out to the internet gets no blur. Serving
  them from `public/`, as the RNNoise assets already are, is what would fix it.

---

End.
