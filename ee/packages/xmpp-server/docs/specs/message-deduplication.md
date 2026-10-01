---
status: partial
standards: [XEP-0359]
adrs: [0007, 0009]
code: [src/muc/RemoteMucSession.ts, src/service/XMPPServerService.ts, apps/meteor/ee/server/hooks/xmpp/index.ts]
tests: [src/muc/RemoteMucSession.spec.ts, tests/end-to-end/direct-messages.spec.ts, tests/end-to-end/remote-muc.spec.ts]
---

# Spec: Message deduplication

## Summary

Every message that arrives from the wire is stored exactly once, whatever the number of
copies the network delivers, and nothing Rocket.Chat sent is stored again when it comes
back. The rule is one event id per message, derived from the ids XMPP already carries
([ADR 0007](../adr/0007-inbound-messages-are-deduplicated-by-federation-event-id.md)).

## Motivation

Copies are normal in XMPP: a peer redelivers after a dropped stream, a remote room reflects
every message to each of our member sessions, and a room with an archive rewrites ids on the
way. Without a dedup rule a three-member mirrored room stores every message three times.

## Behaviour

- **R1** An inbound message is stored with `federation.eventId = 'xmpp:<origin domain>:<id>'`.
  A message whose event id is already stored is dropped.
- **R2** `<id>` is the XEP-0359 `<stanza-id/>` the room assigned when the stanza carries one,
  otherwise the stanza `id`, otherwise a random id. The origin domain is the sender's domain
  for a DM and a hosted room, and the room's domain for a remote room.
- **R3** In a remote room, a `groupchat` from the session's own nick is ignored, and a message
  whose replace id or stanza id is the `_id` of a stored Rocket.Chat message is ignored: it
  is our own relay reflected to another member's session.
- **R4** The outgoing hook never relays a message that carries `federation.eventId`, so a
  stored inbound message is not echoed back.
- **R5** In a hosted room, local members receive no stanza at all; copies reach Rocket.Chat
  only as the single `muc.messageReceived` event.
- **R6** Copies of one message that arrive at the same time MUST still be stored once. Not
  met, see D1.
- **R7** Rocket.Chat does not stamp its outbound stanzas with `<origin-id/>` or
  `<stanza-id/>`.

## Design

`saveFederatedMessage` and `onIncomingMessage` in the service compute the event id, look it
up with `Messages.findOneByFederationId` and insert. `RemoteMucSession.handleMessage`
prefers the stanza id and skips the own nick; `onRemoteMucMessage` does the own-relay lookup
by `_id`.

## Out of scope

- Content-based deduplication.
- Stamping outbound stanzas (R7). A capability that needs stable outbound ids (retraction,
  receipts) adds it and updates this spec.

## Known defects

### D1 Concurrent copies of one message are all stored

When several copies of the same stanza arrive at once, Rocket.Chat stores every copy. The
check and the insert are two steps, the event id index is not unique, and inbound handlers
run concurrently, so copies that arrive together all pass the check.

- Remote room: the room sends one copy per member session, so a message posted there is
  stored once per Rocket.Chat member.
- Direct messages: a stanza redelivered with the same id straight after the first is stored
  twice. Copies a second or more apart are deduplicated.

Where: the persistence path in `XMPPServerService.ts`. Tests: `remote-muc.spec.ts`, "stores a
message from the room once, whatever the number of member sessions"; `direct-messages.spec.ts`,
"stores a redelivered stanza id once".

### D2 A member's own message comes back from a room that assigns its own ids

When a Rocket.Chat member posts in a remote room, the room reflects the message to every
other member's session. R3 recognizes the reflection only if the id we sent comes back
unchanged. A room that archives messages replaces it with its own XEP-0359 stanza id, as
ejabberd and Prosody do, so the reflection is stored again, once per other member, under a
synthetic `nick#room` user. Where: `onRemoteMucMessage`. Test: `remote-muc.spec.ts`, "does
not store a member's own message again when the room reflects it to the other sessions".

### D3 Copies without any id are never deduplicated

When a room message carries neither an `id` nor a stanza id, each copy gets a random event
id and every copy is stored. Whether a fix should cover this case is a design decision:
content hashing is lossy, and accepting room messages from only one member session per room
would change the session model. Test: `remote-muc.spec.ts`, "stores a message sent without
an id once".

## Open questions

- A unique index on `federation.eventId` would make D1 a write conflict instead of a
  duplicate. Does any other federation path write that field without an id?
- For D2, recording the id we sent alongside the room's id (the XEP-0359 `origin-id`) would
  let the reflection be matched. Is that the same change [message-corrections D1](message-corrections.md#d1-corrections-from-xmpp-users-arrive-as-new-messages) needs?

## References

- XEP-0359
- [ADR 0007](../adr/0007-inbound-messages-are-deduplicated-by-federation-event-id.md)
