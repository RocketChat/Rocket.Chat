# Intent: Messages keep the order they were sent in

Author: Diego Sampaio. Status: accepted.

## Problem

No spec promises that messages are shown in the order the sender sent them, and the code
does not guarantee it. Inbound handlers run detached and concurrently
([configuration-and-lifecycle R9](../specs/configuration-and-lifecycle.md)), and a message's
timestamp is taken when it is stored, after the user and room lookups. Two messages sent in
quick succession over one stream can be stored in reverse order. RFC 6120 §10.1 requires a
server to deliver stanzas from one entity in the order received. Outbound is not ordered
either: nothing on the way to the socket reads the message's `ts`, and two messages saved
back to back reach the socket in whichever order their awaits finish.

## Proposed outcome

Messages from one sender in one conversation, DM or room, appear in Rocket.Chat in the order
they arrived on the stream, under load and with concurrent conversations. History a remote
room replays appears at the time it was originally sent. Outbound messages reach the peer in
the order the Rocket.Chat user sent them. Ordering holds without a duplicate
([message-deduplication](../specs/message-deduplication.md)).

## Affected users and systems

- Every Rocket.Chat user sending or receiving federated messages.
- [direct-messages](../specs/direct-messages.md), [hosted-muc](../specs/hosted-muc.md),
  [remote-muc](../specs/remote-muc.md), [configuration-and-lifecycle](../specs/configuration-and-lifecycle.md) R9.

## Constraints

- RFC 6120 §10.1 (in-order processing).
- A slow conversation must not stall others; ordering is per conversation, not global.
- The XMPP server service is a single instance
  ([scale-and-availability](scale-and-availability.md)), so ordering needs no coordination
  between instances.
- A message carrying an XEP-0203 `<delay/>` stamp is ordered by it, but the stamp is trusted
  only when it comes from the remote room (history replay), is clamped so it is never later
  than arrival, and never moves a room's last-message time backwards. XEP-0203 warns that
  stamps can be forged.
- A message without a stamp takes its time when the stanza is dispatched, before any
  lookup. Inbound handling is serialized per stream, which the back-pressure decision in
  [scale-and-availability](scale-and-availability.md) requires as well.
- Outbound sends are serialized per room from the moment the message's `ts` is assigned, so
  the order on the wire matches `ts`.

## Open questions

- **Q1** ~~Order by arrival, or by the sender's XEP-0203 `<delay/>` stamp where present
  (history replay, offline delivery)?~~ By the stamp where it is present and trusted, by
  arrival otherwise: see Constraints.
- **Q2** ~~Is the outbound side already ordered (one route per domain, one queue), or can
  the `afterSaveMessage` hook reorder concurrent saves?~~ Not ordered today: see Problem
  and Constraints.
