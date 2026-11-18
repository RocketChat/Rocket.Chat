# Intent: Joining remote rooms from Rocket.Chat

Author: Diego Sampaio. Status: accepted.

## Problem

A Rocket.Chat user can only enter a room hosted on another XMPP server after someone in
that room invites them ([remote-muc R1](../specs/remote-muc.md); joining from the UI is out
of scope there). A user who knows the address of an existing room has no way in, and has no
way to find one.

## Proposed outcome

- A Rocket.Chat user can join an existing remote room by typing its address, without an
  invitation, subject to the room's own admission rules and to
  [federation-authorization](federation-authorization.md).
- A members-only room can be joined when the user is on its member list. A
  password-protected room is refused with a message saying so.
- The mirrored group is named and shown exactly as an invited one is
  ([remote-muc R1](../specs/remote-muc.md)), so the route in does not change how the room
  looks.
- Only the user who joined sees the group, as with an invitation. A second local user who
  joins the same remote room is added to the same group, never to a duplicate, as an
  invitation into an already mirrored room is ([remote-muc R1](../specs/remote-muc.md)).
- A join the room refuses tells the user why, instead of only emitting
  `muc.remoteJoinFailed` ([remote-muc R5](../specs/remote-muc.md)).

## Affected users and systems

- Rocket.Chat users who take part in rooms on other servers.
- [remote-muc](../specs/remote-muc.md) R1, R5 and its out-of-scope list.
- The Rocket.Chat UI, which needs a new screen to join a room by its address.

## Constraints

- [ADR 0009](../adr/0009-one-remote-muc-session-per-local-member.md) holds: one session per
  local member. [ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md) holds for
  hosted rooms; its invitation-only entry into remote rooms is what this intent reverses, and
  the spec that ships it supersedes that part. Entry stays an explicit act.
- A room is joined by its typed address only. Browsing a remote MUC service's room list
  (`disco#items`) comes in a later release, so
  [service-discovery](../specs/service-discovery.md) does not change.
- Defense networks control room access through membership rather than shared passwords,
  which is why members-only rooms are in scope and password-protected ones are not.

## Open questions

- **Q1** ~~Join by typed room JID only, or also by browsing a remote MUC service's
  `disco#items`?~~ Typed address only: see Constraints.
- **Q2** ~~Who else sees a group that a user joined on their own: only them until they add
  members, as with an invitation?~~ Only them: see Proposed outcome.
- **Q3** ~~Password-protected and members-only remote rooms: in scope, or refused with a
  clear message?~~ Members-only in scope, password-protected refused: see Proposed outcome.
