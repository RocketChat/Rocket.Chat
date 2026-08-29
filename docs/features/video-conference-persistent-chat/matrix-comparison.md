# How this compares to MatrixRTC

A comparison of how Rocket.Chat's conference membership work and Matrix's MatrixRTC each answer the same two
questions: **who is in this call right now**, and **who is allowed in it**.

Matrix side sourced from the current MSCs (August 2026 — all still open, and MatrixRTC has changed shape more than
once, so treat specifics as a moving target):

- [MSC4143: MatrixRTC](https://github.com/matrix-org/matrix-spec-proposals/blob/toger5/matrixRTC/proposals/4143-matrix-rtc.md) — sessions, slots, membership
- [MSC4075: MatrixRTC notifications & call ringing](https://github.com/matrix-org/matrix-spec-proposals/blob/toger5/matrixrtc-call-ringing/proposals/4075-rtc-notification-event.md)
- [MSC4310: MatrixRTC decline](https://github.com/matrix-org/matrix-spec-proposals/blob/toger5/matrixRTC-call-decline/proposals/4310-matrixRTC-call-decline.md)
- MSC4140 (delayed events), MSC4354 (sticky events), MSC4195 (LiveKit backend) — referenced by the above

## The one difference everything else follows from

**Matrix has no call object.** A MatrixRTC session "only exist[s] indirectly through the temporal overlap of
`m.rtc.member` events" — a session is the span of time during which one or more members are continuously joined to
the same slot. There is no record to create, no record to end, and no server that decides either. Clients read the
room's events and compute the answer.

**We have a call object.** `VideoConference` is a document with `_id`, `status`, `endedAt`, and a `users[]`
membership array. The server decides when a call starts, who is in it, and when it ends.

Everything below is downstream of that.

| | MatrixRTC | Rocket.Chat |
|---|---|---|
| Call identity | derived — a slot id plus overlapping membership | a `VideoConference` document with an `_id` |
| "Who is in it" | each client publishes its own `m.rtc.member`; readers aggregate | server-owned `users[]` with `joined` / `leftAt` |
| Presence liveness | a dead-man switch: a delayed leave event the client keeps resetting | reported departures plus server-side reconciliation |
| Call end | when the last membership lapses — nothing is written | `endCall` sets `endedAt` and `status: ENDED` |
| Access to the call | room membership, enforced at the media transport | conference membership **or** room access, enforced at the API |
| Chat access | identical to call access, always | a separate question, surfaced and resolvable |
| Ringing | `m.rtc.notification` with `lifetime`, targeted by `m.mentions` | server rings, capped at 10 recipients, one-shot |
| Decline | `m.rtc.decline` event referencing the notification | `declined` / `declinedAt` on the member's own entry |

## Keeping "who is in the call" honest

This is the hardest part of any call system, and the two designs solve it in opposite directions.

**Matrix — the client is the source of truth, and it must keep proving it.** A membership counts only while its
sticky event has not expired (default 4 hours). Because a browser that crashes never sends a leave, the MSC tells
clients to schedule the *leave* as a **delayed event** (MSC4140) with a 15–30 second delay *before* joining, then
periodically reset its timer. If the client stops resetting it, the homeserver fires the leave on its behalf. The
recovery is automatic and needs no server-side knowledge of calls at all.

**We — the server is the source of truth, and it reconciles.** Our equivalents accumulated one incident at a time:

| Failure | Our answer | Where |
|---|---|---|
| The tab closes | `pagehide` posts `leave` with `keepalive` | `useLeaveConferenceOnClose` |
| The window closes before the page ever ran | the opener polls `window.closed` and posts the leave | `useLeaveCallOnWindowClose` |
| The window died without reporting anything | the next join anywhere runs `leaveOtherCalls` | `service.addUserToCall` |
| Reload looks exactly like leaving | an emptied call waits `EMPTY_CALL_GRACE_MS` (10s) before ending | `lib/videoConference/callHistory.ts` |
| Nothing ever reports an end | expiry cron closes it after 24h | `videoConferencesCron` |

Four mechanisms and a cron where Matrix has one. The difference in kind: **Matrix's recovery is time-based and
runs without us; ours is event-based and only fires when something happens.** A user whose laptop sleeps mid-call
is corrected by Matrix within 30 seconds; with us they stay "in the call" until they, or someone else, next join
something — or for up to 24 hours.

> **Worth stealing.** A server-side lease is the single most valuable idea here. If joining recorded
> `presenceExpiresAt = now + 60s` and the call window refreshed it while alive, `isInVideoConference` would become
> "joined, not left, and not expired" — and the four mechanisms above would collapse into one that also covers the
> cases none of them do. It fits our model without adopting Matrix's: the field is already per-member, and
> `hasActiveParticipants` is already the one place that asks.

## Access control

**Matrix gates at two layers, neither of them the call.** Joining a slot requires the sender's room membership to
be `join` — so *room membership is call membership*, and the room's own join rules (public, invite, knock,
restricted) are the whole access story. Creating or modifying a slot needs power level. But the MSC is explicit
that "slots don't provide access control": a malicious client can ignore them and form a shadow session, so the
real enforcement is at the media transport — for LiveKit (MSC4195), a JWT the client can only obtain by proving
room membership.

**We gate at the API, and we deliberately split call access from chat access.** `canAccessConference` accepts
conference membership **or** access to `rid` **or** access to `discussionRid`. That first clause is the whole
point of the membership model: you can be in a call without being in any room. Matrix cannot express this — there,
being in the call *is* being in the room.

That split is our genuinely distinct idea, and it is also our extra work: it creates the "member who can't read
the chat" state, which needs surfacing (`chatAccess` on `video-conference.info`), a notice, and two remedies
(`share-chat`: invite, or move the chat to a discussion). Matrix gets chat access for free because it never
separated the two — and pays for it by having no way to pull an outsider into a call without giving them the
room.

Neither is strictly better. Ours suits "add the vendor to this call without showing them the channel"; Matrix's
suits "the room is the unit of trust, and nothing escapes it".

> **Worth noting against us.** Our enforcement is at the REST API only. The provider URL we hand out is a
> capability: anyone holding it can join the conference at the provider, membership or not. Matrix pushes
> enforcement down to the SFU precisely so that the media plane can't be reached by leaking a link. With Jitsi we
> could close this with a signed JWT per participant (`moderator`, `room`, `exp`), which is the same shape as
> MSC4195's LiveKit token. Today that gap exists.

## Ringing

| | MatrixRTC (MSC4075) | Rocket.Chat |
|---|---|---|
| Mechanism | `m.rtc.notification` event in the room | `api.broadcast('user.video-conference', { action: 'ring' })` per user |
| Who is rung | whoever is in `m.mentions` (a user list, or `room: true`) | every member being added, or the room's subscribers at start |
| Scale limit | none in the MSC; room-wide notification is gated by the `notifications.room` power level | hard cap: `VIDEO_CONF_RINGING_LIMIT` = 10, else nobody rings |
| Duration | `lifetime` on the event — 30s recommended, clients cap at 2 minutes | one-shot; the callee's client aborts after 10s, `ringingAt` is treated as live for 15s |
| Stops when | `sender_ts + lifetime` elapses, the sender disconnects, or all recipients join | the window lapses; nothing announces the end |
| Ring vs. notify | explicit `notification_type: "ring" \| "notification"` | implicit — a ring is a ring; a desktop notification accompanies it |

Two observations.

**Matrix's `lifetime` is better than our implicit windows.** We encode "how long is this still ringing" in three
places that must agree: a 10s client abort, a 15s `VIDEO_CONF_RINGING_WINDOW_MS` that every reader re-derives, and
a 40s outcome timeout. Matrix puts one number on the event and every reader obeys it. If we ever revisit ringing,
carrying an explicit expiry on the ring — rather than a constant compiled into clients — removes a whole class of
disagreement.

**Their ring stops when someone answers; ours doesn't.** MSC4075 stops the ring when all recipients join *or the
sender disconnects*. Ours has no such signal — a rung client discovers the call is over only by the 15s window
lapsing. That is the mechanism behind our "the ring can still be missed entirely" limitation.

The cap is ours alone, and it is a real product difference: a Rocket.Chat conference started in an 11-person
channel rings **nobody**, which is exactly why the ongoing-calls list had to exist. Matrix has no such cliff
because a notification is one event in a room the clients are already syncing — the fan-out we avoid is fan-out
they never have.

## Declining

Nearly convergent designs, arrived at separately.

MSC4310 adds `m.rtc.decline`, an event with an `m.reference` relation to the notification it answers. It does not
terminate the call for others — "on receipt of a decline from a participant, update that participant's state" —
it is visible to the room, it deliberately raises no push, and it is kept so that clients can "render when a
person tried to start a call and if that got declined".

Ours: `POST /v1/video-conference.decline` writes `declined` and `declinedAt` **on the decliner's own entry**,
never touches the conference's status, so the call stays reachable
afterwards. Same three properties: personal, non-terminating, persisted.

One difference worth keeping: because our decline is a field on the member rather than an event referencing a
particular ring, "did they decline *this* ring?" needs `declinedAt` compared against `ringingAt` — the comparison
`useCallOutcome` makes. Matrix gets that for free from the reference relation. Ours is the cheaper storage; theirs
is the cheaper question.

## Discovering an ongoing call

**Matrix:** free. The membership events are in the room; any client synced to the room already has them, so "is
there a call in this room" and "who is in it" need no request. That is also why Element Call can render a
participant list with no server support.

**Ours:** the expensive one. Announcing a call to everyone who could join it means a broadcast per room
subscriber — the same fan-out that makes ringing a large room impossible — so `GET /v1/video-conference.joinable`
is **polled every 20 seconds** by every client. The scan is over running conferences rather than the user's rooms,
which keeps it cheap server-side, but it is still a poll where Matrix has a push.

The asymmetry is not a design failure on our side; it is the cost of not having the call in a stream every client
is already subscribed to. The cheaper fix — noted in the feature doc's improvement suggestions — is a per-*room*
signal clients already subscribe to, rather than enumerating recipients.

## What each design buys

**MatrixRTC's strengths, honestly stated**
- Liveness is self-healing and time-bounded; a crashed client corrects itself in ~30s with no server involvement.
- No call record means no call record to get wrong: no stale `endedAt`, no expiry cron, no "ended twice".
- Discovery and the participant list are free, because state is already replicated to every client.
- The ring carries its own expiry, so no two readers disagree about whether it is still ringing.
- Enforcement reaches the media plane, not just the API.

**Ours**
- Membership independent of room membership — someone can be in a call without being given the room. Matrix
  structurally cannot do this.
- A durable per-member outcome (`ended`, `not-answered`, `ongoing`) written from the start. Matrix
  reconstructs history by replaying notification/decline events, and a call nobody answered
  leaves only a notification to interpret.
- One authoritative answer to "is this call still running", which is what lets the sidebar list and
  the room's message block agree without each client computing it.
- Chat that outlives the call, with an explicit, resolvable access model.

## If we were to borrow three things

1. **A presence lease** (`presenceExpiresAt`, refreshed by the call window). Replaces four recovery mechanisms
   with one, and covers the sleeping-laptop case none of them cover. Highest value, smallest change.
2. **An explicit expiry on the ring**, carried in the ring itself rather than compiled into clients as
   `VIDEO_CONF_RINGING_WINDOW_MS`, plus a "stop ringing" signal when someone answers or the caller gives up.
3. **Provider-level enforcement** — a per-participant signed token so the media plane checks membership too, and
   a leaked conference URL stops being a capability.

None of these require adopting Matrix's model. They are the parts of it that survive being separated from it.
