# Inbound messages are deduplicated by `federation.eventId`, preferring the XEP-0359 stanza id

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/service/XMPPServerService.ts`, `src/muc/RemoteMucSession.ts`, `apps/meteor/ee/server/hooks/xmpp`

## Decision

- Every message received from the wire is stored through `Message.saveMessageFromFederation`
  with `federation.eventId = 'xmpp:<origin-domain>:<id>'`, where `<id>` is the XEP-0359
  `<stanza-id/>` when the stanza carries one, the stanza `id` otherwise, and a random id when
  it carries neither. A message whose event id is already stored is dropped.
- The outgoing hook never relays a message that carries `federation.eventId`.
- In a remote room, a reflected message whose `<replace/>` id or stanza id is the `_id` of a
  stored Rocket.Chat message is dropped before any of the above: it is our own relay coming
  back.

## Why

The federation event id already exists for Matrix and already keeps inbound messages from
being echoed back out; reusing it needs no new field or index. Preferring the room-assigned
stanza id matters in remote rooms, where every local member holds a session and the same
message arrives once per session: the room's own id is the one thing all copies share.

### Alternatives rejected

- **A per-room "first session wins" rule.** Avoids the copies at the source, but which session
  is first changes on every restart, and a room that never stamps ids would still produce
  copies under the rule.
- **Content hashing.** Lossy; two identical messages in a row are legitimate.

## Consequences

- The check-then-insert is not atomic and the event id index is not unique, so copies that
  arrive within the same tick are all stored
  ([message-deduplication D1](../specs/message-deduplication.md#d1-concurrent-copies-of-one-message-are-all-stored)).
- A room that rewrites ids (MAM-enabled ejabberd and Prosody) defeats the own-relay check
  ([D2](../specs/message-deduplication.md#d2-a-members-own-message-comes-back-from-a-room-that-assigns-its-own-ids)).
- Copies without any id cannot be deduplicated at all
  ([D3](../specs/message-deduplication.md#d3-copies-without-any-id-are-never-deduplicated)).
- Rocket.Chat does not stamp its own outbound stanzas with XEP-0359 ids; a capability that
  needs them (retraction, receipts) has to add that.
