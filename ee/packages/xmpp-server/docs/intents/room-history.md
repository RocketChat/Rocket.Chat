# Intent: History for remote occupants of hosted rooms

Author: Diego Sampaio. Status: draft.

## Problem

An XMPP user who joins a room Rocket.Chat hosts sees nothing that was said before they
joined, and nothing they missed while disconnected. Every other MUC they use replays recent
messages on join and lets their client page back through the archive. Rocket.Chat keeps the
full history of the room and serves none of it over XMPP.

The other direction already works: when Rocket.Chat joins a remote room it receives and
stores the room's discussion history ([remote-muc R10](../specs/remote-muc.md)).

## Proposed outcome

A remote occupant of a hosted room receives recent messages when joining, and can fetch
earlier messages from their client. Which of the two mechanisms, or both, is the open
question below:

- XEP-0045 §7.2.14 discussion history: the room sends the last N messages, or messages since
  a timestamp, as part of the join. No queries, no paging; every client supports it.
- XEP-0313 Message Archive Management on the room JID: the client queries the archive with
  filters and result-set paging (XEP-0059). Needs stable XEP-0359 stanza ids on every
  message the room sends, which Rocket.Chat does not stamp yet.

## Affected users and systems

- Remote occupants of hosted rooms; nothing changes for Rocket.Chat users.
- [hosted-muc](../specs/hosted-muc.md): history on join is listed as out of scope and as an
  open question; [service-discovery](../specs/service-discovery.md) gains a feature;
  [message-deduplication R7](../specs/message-deduplication.md) changes if stanza ids are
  stamped.
- Rocket.Chat message retention settings and room-level permissions decide what may be
  served.

## Constraints

- A user who was not a member at the time must not receive messages from a private group's
  past if Rocket.Chat's own rules would not show them.
- Serving history must not store anything new; the archive is the messages collection.
- [ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md): only hosted rooms are
  queryable; never a user's DM archive.

## Open questions

- Discussion history on join only, MAM only, or both? Clients that support MAM skip the
  join history when the room advertises `urn:xmpp:mam:2`.
- How much history on join: a fixed count, the client's `<history/>` request, or the
  room's retention?
- Does MAM on user JIDs (a remote user querying their DM archive with a Rocket.Chat user)
  belong to this intent or is it never wanted?
- Where do stanza ids come from for messages stored before this ships?
