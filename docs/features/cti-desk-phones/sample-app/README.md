# CTI Gateway Sample

A Rocket.Chat App showing how to put calls on a user's desk phone instead of in their browser. It is
the template to copy when integrating a real telephony gateway; it is not installed by anything and no
packaged build of it is committed.

Each user registers their own number with `/cti-phone`, and the app fakes the far end answering a few
seconds after dialling, so it can be installed on a workspace with no PBX behind it and still drive a
call end to end.

## Registering a phone

```
/cti-phone                 shows the current number
/cti-phone +5551234        registers a number
/cti-phone remove          forgets it
```

Until a user registers a number they are offered no devices, and the picker does not appear for them.
That is deliberate: it is the same answer a real integration gives for someone its gateway does not
know, and it is worth keeping that path working rather than defaulting everyone to a fake device.

The registered number is the device id — it is what Rocket.Chat hands back on `dial` and stores on the
call, so the gateway can address the endpoint with it.

## What it demonstrates

A `cti` call splits into two directions, and the app has to hold up both ends:

| Direction | How | Where in the source |
| --- | --- | --- |
| Rocket.Chat asks the app to act | `IMediaCallHandler` control methods | `executeMediaCall*` |
| The app tells Rocket.Chat what happened | `modify.getMediaCallModifier()` | `report*` calls, `notifyDevicesChanged` |

The second direction is the one that surprises people: a `cti` call does not move in the Rocket.Chat UI
on its own. The gateway is what knows whether the line is ringing, up or cleared, so the widget only
changes when the app reports it. A control method that talks to the gateway but reports nothing back
leaves the call stuck.

Two more things the sample shows that a real integration needs:

- **Recognising its own calls.** Control commands are broadcast to every app implementing the handler,
  so each one must ignore calls it does not own. The sample checks the dialled device against the
  caller's registered number, tracks its live calls in persistence, and returns early otherwise.
- **Tolerating races.** `hangup` can arrive after the gateway already cleared the line, because the user
  pressing the red button and the far end hanging up are the same event arriving twice.

## Making it real

Replace the three stand-ins:

- `/cti-phone` and `executeGetMediaCallDevices` — a real integration has no registration command. It asks
  the gateway which endpoints belong to the user (usually keyed off an extension already on their
  Rocket.Chat profile) and returns those.
- `simulateFarEndAnswering` — delete it, and call `reportAnswered` / `reportActive` from your gateway's
  own events instead.
- The `inbound` endpoint — a real integration is driven by whatever the gateway pushes (a webhook, a
  socket event, a CSTA notification), not by an operator calling an endpoint by hand. Keep the
  `createIncomingCall` call, change what triggers it.

Every control method carries a comment showing the gateway request it stands in for.

## Building and installing

The workspace needs **Desk phones** enabled (`Admin → Voice Calls (VoIP) → Desk phones`), and the user
placing calls needs the `allow-external-voice-calls` permission — without either, the device picker
stays hidden and the app is never asked for devices.

```sh
cd docs/features/cti-desk-phones/sample-app
rc-apps package --force    # --force: the CLI compiles without skipLibCheck and trips on @types/node
rc-apps deploy --url http://localhost:3000 --username <admin> --password <password>
```

Grant `api`, `persistence`, `slashcommand`, `message.write` and `media-call.control` at install:
declaring permissions in `app.json` asks for them, it does not grant them, and the write accessor
answers nothing without `media-call.control`.

If packaging fails with `Invalid permission "media-call.control"`, see the note in
[`apps/meteor/tests/data/apps/app-packages/README.md`](../../../../apps/meteor/tests/data/apps/app-packages/README.md) —
the CLI validates against a stale copy of the permission list that predates this feature.

## Trying it

1. Run `/cti-phone +5551234` in any room to register a phone.
2. Open the call widget and start a new call. The device picker in the footer now lists
   **Desk phone (+5551234)** next to Rocket.Chat.
3. Pick it and call someone. Rocket.Chat asks no microphone permission — the audio is not its problem —
   and the widget rings, then goes active a few seconds later when the sample fakes the answer.
4. Mute, hold and the keypad all reach the app; the widget settles once the app confirms each back.
5. For the inbound half, post to the app's `inbound` endpoint. The call arrives on whichever number that
   user registered, so it answers `409` if they have not run `/cti-phone` yet:

```sh
curl -X POST "http://localhost:3000/api/apps/public/<appId>/inbound" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"<rocket.chat user id>","from":{"id":"5551234","displayName":"Reception"}}'
```

The user's widget rings as an incoming call; accepting it sends `answer` to the app, which is where the
gateway would be told to pick the line up.
