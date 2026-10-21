# Voice calls: taking over a call from another session

## What the feature does

A user with several sessions (browser tabs, desktop app, mobile) can **continue an ongoing call on a
different session** than the one it started on. The request is made from the session that is going to
pick the call up; the session that had it stops carrying the media.

Scope:

- `webrtc` calls only. `cti` calls are controlled remotely and have no media on the client.
- Only `active` calls. A call that is still being negotiated stays where it is.
- Only a user's own side of the call moves. The other party keeps the call and renegotiates media.
- Not available while the user has another unfinished call (second line or attended transfer).

## The contract

Each side of a call is signed by the single session that carries it (`caller.contractId` /
`callee.contractId`). Every signal from any other session is dropped by the server, which is what
keeps the other sessions out of the call. A take-over replaces that contract.

## Signals

- `take-over` (client → server) is sent by the session that wants the call. It carries
  `supportedFeatures`, like `answer` does, so features this session lacks are dropped from the call.
  It is exempt from the contract check, since by definition it comes from an unsigned session.
- `notification` with `session-changed` (server → every session of the user) carries the new owner in
  `signedContractId`. The session that matches becomes the owner; the previous owner lets go of the
  call without hanging it up.
- `request-offer` (server → new session) follows it, as for any renegotiation, so the new session
  starts the negotiation. The other party receives the offer as a regular renegotiation.

## Server

`UserActorSignalProcessor.processTakeOver` validates the request and calls
`MediaCallDirector.replaceActorContract`, which swaps the contract in a single update conditioned on the
old contract and on the call being `active`. If two sessions ask at the same time, only one update
matches. The server drives the renegotiation itself instead of waiting for a `negotiation-needed`
from the client, which a session that never negotiated this call could not send.

### Pending renegotiations

The caller is the impolite side of a negotiation: when both sides offer at once, the caller's offer wins
and the callee's is dropped. The new session starts with no knowledge of the negotiation in progress, so
if a callee-side take-over opened its own offer while the caller's offer was waiting for an answer, the
caller would queue the new offer behind its own pending one and neither side would move.

So a take-over waits, up to `TAKE_OVER_NEGOTIATION_TIMEOUT`, until the latest negotiation is not an
unanswered offer from the caller. The old session still owns the call meanwhile and answers it. If it
never does, for instance because that session is frozen, the call is ended: letting the swap go ahead
would leave it silent. Other pending offers need no wait: the caller's new offer replaces the callee's, and a new offer from
the callee replaces its own.

## Client

A session that does not carry the call still tracks it, as a hidden call (`busy-elsewhere`).
`MediaSignalingSession.canTakeOverCall` tells whether the main call is one of those and may be moved
here, and `takeOverCall` sends the `take-over` signal.

On `session-changed`, `ClientMediaCall` either acquires or releases the call:

- The new owner discards the idle connection it built while the call was hidden, creates a fresh one,
  and hands it the session's input track once the call is visible. The negotiation then proceeds from
  the server's `request-offer`.
- The previous owner stops its media and marks the call hidden. It does not send a hangup, so the
  call goes on. Hanging up from it later goes through the `another-client` hangup as for any hidden call.

## UI

The call widgets are not shown for a call carried by another session, so the action is in the navigation
bar, next to the hangup button, as `useMediaCallTakeOverAction`. It appears while
`MediaSignalingSession.canTakeOverCall` is true.

Nothing is sent back when the server ignores the request, so the call simply stays hidden.

A removed feature is not restored if a later session supports it again.
