# Voice calls: attended transfer (second line)

## What the feature does

A user may have only one voice call at a time. Attended transfer lets them **put the current call on
hold and place a second call to the person they want to transfer to**, instead of handing the other
party over blindly. There is still only one *active* call; the other is parked.

Scope:

- `webrtc` calls only. `cti` calls keep the one-call rule.
- Outgoing calls only. A user with any unfinished call, held or not, is busy for incoming calls.
- One session per user. The consultation call is requested from the session holding the first call.
- The UI shows one call, the "most active" one. Showing held calls is later work.

## How it works

The transfer modal has an **Ask first** toggle, shown only when the call supports `hold`. With it on,
the modal's button calls `MediaSignalingSession.startAttendedTransfer`, which puts the main call on
hold and creates a local call under a temporary id, as `startCall` does. It then sends the
`attended-transfer` signal. Without the toggle, the `transfer` signal is the blind transfer it always
was.

### The `attended-transfer` signal

`callId` is the call being held; `requestedCallId` is the temporary id of the consultation call and
`to` is who to call. It is a separate signal from `transfer`, which has a different meaning: the other
party is handed over and the call ends.

### Server

- A blind transfer asks the *other* party's agent to call the target, and creating that call hangs up
  the parent.
- `CallSignalProcessor.processAttendedTransfer` requests a call from the transferring user (not the
  other party) to the target, with `requestedCallId`, `parentCallId` set to the held call and
  `attended: true`. It is ignored for non-`webrtc` calls. It refuses an id that matches a real call and
  ignores one that was already requested.
- The new call stores `attended: true` (`IMediaCall.attended`). Because of it:
  - `InternalCallProvider` does not hang up the parent call.
  - The `new` signal omits `replacingCallId`. Otherwise the client would treat the consultation call
    as a replacement of the held one.
  - `OutgoingSipCall` omits the `Referred-By` header.
- The one-call check still applies. It ignores the parent call (`parentCallId` as `exceptCallId`), so
  the consultation call passes, while any other pair of unrelated calls is still refused.
- A refused request sends `rejected-call-request` with the `requestedCallId`, which ends only the
  consultation call on the client, as for any outgoing call.

### Completing the transfer

While the consultation call and the held call are both in progress, the widget shows a **Complete
transfer** button. It sends the `complete-attended-transfer` signal on the consultation call.

The consultation call is always placed to an actor of the same type as the held call's other party
(`requiredCalleeType`), so the two legs are either both internal or both SIP.

**Both legs internal.** `CallSignalProcessor.processCompleteAttendedTransfer` creates a new call from the
actor on the held call to the consulted actor. The call:

- has `parentCallId` set to the held call, so the caller's `new` signal carries `replacingCallId` and its
  client treats the call as an outbound call it requested, as in a blind transfer;
- stores `replacedCallIds` (the held call and the consultation call), which let both users be in the
  new call while still in the old ones;
- reaches the consulted actor with the `replaces-call` flag, so their client accepts it right away,
  never reports it as ringing, and no push notification is sent;
- ends the replaced calls once it becomes active (`MediaCallDirector.hangupReplacedCalls`), so both
  actors keep talking to the transferring user until they are connected to each other.

Both clients share the session's input track, so the microphone is not requested again.

If the new call fails, the replaced calls are left alone and no `rejected-call-request` is sent for
them.

**Both legs SIP.** The media does not go through Rocket.Chat, so the two SIP parties are connected to
each other with an attended transfer as defined by SIP:

- Each SIP leg saves the identity of its dialog (`IMediaCall.sipDialog`: Call-ID and both tags) when the
  dialog is created, so any server instance can use it, whichever one owns the leg.
- `processCompleteAttendedTransfer` flags the held call as transferred to the consulted actor, with
  `transferReplacesCallId` set to the consultation call. This is the same flag a blind transfer uses, so
  the instance that owns the held leg reacts to it.
- That leg sends a `REFER` whose `Refer-To` is the consulted actor's URI with a `Replaces` header built
  from the consultation call's dialog (`SipServerSession.sendReferRequest`). The referred party calls the
  consulted party, who replaces the dialog with Rocket.Chat by it and ends the consultation call.
- Rocket.Chat does not hang up anything itself. The calls end when the SIP parties end their dialogs,
  as for a blind transfer. If the consultation call has no saved dialog, the transfer is not attempted;
  if the `REFER` fails, the held call is ended, as in a blind transfer.

### Client (`@rocket.chat/media-signaling`, `ui-voip`)

- `getMainCall` prefers a busy call that is not held, then ringing, then pending, then a held busy
  call. With only held calls left it keeps `lastState.mainCall` when it is one of them. The
  consultation call becomes the main call as soon as it exists, and the held call returns to being
  the main call when the consultation ends.
- Controls still act on `instance.getState()`, so they always act on the main call.
- A **Switch call** button shows while two calls are in progress. `swapCalls` holds the main call and
  resumes the other one.

## Known gaps

- **Apps.** `parentCallId` and the pre-call-created hook describe transfers; an app sees the
  consultation call as one, and `attended` is not exposed to apps yet.
- **Resuming.** `setHeld(false)` does not check that no other call is live. Nothing in the UI can
  resume a call other than the main one today.
- **Multiple sessions.** A second session of the same user cannot tell a held call from a live one.
  This relies on a single session; closing the gap needs the server to know about hold.
