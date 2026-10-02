---
status: partial
standards: [XEP-0045]
adrs: [0006, 0008, 0009, 0012, 0015]
code:
  [
    src/muc/MucService.ts,
    src/muc/MucRoom.ts,
    src/muc/stanzas.ts,
    src/iq/disco.ts,
    src/XMPPServer.ts,
    src/service/XMPPServerService.ts,
    apps/meteor/ee/server/hooks/xmpp/index.ts,
  ]
tests: [src/muc/MucRoom.spec.ts, src/muc/stanzas.spec.ts, tests/integration/muc.spec.ts, tests/end-to-end/hosted-muc.spec.ts]
---

# Spec: Hosted rooms

## Summary

A Rocket.Chat channel or group created as **XMPP Federated** is a Multi-User Chat room on
`conference.<domain>`. Remote XMPP users join it as occupants; Rocket.Chat members appear to
them as occupants too. Messages flow both ways and membership is mirrored both ways.

## Motivation

Group conversations are where federation matters most, and MUC is the only room protocol
every XMPP client speaks. Hosting the room on the Rocket.Chat side keeps membership and
history in Rocket.Chat and lets remote users join with nothing but a room address.

## Behaviour

**Room lifecycle**

- **R1** A room created with the XMPP Federated toggle is stamped
  `xmppFederation: { role: 'host-muc', muc: '<escaped name>@<MUC domain>', origin: <domain> }`.
  No other room is reachable on the MUC domain ([ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md)).
- **R2** The room is registered with the protocol core when it is created and again on every
  service start, with its topic as subject and each Rocket.Chat member as a virtual occupant
  (role `moderator` for the owner, `participant` otherwise). It is registered again whenever
  its Rocket.Chat settings change, so a switch between public channel and private group
  changes R3's listing and features at once, and a new topic is the subject the next
  newcomer receives.
- **R3** Public channels are listed by `disco#items` on the MUC domain and describe themselves
  as `muc_public`/`muc_open`; private groups are unlisted and `muc_hidden`/`muc_membersonly`
  ([service-discovery R4, R5](service-discovery.md)).

**Joining and leaving**

- **R4** A join presence to `<room>@<MUC domain>/<nick>` is admitted when the room exists and
  either the room is a public channel or the occupant's bare JID already holds a
  subscription (was invited). Otherwise it is refused: `registration-required` for a private
  group, `forbidden` when the room does not exist or the occupant is banned.
- **R5** A nick already used by a different JID is refused with `conflict`.
- **R6** On admission the newcomer receives the presence of every current occupant, every
  remote occupant receives the newcomer's presence, the newcomer receives their own presence
  with status code 110, and then the room subject. Status 201 is never sent.
- **R7** An admitted remote occupant becomes a member of the Rocket.Chat room: their user
  record is created or refreshed, renamed to their nick ([addressing R10](addressing.md)),
  and a subscription created, unless one exists.
- **R8** An `unavailable` presence from an occupant removes them from the room, is broadcast
  to the remaining remote occupants, and removes their Rocket.Chat subscription without
  running the room-leave callbacks.
- **R9** Removing a remote member on the Rocket.Chat side kicks them: the remaining remote
  occupants receive their `unavailable` presence with status code 307.
- **R10** Removing or a leave by a local member broadcasts their `unavailable` presence to
  remote occupants.

**Invitations**

- **R11** A remote JID added as a member, at creation or later by a local user, receives a
  mediated invitation (XEP-0045 §7.8.2) from the room on behalf of the inviter and holds a
  subscription from that moment, which is what admits them under R4.
- **R12** A JID cannot be added to a room that is not an XMPP hosted room; the API answers
  `error-xmpp-users-in-non-xmpp-rooms`.

**Messages**

- **R13** A `groupchat` message with a body from a current occupant (identified by their
  real JID) is reflected to every other remote occupant under the occupant's nick with the
  original id, and stored in the Rocket.Chat room with the occupant's user as author,
  renamed to their nick.
- **R14** A message saved by a local member is sent to every remote occupant as a `groupchat`
  from `<room>/<username>` with the message `_id` as id. Edits are sent as corrections
  ([message-corrections](message-corrections.md)).
- **R15** Local members receive remote messages through Rocket.Chat only; no stanza is ever
  sent to a virtual occupant.

## Design

`MucService` is the registry (`<localpart>` to `MucRoom`) and routes stanzas addressed to the
MUC domain. `MucRoom` is the state machine: occupants keyed by nick with an `isLocal` flag,
join authorization through the `authorizeMucJoin` delegate, presence fan-out to remote
occupants only, groupchat reflection. The service implements the delegate against the
rooms and subscriptions collections, handles `muc.occupantJoined`, `muc.occupantLeft` (left
only, a kick is the echo of a removal) and `muc.messageReceived`, and exposes
`registerHostedRoom`, `addHostedRoomMember`, `removeHostedRoomMember` and
`inviteToHostedRoom` to the Meteor hooks. Flows are drawn in
[architecture.md](../architecture.md#message-flow-end-to-end).

## Out of scope

Parts of XEP-0045 not implemented:

- Room configuration forms (§10), owner and admin IQ, affiliations beyond what disco reports.
- Moderation other than kick: ban, voice, role changes initiated from the XMPP side.
- Discussion history on join (§7.2.14): the newcomer receives no backlog.
- Room passwords, nick changes (status 303), room destruction (§10.9).
- Private messages between occupants (§7.5), subject changes from occupants (§8.1):
  `muc.subjectChanged` is declared but never emitted.
- Invitation declines (§7.8.2 decline) and direct invitations from a hosted room: rooms
  send mediated invites only.
- Rooms that are Rocket.Chat teams or discussions.
- Membership changes to the Rocket.Chat room by remote moderators.

## Known defects

### D1 Kicked XMPP users are not told they were removed

When Rocket.Chat removes an XMPP user from a room it hosts, the other occupants get the
`unavailable` presence with status 307 but the removed user does not. Their client keeps
showing them in the room. Where: `MucRoom.kick` deletes the occupant before building the
recipients list. Test: `hosted-muc.spec.ts`, "tells the kicked XMPP user they were removed".

### D2 Occupants are never removed when their server's connection drops

Hosted-room occupants are keyed by JID and only leave on an `unavailable` presence or a
kick. When the S2S connection to their server is lost nothing removes them, so later
messages keep being sent to them and the room roster is stale until their server
reconnects. Where: nothing acts on `connection.lost` on behalf of the rooms. Test:
`tests/integration/muc.spec.ts`, "drops the occupants of a server whose connection is
lost"; the end-to-end harness cannot sever the link to ejabberd, so this one is an
integration test.

### D3 A new topic does not reach occupants already in the room

XEP-0045 §8.1 has the room send every occupant a message carrying the new `<subject/>` when
it changes. A topic changed in Rocket.Chat becomes the subject only for whoever joins next
(R2); occupants already in the room keep the old one. Where: `MucRoom.setSubject` stores the
subject without broadcasting it. Test: `hosted-muc.spec.ts`, "tells occupants already in
the room about a new topic".

### D4 A deleted room keeps running until the service restarts

Deleting a hosted room in Rocket.Chat leaves it registered with the protocol core. Remote
occupants still in it keep exchanging messages through our server, a public one stays
listed by `disco#items` ([service-discovery R4](service-discovery.md)) and `disco#info`
still describes it instead of answering `item-not-found` ([service-discovery R6](service-discovery.md)).
New joins are refused, since no Rocket.Chat room hosts the JID. Where: nothing calls
`mucDestroyRoom` when a room is deleted. Test: `hosted-muc.spec.ts`, "closes the room when it
is deleted in Rocket.Chat".

## Open questions

- Should a kick carry the reason given in Rocket.Chat? `MucRoom.kick` accepts one and
  ignores it.
- Should the room send history on join from Rocket.Chat's message history, or is that a job
  for MAM (pending triage)?

## References

- XEP-0045 §6 (discovery), §7.2 (entering), §7.4 (exiting), §7.8 (invitations), §8.2 (kick)
- [ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md),
  [ADR 0009](../adr/0009-one-remote-muc-session-per-local-member.md)
