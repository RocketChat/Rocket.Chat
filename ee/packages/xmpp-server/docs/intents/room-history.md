# Intent: History for remote occupants of hosted rooms

Author: Diego Sampaio. Status: accepted.

## Problem

An XMPP user who joins a room Rocket.Chat hosts sees nothing that was said before they
joined, and nothing they missed while disconnected. Every other MUC they use replays recent
messages on join and lets their client page back through the archive. Rocket.Chat keeps the
full history of the room and serves none of it over XMPP.

The other direction already works: when Rocket.Chat joins a remote room it receives and
stores the room's discussion history ([remote-muc R10](../specs/remote-muc.md)).

## Proposed outcome

A remote occupant of a hosted room receives recent messages when joining. In a later round,
their client can also page back through the room's archive. The two mechanisms ship in that
order:

- XEP-0045 §7.2.13 and §7.2.14 discussion history, first: the room sends the last N messages, or
  messages since a timestamp, as part of the join. No queries, no paging; every client
  supports it, and so does another Rocket.Chat joining the room
  ([remote-muc R10](../specs/remote-muc.md)).
- XEP-0313 Message Archive Management on the room JID, later: the client queries the
  archive with filters and result-set paging (XEP-0059). It needs a stable XEP-0359 stanza
  id on every message the room sends, which Rocket.Chat does not stamp yet.

A joiner receives at most 20 messages of history, and fewer when its `<history/>` request
asks for fewer, by count, characters, age or `since`. A request for none gets none. The
replayed messages are what the room relayed live, with their current text and their
original time.

Once the room advertises `urn:xmpp:mam:2`, clients that support MAM join without history
and query the archive instead, so the two coexist without duplicating each other. That
includes another Rocket.Chat: its remote-room sessions catch up through MAM in the same
later round.

## Affected users and systems

- Remote occupants of hosted rooms; nothing changes for Rocket.Chat users.
- Their clients reach the room only through their own server over S2S; Rocket.Chat accepts
  no client connections. Both mechanisms work through that relay: the join and the archive
  query are stanzas addressed to the room, and the replies go to the occupant's full JID.
- [hosted-muc](../specs/hosted-muc.md): history on join is listed as out of scope and as
  Q2; [service-discovery](../specs/service-discovery.md) gains a feature;
  [message-deduplication R7](../specs/message-deduplication.md) changes when stanza ids are
  stamped. [remote-muc](../specs/remote-muc.md) becomes a MAM client in the later round.
- Rocket.Chat message retention settings and room-level permissions decide what may be
  served.

## Constraints

- A user who was not a member at the time must not receive messages from a private group's
  past if Rocket.Chat's own rules would not show them.
- Serving history must not store anything new; the archive is the messages collection.
- [ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md): only hosted rooms are
  queryable; never a user's DM archive.
- [ADR 0016](../adr/0016-a-hosted-room-message-stanza-id-is-its-rocketchat-id.md): a hosted
  room's stanza id, and so its archive id, is the message's Rocket.Chat `_id`. Messages
  stored before stamping ships already have one; nothing is backfilled.
- The history limit is a hard-coded 20, the Prosody and ejabberd default; a client's
  request can lower it, never raise it. Retention is not a limit: it only decides which
  messages still exist, and serving all of them on every join is a burst over S2S that MAM
  exists to avoid.
- Until MAM ships, a Rocket.Chat that was down while more than 20 messages were sent in a
  room it joined gets only the last 20 back. The limit is accepted for the first round;
  catch-up between Rocket.Chats moves to MAM, not to a larger or configurable limit.
- A remote user's DMs with a Rocket.Chat user are archived by the remote user's own server,
  which is the only archive XEP-0313 lets them query. Rocket.Chat serves no user archive.

## Open questions

- **Q1** ~~Discussion history on join only, MAM only, or both? Clients that support MAM skip
  the join history when the room advertises `urn:xmpp:mam:2`.~~ Both: join history first,
  MAM in a later round. See Proposed outcome.
- **Q2** ~~How much history on join: a fixed count, the client's `<history/>` request, or
  the room's retention?~~ A hard-coded 20, lowered by the client's request. See Proposed
  outcome and Constraints.
- **Q3** ~~Does MAM on user JIDs (a remote user querying their DM archive with a Rocket.Chat
  user) belong to this intent or is it never wanted?~~ Never: that archive lives on the
  remote user's server. See Constraints.
- **Q4** ~~Where do stanza ids come from for messages stored before this ships?~~ From
  their Rocket.Chat `_id`, which they already have. See Constraints.
