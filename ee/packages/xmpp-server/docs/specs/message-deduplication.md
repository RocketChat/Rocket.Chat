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
  whose replace id, or the id its sender gave it (the XEP-0359 `<origin-id/>`, otherwise the
  stanza `id`), is the `_id` of a stored Rocket.Chat message is ignored: it is our own relay
  reflected to another member's session, whatever stanza id the room assigned it.
- **R4** The outgoing hook never relays a message that carries `federation.eventId`, so a
  stored inbound message is not echoed back.
- **R5** In a hosted room, local members receive no stanza at all; copies reach Rocket.Chat
  only as the single `muc.messageReceived` event.
- **R6** Copies of one message that arrive at the same time are still stored once.
- **R7** Rocket.Chat does not stamp its outbound stanzas with `<origin-id/>` or
  `<stanza-id/>`.

## Design

`saveFederatedMessage` in the service computes the event id, looks it up with
`Messages.findOneByFederationId` and inserts; every inbound path goes through it. For R6 it
holds the event id in an in-memory set from the lookup until the insert settles, and drops
any copy whose id is in the set. That is enough because the service runs as one process per
XMPP domain ([ADR 0002](../adr/0002-integration-service-runs-only-as-a-microservice.md)); it
avoids a unique index on `federation.eventId`, a field Matrix federation writes too.

`RemoteMucSession.handleMessage` skips the own nick and reports two ids: the room's stanza id
for deduplication and the sender's id for R3. `onRemoteMucMessage` does the own-relay lookup
by `_id` with the replace id or the sender's id. R3 relies on the room keeping the sender's
`id` attribute on the reflection, as XEP-0045 §7.4 asks and as ejabberd and Prosody do.

## Out of scope

- Content-based deduplication.
- Stamping outbound stanzas (R7). A capability that needs stable outbound ids (retraction,
  receipts) adds it and updates this spec.

## Known defects

### D3 Copies without any id are never deduplicated

When a room message carries neither an `id` nor a stanza id, each copy gets a random event
id and every copy is stored. Whether a fix should cover this case is a design decision:
content hashing is lossy, and accepting room messages from only one member session per room
would change the session model. Test: `remote-muc.spec.ts`, "stores a message sent without
an id once".

## Open questions

- Should Rocket.Chat stamp its outbound room messages with `<origin-id/>` (R7), so that R3
  also holds in a room that rewrites the `id` attribute? Is that the same change
  [message-corrections D1](message-corrections.md#d1-corrections-from-xmpp-users-arrive-as-new-messages) needs?

## References

- XEP-0359
- [ADR 0007](../adr/0007-inbound-messages-are-deduplicated-by-federation-event-id.md)
