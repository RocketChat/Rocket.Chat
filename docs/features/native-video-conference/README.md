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

## Settings

Under **Video Conference → LiveKit** (enterprise):

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

## Data-channel messages

| Type | Reliable | Payload | Meaning |
| --- | --- | --- | --- |
| `hand` | yes | `{ raised, raisedAt, rebroadcast? }` | Raised hands. `rebroadcast` restates a hand for someone who arrived later; only new hands chime. |
| `reaction` | no | `{ emoji, reactionId? }` | Floating reactions, 3.5s on receivers. |
| `mute` | yes | `{ target }` | Asks one participant to mute. Only the target acts on it, by muting itself; nothing reaches into anyone's machine. |

Reactions rise from the call area with the sender's name, and raised hands are listed next to the participants button,
because a call can be larger than the tiles it shows.

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
- Background blur and noise suppression ship in a follow-up.
