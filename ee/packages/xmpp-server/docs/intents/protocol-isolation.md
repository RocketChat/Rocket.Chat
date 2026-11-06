# Intent: One federation protocol per room

Author: Diego Sampaio. Status: accepted.

## Problem

Rocket.Chat federates over Matrix and over XMPP, and a room must belong to exactly one of
them: a room that mixes both is out of scope. Parts of that rule hold today, but no spec
states it and the parts disagree in form. A room created with both toggles silently becomes
a Matrix room. A remote JID cannot be added to a room that is not an XMPP hosted room
([hosted-muc R12](../specs/hosted-muc.md)), and a Matrix user cannot be added to a room
that is not Matrix-federated, but only when an inviter is present, and both errors name
federation rather than the protocol mismatch. Nothing says that a room's protocol cannot
change after creation, that a Matrix event addressed to an XMPP room is refused, that the
member picker hides users of the other protocol, or that a DM cannot mix a remote XMPP user
with a remote Matrix user.

## Proposed outcome

- Creating a federated room means choosing exactly one protocol, XMPP or Matrix. The
  create-room dialog has one "Federated" toggle; turned on, it requires a Matrix or XMPP
  choice with nothing preselected, and a protocol not enabled on the workspace is shown
  disabled with a hint saying so. The room is provisioned on that protocol only, and its
  protocol cannot be changed afterwards.
- Through the REST API a federated room names its protocol explicitly. A request that names
  both, or one not enabled on the workspace, is refused with a clear error.
- A DM needs no choice: its protocol follows the remote user.
- A room's messages leave over its own protocol only. Traffic of the other protocol
  addressed to it (a Matrix event; an XMPP groupchat, join or invitation) is refused, shows
  nothing to members and creates no identity, membership or room state. Neither protocol's
  discovery lists a room of the other.
- An XMPP stanza to an address on the MUC domain that no XMPP room owns gets what a room
  that does not exist gets: `not-allowed` for a join, `item-not-found` for messages,
  invitations and disco, with no `<text/>`. A Matrix or non-federated room cannot be told
  apart from an absent one, and such a stanza never reaches DM or invitation handling.
- Adding or inviting a remote user of the other protocol, from the UI or the REST API, at
  creation or later, alone or in a mixed list, is refused with a protocol-mismatch error per
  user; the users of the room's protocol in the same list are processed normally. The
  member picker suggests local users and remote users of the room's protocol only.
- A self-initiated join by a remote user of the other protocol is refused.
- A federated DM never gains a third member, of either protocol. A conversation that needs
  more people becomes a room.
- Local users join rooms of either protocol and speak in each through that room's protocol.

## Affected users and systems

- Room owners and administrators creating and populating federated rooms; remote users of
  both protocols.
- [hosted-muc](../specs/hosted-muc.md) R1, R4 (a missing room answers `not-allowed`), R12;
  [remote-muc](../specs/remote-muc.md); [direct-messages](../specs/direct-messages.md);
  [service-discovery](../specs/service-discovery.md), which already lists only XMPP rooms
  ([ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md)).
- The Matrix federation (`ee/packages/federation-matrix` and its Meteor hooks), the
  create-channel modal, the room-creation REST API, the add-users UI and the member search,
  all outside this package.

## Constraints

- [ADR 0006](../adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md): rooms and users
  carry `xmppFederation`; an XMPP room never carries `federation` or `federated: true`, which
  is how the two protocols tell their rooms apart today.
- The rule is symmetric: whatever an XMPP room refuses from Matrix, a Matrix room refuses
  from XMPP.
- The product never picks the protocol for the user, by default or by inference, because
  the choice cannot be undone. Two toggles are not kept: they suggest the protocols combine.
- A distinct error for a room of the other protocol would tell a sender which rooms exist,
  which [ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md) rules out.
- One shared check in the Rocket.Chat room layer classifies rooms and usernames by protocol
  and refuses a mismatch, with or without an inviter, including a room or DM that would
  carry both protocols. Each federation keeps its own hooks for creating users and room
  state. The existing Matrix error code keeps working for current callers.

## Open questions

- **Q1** ~~Is the protocol choice a new control in the create-room UI, replacing the two
  toggles?~~ Yes, a "Federated" toggle plus a required choice: see Proposed outcome.
- **Q2** ~~Which XMPP error does a stanza to a Matrix room's address get? The MUC domain
  only knows XMPP rooms, so to it the room does not exist (`item-not-found`), while the
  scenario asks for a rejection the sender can tell apart.~~ The errors of a room that does
  not exist: see Proposed outcome and Constraints.
- **Q3** ~~Does one shared check in the Rocket.Chat room layer own the protocol-mismatch
  error and the member-picker filter, or does each federation keep its own?~~ One shared
  check: see Constraints.
- **Q4** ~~Can a DM between a local user and a remote XMPP user gain a third member at all,
  or are federated DMs one-to-one only?~~ One-to-one only: see Proposed outcome.
