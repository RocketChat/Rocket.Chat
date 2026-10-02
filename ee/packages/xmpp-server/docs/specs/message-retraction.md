---
status: draft
standards: [XEP-0424]
adrs: [0007]
code: []
tests: []
---

# Spec: Message retraction

## Summary

Deleting a message in an XMPP room tells the other side to remove it too, and a retraction
sent by an XMPP user removes the message in Rocket.Chat. XEP-0424 Message Retraction is the
mechanism. Today deletions stay local on both sides.

## Motivation

A user who deletes something they regret expects it gone on the other side as well. The
end product commits to this; it also closes the asymmetry with
[message-corrections](message-corrections.md), which already carries edits.

## Behaviour

- **R1** Every outbound message carries `<origin-id xmlns='urn:xmpp:sid:0' id='<message _id>'/>`
  so that a later retraction can reference it. This changes
  [message-deduplication R7](message-deduplication.md).
- **R2** When the author deletes a message that was sent to XMPP, a `<message/>` of the same
  type and addressing is sent with `<retract xmlns='urn:xmpp:message-retract:1' id='<original id>'/>`,
  a `<fallback xmlns='urn:xmpp:fallback:0' for='urn:xmpp:message-retract:1'/>` and a body
  explaining the retraction for clients that do not support it. In a DM the id is the
  origin id; in a room it is the room-assigned stanza id when the room stamps one.
- **R3** A `<retract/>` from the original sender of a stored message deletes that message in
  Rocket.Chat the way a local delete does (same callbacks, same client notification), or
  replaces it with a tombstone, per the open question.
- **R4** A `<retract/>` referencing a message the sender did not author, or an unknown id, is
  ignored.
- **R5** A hosted room relays a retraction from an occupant to the other occupants and
  applies R3.
- **R6** `urn:xmpp:message-retract:1` is advertised in `disco#info`.
- **R7** Deletions by someone other than the author (moderation) are not sent; see open
  questions.

## Design

Decided in the plan.

## Out of scope

- Moderated retraction by a room moderator (XEP-0425).
- Retracting a message older than the receiving side's own retention rules allow; the other
  side decides.

## Known defects

None; not implemented.

## Open questions

- Tombstone or hard delete on receipt (R3)? XEP-0424 recommends that the receiver keep a
  tombstone when it archives, and Rocket.Chat already has a "message deleted" rendering.
- Do Rocket.Chat's delete permissions and time limits (`Message_AllowDeleting`,
  `Message_AllowDeleting_BlockDeleteInMinutes`) apply to inbound retractions, or does the
  sender's server decide?
- R7: should a moderator's deletion in a hosted room be relayed as XEP-0425, or left local?
- Inbound messages stored since [ADR 0014](../adr/0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)
  can be found by the sender's id through their derived `_id`, and by the room's id through
  `federation.eventId`. Messages stored before it can only be found by `federation.eventId`.
  Accept, or backfill?
- A retraction in a remote room of a Rocket.Chat user's own message references the stanza id
  the room assigned it, which is never recorded (ADR 0014, Consequences). Where should it be
  recorded, given that `federation.eventId` would stop the outgoing hook relaying edits?
- With a client that sets an `<origin-id/>` different from its `id` attribute, the derived
  `_id` follows the `id` attribute (what corrections reference), so a DM retraction by origin
  id falls back to `federation.eventId`, which uses the `id` attribute too. Is a lookup by
  origin id needed at all?

## References

- XEP-0424, XEP-0359, XEP-0428 (fallback indication), XEP-0425 (not planned)
