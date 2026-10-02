# Intent: Recovery after an interrupted federation link

Author: Diego Sampaio. Status: draft.

## Problem

Outbound routes reconnect with backoff ([s2s-connectivity R10](../specs/s2s-connectivity.md)),
and on its own restart the service rebuilds hosted rooms and rejoins remote rooms
([configuration-and-lifecycle R7](../specs/configuration-and-lifecycle.md)). Everything
above the socket is not recovered when the link breaks or the peer restarts:

- a remote room that drops our sessions is never rejoined; those members cannot speak
  until our own service restarts ([remote-muc](../specs/remote-muc.md) out of scope:
  `muc.remoteSessionLost` is never emitted);
- hosted-room occupants whose server went away stay in the roster
  ([hosted-muc D2](../specs/hosted-muc.md#d2-occupants-are-never-removed-when-their-servers-connection-drops-suspected));
- contacts learn our users' presence only on the next status change
  ([presence](../specs/presence.md) open questions);
- a message that could not be delivered while the link was down is dropped, and the sender
  is not told ([direct-messages R8](../specs/direct-messages.md)).

## Proposed outcome

After connectivity to a peer is restored, federation resumes on its own: remote-room
sessions are rejoined, hosted-room rosters match who is really there, contacts see current
presence, and no identity is duplicated. A message that could not be delivered is either
delivered once the link is back or reported to its sender, never lost silently.

## Affected users and systems

- Every user in a federated conversation with a peer whose link drops or restarts.
- [remote-muc](../specs/remote-muc.md), [hosted-muc](../specs/hosted-muc.md) D2,
  [presence](../specs/presence.md), [direct-messages](../specs/direct-messages.md) R8,
  [s2s-connectivity](../specs/s2s-connectivity.md) R10.
- [PROJ-120](https://rocketchat.atlassian.net/wiki/spaces/RnD/pages/1307803678/PROJ-120+Native+XMPP+Server+Experience)
  §4 non-functional requirements (Recovery), §7.1 "Recover an interrupted S2S connection"
  and §7.10 "Recover federation state after server restart".

## Constraints

- [ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md): the
  database stays the source of truth; recovery rebuilds from it.
- Rejoining must not store the replayed history twice
  ([message-deduplication](../specs/message-deduplication.md)).
- XEP-0198 stays not planned unless this intent shows it is needed
  ([compliance.md](../compliance.md#not-planned)).

## Open questions

- **Q1** How does the service learn that a remote room dropped a session: an error presence,
  a failed send, a periodic XEP-0410 self-ping?
- **Q2** How long, and how often, does it retry a rejoin before giving up and telling the
  members?
- **Q3** Is "delivered once the link is back" a durable outbound queue (surviving a service
  restart), or is telling the sender enough?
- **Q4** Should hosted-room occupants of a domain be removed when its inbound connection
  closes, or only after a grace period, since peers close idle connections routinely?
