# Desk-phone calls (the `cti` service)

Lets a user place and receive calls on a desk phone from the Rocket.Chat UI. The phone is registered to
a PBX, not to Rocket.Chat, so **Rocket.Chat carries no media for these calls** — it holds the call, shows
the widget, and acts as a remote control. A Rocket.Chat App does the actual work by talking to a CTI
gateway.

There is a [sample app](./sample-app/) that stands in for such an integration.

## Where it plugs in

`CallService` gained a second value beside `webrtc`:

| Service | Media | Who drives the call |
| --- | --- | --- |
| `webrtc` | The browser, over a peer connection (relayed to SIP when needed) | Rocket.Chat |
| `cti` | An external device, on the PBX | An app, through its gateway |

A `cti` call is modelled as two legs, the same shape a SIP call already had:

- the **controlling user** — an ordinary `UserActorAgent`, which is what drives the widget;
- the **app-backed side** — a `CtiActorAgent`, which forwards to the app instead of signalling a client.

The agent is chosen from the call's `service` rather than from a new actor type, so `MediaCallActorType`
stays `user | sip`.

## What changes on the client

`ClientMediaCall` runs control-only when `service === 'cti'`: no webrtc processor is created, no
microphone is captured, and the SDP negotiation states are skipped — including their timeouts, which
would otherwise hang the call up for failing to negotiate something it never had.

Mute and hold stop being local operations. On a webrtc call the client mutes its own track; on a `cti`
call the audio is on the phone, so the client sends `mute` / `hold` signals and waits for the backend to
confirm the new state. The widget applies the change optimistically and settles when the app reports back.

## The two directions an app implements

| Direction | Mechanism |
| --- | --- |
| Rocket.Chat → app | The `executeMediaCall*` methods on `IMediaCallHandler` |
| App → Rocket.Chat | `modify.getMediaCallModifier()` — `createIncomingCall`, the `report*` methods, and `notifyDevicesChanged` |

Control is **broadcast** to every app implementing the handler, so an app must recognise its own calls
and ignore the rest. `getDevices` is the exception: results are aggregated across apps, and Rocket.Chat
tags each device with the app that offered it.

Rocket.Chat caches the device list and has no way of noticing when an app's answer would change, so an
app that adds, removes or renames a device must call `notifyDevicesChanged(userId)` — otherwise the user
has to reload before the change reaches the picker.

A call does not progress on its own. Rocket.Chat does not know whether the line is ringing, up or
cleared — only the gateway does — so the widget moves when the app reports it and not before.

## Enabling it

- **Setting:** `VoIP_TeamCollab_CTI_Enabled` (Admin → Voice Calls (VoIP) → Desk phones), off by default.
  It lives in the `teams-voip` licensed group, so the license gates it.
- **Permission:** the user needs `allow-external-voice-calls`. Without it they are offered no devices and
  cannot be rung on one.
- **App permission:** the integrating app needs `media-call.control`; the write accessor answers nothing
  without it.

With the feature off, the device picker never appears and the client does not even ask for devices.

## Testing without hardware

Two apps exist for this, and they are deliberately different:

- [`sample-app/`](./sample-app/) — the reference integration. Users register a phone with `/cti-phone`,
  and it fakes the far end answering on a timer, so a human can click through a call against a workspace
  with no PBX behind it. Source only; build it with `rc-apps package`.
- `media-call-cti-test` (in `apps/meteor/tests/data/apps/app-packages/`) — the automated-test fixture. It
  waits to be told what happens next over a `POST /advance` endpoint, so specs stay deterministic instead
  of sleeping.
