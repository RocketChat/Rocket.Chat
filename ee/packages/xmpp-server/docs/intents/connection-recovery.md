# Intent: Recovery after an interrupted federation link

Author: Diego Sampaio. Status: accepted.

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
presence, and no identity is duplicated. A message that could not be delivered is reported
to its sender, never lost silently.

A lost remote-room session is rejoined silently, with the backoff outbound routes already
use ([s2s-connectivity R10](../specs/s2s-connectivity.md): 1 s doubling up to 5 min), and
at once when the room's domain connects to us again. It keeps trying for as long as the
member is in the channel. Nothing is shown in the room: a member who sends while the
session is down is told that message was not delivered. History the room replays on rejoin
is merged in without duplicates. This is what XEP-0410 asks of a client and what Prosody's
`mod_ping_muc` does on the server side; neither announces the outage to the room.

A session the room ended on purpose is not rejoined. The member is removed from the
mirrored channel, with the reason the room gave, and comes back only through a new
invitation ([ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md)). When the
remote room is destroyed, the mirrored channel is deleted: the room belongs to the remote
server, so its end is the channel's end.

The drop (room, remote domain, reason when known), every attempt and its result, each
undelivered message (id, sender, room), each removal, and the recovery with its total
downtime are logged.

## Affected users and systems

- Every user in a federated conversation with a peer whose link drops or restarts.
- [remote-muc](../specs/remote-muc.md), [hosted-muc](../specs/hosted-muc.md) D2,
  [presence](../specs/presence.md), [direct-messages](../specs/direct-messages.md) R8,
  [s2s-connectivity](../specs/s2s-connectivity.md) R10.
- The room UI, for the undelivered-message notice and the removal message.
- [federation-authorization](federation-authorization.md): sessions a revocation closed are
  rejoined the same way when access returns.

## Constraints

- [ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md): the
  database stays the source of truth; recovery rebuilds from it.
- Rejoining must not store the replayed history twice
  ([message-deduplication](../specs/message-deduplication.md)).
- XEP-0198 stays not planned unless this intent shows it is needed
  ([compliance.md](../compliance.md#not-planned)).
- A remote-room session counts as lost when the room sends our self-presence `unavailable`
  (status 110) other than a nick change (303), an error presence, or `not-acceptable` to our
  message, or when an XEP-0410 self-ping gets a "not joined" answer. Each session self-pings
  after 15 minutes of silence from the room, and at once when an inbound connection from the
  room's domain is established. A timeout or a `remote-server-*` error means the link is
  down, not that the session is lost.
- A loss is terminal, and never retried, when the room ended the session on purpose: a ban
  (301), a kick (307 without 333), a removal from a members-only room (321, 322), or a
  destroyed room (`<destroy>`, XEP-0045 §10.9). A rejoin answered with `forbidden`,
  `registration-required`, `not-authorized`, `item-not-found` or `not-allowed` is terminal
  too. A kick for a technical error (307 with 333) and a service shutdown (332) are
  recoverable. Rejoining a destroyed room is never attempted: on Prosody and ejabberd
  defaults it would create the room again, owned by our user.
- A terminal loss removes the member from the mirrored channel, which is what keeps a
  restart from rejoining them ([ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)).
  The room rarely tells a non-occupant they were unbanned or made a member again, so the
  way back is a new invitation. A destroyed room deletes the mirrored channel instead; an
  alternate venue the `<destroy>` names is not followed, since joining a remote room is by
  invitation only.
- A closed S2S connection is not evidence that an occupant left: peers close idle streams
  routinely (RFC 6120 §4.6.3), and there is one connection per direction. A hosted-room
  occupant is removed, broadcast as unavailable with status 333, when they bounce an error
  presence or message, or when a stanza to them fails with `remote-server-not-found` or
  `remote-server-timeout` (XEP-0045 §18.1.2), as Prosody and ejabberd do.
- No durable outbound queue in S1: an undelivered message is reported to its sender.
  Losing it silently is not acceptable, and delivering it very late can mislead. A durable
  queue may come in a later release. Like Prosody, ejabberd and Openfire, the service holds
  stanzas in memory while it reconnects, then answers with the error RFC 6120 requires.
- The sender is told with an ephemeral "couldn't deliver to `<domain>`" notice, which
  disappears on reload. Rocket.Chat has no stored delivery state for a message; adding a
  stored failed state is core message and UI work, left for a later release.

## Open questions

- **Q1** ~~How does the service learn that a remote room dropped a session: an error
  presence, a failed send, a periodic XEP-0410 self-ping?~~ All three: see Constraints.
- **Q2** ~~How long, and how often, does it retry a rejoin before giving up and telling the
  members?~~ It never gives up while the member is in the channel, using the route backoff,
  and the room shows nothing: see Proposed outcome.
- **Q3** ~~Is "delivered once the link is back" a durable outbound queue (surviving a
  service restart), or is telling the sender enough?~~ Telling the sender, for S1: see
  Constraints.
- **Q4** ~~Should hosted-room occupants of a domain be removed when its inbound connection
  closes, or only after a grace period, since peers close idle connections routinely?~~
  Neither; on delivery errors: see Constraints.
- **Q5** ~~Is a session the room ended on purpose rejoined: a kick (status 307 without 333),
  a ban (301), a removal (321, 322), a destroyed room? Retrying forever against `forbidden`
  is wrong.~~ No; the member is removed from the channel: see Constraints.
- **Q6** ~~How is the sender told a message failed: an ephemeral notice that disappears on
  reload, or a stored failed state on the message, with an error icon and perhaps a retry,
  which needs core message and UI work?~~ An ephemeral notice, for S1: see Constraints.
