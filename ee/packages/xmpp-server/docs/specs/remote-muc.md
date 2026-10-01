---
status: partial
standards: [XEP-0045, XEP-0249]
adrs: [0006, 0007, 0008, 0009, 0012]
code:
  [
    src/muc/RemoteMucSession.ts,
    src/muc/MucService.ts,
    src/muc/stanzas.ts,
    src/XMPPServer.ts,
    src/service/XMPPServerService.ts,
    apps/meteor/ee/server/hooks/xmpp/index.ts,
  ]
tests: [src/muc/RemoteMucSession.spec.ts, src/muc/stanzas.spec.ts, tests/integration/muc.spec.ts, tests/end-to-end/remote-muc.spec.ts]
---

# Spec: Remote rooms

## Summary

A room hosted on another XMPP server is mirrored into Rocket.Chat as a channel after a
remote user invites a local user. Each local member of the mirrored channel is joined into
the remote room as their own occupant, and messages flow both ways.

## Motivation

The other half of group chat: Rocket.Chat users taking part in rooms the rest of the XMPP
network already uses. Entry is by invitation only ([ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md)).

## Behaviour

**Entry**

- **R1** A MUC invitation addressed to a local user, mediated (XEP-0045 §7.8.2) or direct
  (XEP-0249), creates the inviter's user record and, when no room mirrors that MUC yet, a
  public channel named `xmpp_<room localpart>` stamped
  `xmppFederation: { role: 'remote-muc', muc: <room JID>, origin: <room domain> }` with the
  invitee as its first member. An invitation into a MUC that is already mirrored adds the
  invitee as a member of the existing channel.
- **R2** The invitee is then joined into the remote room with their own session: occupant
  JID `<username>@<domain>/rocketchat`, nick `<username>`
  ([ADR 0009](../adr/0009-one-remote-muc-session-per-local-member.md)).
- **R3** Every local member added to the mirrored channel later is joined the same way; a
  member who leaves or is removed leaves the remote room.
- **R4** On service start every member of every mirrored channel is rejoined.
- **R5** A join the room refuses (an error presence while joining) drops the session and
  emits `muc.remoteJoinFailed` with the error condition. Nothing is retried.

**Messages**

- **R6** A `groupchat` message with a body from the room, from a nick other than the
  session's own, is stored in the mirrored channel once, authored by a user record for that
  occupant. When the occupant discloses no real JID the record is keyed
  `<nick>#<room JID>`.
- **R7** The id used for storage and deduplication is the room's XEP-0359 `<stanza-id/>`
  when present, otherwise the stanza id ([message-deduplication](message-deduplication.md)).
- **R8** A message saved by a local member is sent to the room as a `groupchat` from their
  occupant JID with the message `_id` as id, after joining when the member has no session.
  Edits are sent as corrections ([message-corrections](message-corrections.md)).
- **R9** The room's reflection of our own message is not stored again: the session skips its
  own nick, and the service skips a message whose replace id or sender-given id is a stored
  Rocket.Chat message id ([message-deduplication R3](message-deduplication.md)).
- **R10** The discussion history the room replays on join is stored like any other message
  and deduplicated by R7, which is how messages sent while the service was down are caught
  up. In decode-only mode no history is requested.

**Occupants**

- **R11** The session tracks the room's occupants from their presence and emits
  `muc.remoteJoined` (with the roster), `muc.remoteOccupantJoined` and
  `muc.remoteOccupantLeft`. These are counted by the service and have no effect on the
  mirrored channel's membership.

## Design

`MucService.handlePossibleInvite` parses both invitation forms for stanzas addressed to a
local user. `XMPPServer` keeps the session map and routes any message or presence whose
`from` is a room we hold a session for to that `RemoteMucSession`, before anything else.
The session is the client-side state machine (`joining`, `joined`, `leaving`, `closed`).
The service creates the shadow room on invite, joins and leaves on membership hooks, rejoins
on start, and persists `muc.remoteMessage`.

## Out of scope

- Joining or searching a remote room from the Rocket.Chat UI; bookmarks (XEP-0048, XEP-0402).
- Showing remote occupants as members of the mirrored channel (R11 counts only).
- Affiliations, roles, moderation, subject changes, room configuration on the remote room.
- Nick conflicts: the nick is the username; a conflict is a failed join (R5).
- Reconnecting a session the room dropped: `muc.remoteSessionLost` is declared but never
  emitted, and `RemoteMucSession.markStale` is never called.
- Direct invitations sent by Rocket.Chat; the hosted-room side sends mediated invites only.

## Known defects

Defects that show in remote rooms but are owned elsewhere:

- messages without any id: [message-deduplication D3](message-deduplication.md#d3-copies-without-any-id-are-never-deduplicated)
- corrections stored as new messages: [message-corrections D1](message-corrections.md#d1-corrections-from-xmpp-users-arrive-as-new-messages)

## Open questions

- The mirrored channel is created as a public channel (`t: 'c'`) visible to the whole
  workspace, though only invitees are joined into the remote room. Should it be a private
  group?
- Should remote occupants become members of the mirrored channel, so the member list is
  truthful, or stay as authors only?
- When the remote room drops a session (room destroyed, kick, server restart), should the
  service rejoin, and after how long?

## References

- XEP-0045 §7.2 (entering), §7.4 (exiting), §7.8 (invitations); XEP-0249; XEP-0359
- [ADR 0009](../adr/0009-one-remote-muc-session-per-local-member.md)
