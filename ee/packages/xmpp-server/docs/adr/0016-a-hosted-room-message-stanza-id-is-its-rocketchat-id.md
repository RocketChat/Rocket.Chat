# A hosted-room message's stanza id is its Rocket.Chat `_id`

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** hosted rooms (`xmppFederation.role: 'host-muc'`), `src/muc/stanzas.ts`, `src/muc/MucRoom.ts`, the [room-history](../intents/room-history.md) intent, [message-deduplication](../specs/message-deduplication.md) R7

## Decision

- Once a hosted room stamps XEP-0359 ids, the `<stanza-id by="<room JID>"/>` of a message
  is the `_id` of that message in Rocket.Chat. The same value is the message's XEP-0313
  archive id.
- Every copy of a message carries the same stanza id: the live reflection to each occupant,
  and the copy replayed in discussion history on join.
- Nothing is minted, stored or backfilled. Every message ever stored in a hosted room already
  has its id, including those stored before stamping ships.
- A correction (XEP-0308) is not an archive entry. The archive serves the corrected message
  under its original id with its current text. The correction stanza carries its own id,
  which the archive never serves.
- A `<stanza-id/>` an occupant sends with `by` set to the room's JID is removed before the
  message is reflected, as XEP-0359 requires of the entity that assigns the id.

## Why

XEP-0313 pages by the stanza id the client last saw, so the archive id must be the id the
message carried live, and every message the archive serves needs one. The archive is the
messages collection (the intent rules out storing anything new), so the id has to be one
every stored message already has. `_id` is that id. Messages written in Rocket.Chat already
leave with their `_id` as the stanza's `id` attribute. Messages from remote occupants get a
derived `_id` when they are stored ([ADR
0014](0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)).

This is recorded now, before any stamping exists, because any scheme that mints ids would
leave every earlier message without one: shipping MAM would then mean backfilling the
messages of every hosted room, or an archive whose older half cannot be paged by id.

### Alternatives rejected

- **A new id per message in a new field.** Needs an index on `messages` that every
  installation builds, XMPP or not, and a backfill of every message already stored in a
  hosted room.
- **`federation.eventId`.** Only messages that came from XMPP have one; messages written in
  Rocket.Chat have none. The outgoing hook also reads it as "came from XMPP" and stops
  relaying edits for any message that carries it.
- **Time-ordered ids, so paging needs no lookup.** Changes the `_id` format for one
  consumer. Resolving the id with a primary-key read and paging by `ts` is enough.

## Consequences

- MAM's `after` and `before` resolve with `Messages.findOneById`, then page by `ts`.
- A message deleted, or pruned by retention, disappears from the archive. A client whose
  last-seen id was that message gets `item-not-found` and re-syncs, as XEP-0313 expects.
  The answer for a message the requester may not read is the same `item-not-found`, so the
  archive cannot be used to probe which messages exist.
- A remote occupant's message is reflected before it is stored, and ADR 0014 derives its
  `_id` only when the stanza carries an `id`, the secret is loaded and the derived id is
  free. The spec that starts stamping must make the reflected copy and the stored message
  share one id in every case.
- When stamping ships, [message-deduplication](../specs/message-deduplication.md) R7 no
  longer holds for hosted rooms and is amended in the same PR. Messages Rocket.Chat sends
  into remote rooms are unaffected: there the remote room assigns the stanza id.
- Retraction, reactions and replies (XEP-0424, XEP-0444, XEP-0461) in a hosted room
  reference a message by this id, so they resolve it with the same primary-key read.
