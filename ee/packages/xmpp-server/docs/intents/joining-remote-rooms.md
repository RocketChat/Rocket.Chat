# Intent: Joining remote rooms from Rocket.Chat

Author: Diego Sampaio. Status: draft.

## Problem

A Rocket.Chat user can only enter a room hosted on another XMPP server after someone in
that room invites them ([remote-muc R1](../specs/remote-muc.md); joining from the UI is out
of scope there). A user who knows the address of an existing room has no way in, and has no
way to find one. The Bifrost bridge this server replaces could join a public room by name,
so retiring it without this loses a capability users had
([interop-certification](interop-certification.md)).

## Proposed outcome

- A Rocket.Chat user can join an existing remote room by its address, without an
  invitation, subject to the room's own admission rules and to
  [federation-authorization](federation-authorization.md).
- The mirrored group is named and shown exactly as an invited one is
  ([remote-muc R1](../specs/remote-muc.md)), so the route in does not change how the room
  looks.
- A join the room refuses tells the user why, instead of only emitting
  `muc.remoteJoinFailed` ([remote-muc R5](../specs/remote-muc.md)).

## Affected users and systems

- Rocket.Chat users who take part in rooms on other servers.
- [remote-muc](../specs/remote-muc.md) R1, R5 and its out-of-scope list;
  [service-discovery](../specs/service-discovery.md) if rooms are browsed.
- The Rocket.Chat channel-creation or directory UI.
- PROJ-120 scenario 7.6, "Join an existing external MUC".

## Constraints

- [ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md) and
  [ADR 0009](../adr/0009-one-remote-muc-session-per-local-member.md) hold: one session per
  local member, entry is an explicit act.

## Open questions

- Join by typed room JID only, or also by browsing a remote MUC service's `disco#items`?
- Who else sees a group that a user joined on their own: only them until they add members,
  as with an invitation?
- Password-protected and members-only remote rooms: in scope, or refused with a clear
  message?
