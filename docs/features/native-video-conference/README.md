# LiveKit native video conference

LiveKit is a **native provider of the Video Conference feature**: the camera button starts a LiveKit call the same
way it starts a Jitsi or Google Meet call, but the call runs inside Rocket.Chat's own
[conference window](../video-conference-persistent-chat/README.md) instead of at the provider's page. How to deploy
LiveKit next to Rocket.Chat is in [deployment.md](deployment.md). The feature as a whole (providers, the message
block, ringing) is described in [video-conference.md](../video-conference.md).

## Where the call runs

The call is mounted by the conference window's composition root, around the window, and nowhere else:

- The window looks up the component registered for the call's `providerName` (`embeddedCallProviders`, filled at
  client startup) and wraps itself in it. Core code never names LiveKit; the registration line does.
- The LiveKit component connects once the window has joined, and provides the call contexts from
  `@rocket.chat/ui-conference` (call state, call actions, devices, diagnostics). The window's
  header, stage and controls read those contexts directly: no portal, no state pushed back up to a parent.
- The tree is the same before and after the join, so connecting never remounts the window.

The LiveKit client is its own package, `@rocket.chat/ui-livekit`, loaded lazily so the SDK stays out of the bundle for
every other provider.

Because the call only renders in the window, the server registers the provider only when LiveKit is fully configured
**and** `VideoConf_Conference_Window_Enabled` is on. A provider in the registry is one the camera button offers, and
offering one that has nowhere to render turns a misconfiguration into a silent, audio-only call.

LiveKit is also sold apart from the rest of video conferencing: it needs the `video-conference-native` license module
on top of `videoconference-enterprise`. The provider is registered only while the license includes it, and is withdrawn
as soon as a license without it is applied, no restart needed. `video-conference.callConfig` checks it too, since a call
started while it was licensed outlives the license: from then on nobody can join or rejoin it.

## Settings

Under **Video Conference → LiveKit** (the `video-conference-native` module):

| Setting | Purpose |
| --- | --- |
| `VideoConf_LiveKit_Enabled` | Master switch. |
| `VideoConf_LiveKit_Url` | The `wss://` address clients connect to. Not public: clients receive it with their token. |
| `VideoConf_LiveKit_Api_Key` / `VideoConf_LiveKit_Api_Secret` | Used to mint participant tokens locally (HS256). |
| `VideoConf_LiveKit_Token_TTL` | Token lifetime in hours (default 6). A participant cannot stay in a call longer than this. |

Changing any of them re-evaluates the provider registration; no restart is needed.

## Presence and authorization

- **The roster is the only record of who is in a call.** There is no server→LiveKit control path: no admin token,
  nothing that asks the SFU who is in a room. Presence is held by the same
  [leases](../video-conference-persistent-chat/README.md#knowing-who-is-still-in-the-call) every provider uses. Asking
  LiveKit as well meant two records that could disagree, and the disagreement is worse than the staleness it would fix.
- **Credentials follow conference access, not room access.** `video-conference.callConfig` authorizes
  with `canAccessConference`, like every conference endpoint. A member added from outside the room (the third person
  in a DM call) has no subscription to check, and checking for one refused them their own call.

## Devices

The preflight is where devices are chosen, and the choice is remembered per account (`useCallDevicesInitialState`).
Changes made during a call are written back to the same record, so the next preflight starts from them.

- **Chosen devices and resolution are capture defaults, not capture options.** `audio`/`video` on the room only
  describe the track published on the way in; a call joined muted would drop the chosen microphone with the `false`.
  The capture defaults are read every time a track is created, so a camera first turned on mid-call opens at the
  chosen resolution.
- **The room is asked which device is in use.** The app's device store is only written from inside a call, so on arrival
  it answers with the first device the browser enumerated. The call listens for `ActiveDeviceChanged` and corrects the
  store from `getActiveDevice`, which is the device obtained rather than the one requested.
- **The preflight camera is a LiveKit track**, opened at the same capture preset the call will use. What the call
  sends can be a smaller simulcast layer than that.

## Send resolution

The camera menu offers *Auto / 1080p / 720p / 360p / 180p*, and the local tile shows what is actually being sent
(the tallest `outbound-rtp` layer). The encoder picks simulcast layers for the bandwidth available, so the two differ.

Choosing restarts the camera at the new preset, and the choice is remembered only once the restart succeeded. Chosen
with the camera off, it is remembered straight away and applied when the camera comes back on.

## Noise cancellation

The microphone menu offers *Off / Standard / Advanced*: no filter, the browser's `noiseSuppression`, or RNNoise
(`@sapphi-red/web-noise-suppressor`) in an AudioWorklet. The browser's filter is the default, since it is what calls
had before there was a choice.

- **RNNoise never runs on top of the browser's filter.** Two suppressors in a row eat into the voice, so choosing it
  first restarts the microphone with `noiseSuppression: false`, and the room's audio capture defaults follow the
  choice so a microphone opened later starts that way. The restart passes every constraint the track has: the ones
  passed replace them all, and without the device the restart opens the browser's default microphone.
- **RNNoise gets its own 48 kHz `AudioContext`.** It was trained at that rate, and the room's context runs at the
  output device's, often 44.1 kHz.
- **It fails rather than sends silence.** A context the browser keeps suspended (no user gesture yet in this window), or
  one the browser cannot feed a microphone into at another rate (Firefox), would publish a silent track. The processor
  throws instead and the call falls back to the browser's filter. A failure at the start of the call keeps the choice
  on offer, since choosing it from the menu is the gesture it lacked; a failure the reader asked for hides it.
- **The workspace serves the files** at `/video-conference/rnnoise/` from the installed package, gzipped, so clients
  never reach a third party. About 125 KB, fetched the first time it is chosen; the WebAssembly is
  kept for the page. The URLs carry no version, so the files are revalidated (`Last-Modified`) rather than cached for
  a while: an upgrade would otherwise pair a new client with an old worklet.
- **A browser that cannot run RNNoise** (no AudioWorklet) never tries: a remembered *Advanced* runs, and shows, as
  *Standard*.

## Background effects

The camera menu's **Appearance** entry opens a panel beside the call: a preview of the reader's own camera, and the
backgrounds to put behind them: none, blur, one of the workspace's preset images, or an image they upload.
`@livekit/track-processors` runs MediaPipe's segmenter on the camera track, so the people watching see the effect, not
just the reader.

- **The browser is asked up front.** The library is loaded when the call starts, only to ask whether this browser can
  run an effect (WebGL2 and the insertable streams the processor needs). A browser that cannot is never offered the
  entry.
- **The segmenter is loaded the first time an effect is chosen**, and switched in place after that, so changing
  effect does not restart the camera. A new camera track gets the effect that was running.
- **A change that fails keeps the effect that was running**, and only takes the background off when that cannot be
  put back either. An image that cannot be loaded counts as a change that fails, rather than an effect left running
  with nothing behind the reader.
- **Uploaded images are read before the camera gets them.** One the browser cannot decode is turned away with a
  message, since the processor would only find out once it was already in use and leave no background at all. Images
  larger than 1920 pixels on their longer side are scaled down first. They are kept for the call only, at most
  `MAX_BACKGROUND_IMAGES`.
- **The workspace serves the files** at `/video-conference/segmentation/`: MediaPipe's runtime from the installed
  `@mediapipe/tasks-vision`, and the model from `apps/meteor/private/video-conference/`. They are compressed, about
  3 MB for the runtime, and revalidated like RNNoise's.
- **Preset images are the workspace's**, in `apps/meteor/private/video-conference/backgrounds/`.
  `video-conference.backgrounds` lists the ones present, each by id with the URL it is served at,
  `/video-conference/backgrounds/<id>`, so the client never names a file.
- **`@livekit/track-processors` comes from GitHub**, at a commit of livekit/track-processors-js main (`67aca1a`), for
  confidence masks and temporal smoothing, which make the edges steadier than the published release.
  That archive has no build, so a patch (`.yarn/patches/`) points the package at its TypeScript source. Both go once a
  release carries them.

The model is `selfie_multiclass_256x256_fp16.tflite`, derived from Google's MediaPipe multiclass selfie segmenter
(`selfie_multiclass_256x256`, float32), as published at
https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite.
Its weights are converted to float16, which halves the file to 8.3 MB with no visible difference
(SHA-256 `3e3b6ae9c1c1cd2307c9355d2075998fdca8e1a2f95936634169d4f544127830`). It keeps fingers whole and chairs in the
background more reliably than the selfie segmenter. The model is licensed under the Apache License 2.0, as stated in
its
[model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Multiclass%20Segmentation.pdf); a copy of the
license and a notice of the change sit beside it (`LICENSE`, `NOTICE`).

## Data-channel messages

| Type | Reliable | Payload | Meaning |
| --- | --- | --- | --- |
| `hand` | yes | `{ raised, raisedAt, rebroadcast? }` | Raised hands. `rebroadcast` restates a hand for someone who arrived later; only new hands chime. |
| `reaction` | no | `{ emoji, reactionId? }` | Floating reactions: seen for 3s, kept for 3.5s on receivers. |
| `mute` | yes | `{ target }` | Asks one participant to mute. Only the target acts on it, by muting itself; nothing reaches into anyone's machine. |

Reactions rise from the call area with the sender's name, and raised hands are listed next to the participants button,
because a call can be larger than the tiles it shows.

Raised hands are a queue. The top bar names the front of it — "You" when that is the reader — and lists the whole line,
including hands whose tiles are not on screen. On the tiles that are, only the front of the queue gets a green plate:
anyone else in line gets a white one with their place in it, so whose turn is next reads at a glance however many hands
are up.

A sender's latest reaction also sits in the top-left corner of their own tile, opposite the microphone, for exactly as
long as it rises (`REACTION_VISIBLE_MS`) — not for the provider's longer `REACTION_TTL_MS`, which only bounds how long it
is kept. A newer reaction from the same person replaces it and starts the time over.

## Who gets rung

| Room | Rings | Why |
| --- | --- | --- |
| Direct message (2 people) | yes | Rung when the caller arrives, not when the call is created. |
| Multi-person direct message | yes | Exactly the people meant. |
| Channel, team | **no** | An invitation to whoever is around, announced by the call message. |
| Added to a call in progress | yes, if asked | One add is capped at `RING_RECIPIENTS_LIMIT` people, so all of them can be rung. |

The preflight's **Ring participants** switch lets the caller decide, and is remembered.

## Known limitations

- The resolution picker restarts the camera with a capture preset, which is a hint to the camera rather than a cap on
  the encoder. Publish options would be the right tool.
- No e2e coverage for the native flow yet.
