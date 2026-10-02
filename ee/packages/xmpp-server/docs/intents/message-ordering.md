# Intent: Inbound messages keep the order they were sent in

Author: Diego Sampaio. Status: draft.

## Problem

No spec promises that messages are shown in the order the sender sent them, and the code
does not guarantee it. Inbound handlers run detached and concurrently
([configuration-and-lifecycle R9](../specs/configuration-and-lifecycle.md)), and a message's
timestamp is taken when it is stored, after the user and room lookups. Two messages sent in
quick succession over one stream can be stored in reverse order. RFC 6120 §10.1 requires a
server to deliver stanzas from one entity in the order received.

## Proposed outcome

Messages from one sender in one conversation, DM or room, appear in Rocket.Chat in the order
they arrived on the stream, under load and with concurrent conversations. Outbound messages
reach the peer in the order the Rocket.Chat user sent them. Ordering holds without a
duplicate ([message-deduplication](../specs/message-deduplication.md)).

## Affected users and systems

- Every Rocket.Chat user receiving federated messages.
- [direct-messages](../specs/direct-messages.md), [hosted-muc](../specs/hosted-muc.md),
  [remote-muc](../specs/remote-muc.md), [configuration-and-lifecycle](../specs/configuration-and-lifecycle.md) R9.
- PROJ-120 scenario 7.4 "Preserve message ordering".

## Constraints

- RFC 6120 §10.1 (in-order processing).
- A slow conversation must not stall others; ordering is per conversation, not global.
- Ties into [scale-and-availability](scale-and-availability.md): the ordering guarantee
  must survive more than one instance if that intent allows it.

## Open questions

- Order by arrival, or by the sender's XEP-0203 `<delay/>` stamp where present (history
  replay, offline delivery)?
- Is the outbound side already ordered (one route per domain, one queue), or can the
  `afterSaveMessage` hook reorder concurrent saves?
