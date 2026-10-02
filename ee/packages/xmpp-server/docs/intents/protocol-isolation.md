# Intent: One federation protocol per room

Author: Diego Sampaio. Status: draft.

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

- Creating a federated room means choosing exactly one protocol, XMPP or Matrix. The room
  is provisioned on that protocol only, and its protocol cannot be changed afterwards.
- A room's messages leave over its own protocol only. Traffic of the other protocol
  addressed to it (a Matrix event; an XMPP groupchat, join or invitation) is refused, shows
  nothing to members and creates no identity, membership or room state. Neither protocol's
  discovery lists a room of the other.
- Adding or inviting a remote user of the other protocol, from the UI or the REST API, at
  creation or later, alone or in a mixed list, is refused with a protocol-mismatch error per
  user; the users of the room's protocol in the same list are processed normally. The
  member picker suggests local users and remote users of the room's protocol only.
- A self-initiated join by a remote user of the other protocol is refused.
- A DM with a remote XMPP user cannot gain a remote Matrix user, and the reverse.
- Local users join rooms of either protocol and speak in each through that room's protocol.

## Affected users and systems

- Room owners and administrators creating and populating federated rooms; remote users of
  both protocols.
- [hosted-muc](../specs/hosted-muc.md) R1, R12; [remote-muc](../specs/remote-muc.md);
  [direct-messages](../specs/direct-messages.md); [service-discovery](../specs/service-discovery.md),
  which already lists only XMPP rooms ([ADR 0008](../adr/0008-only-dedicated-xmpp-rooms-are-exposed.md)).
- The Matrix federation (`ee/packages/federation-matrix` and its Meteor hooks), the
  create-channel modal, the add-users UI and the member search, all outside this package.
- [PROJ-120](https://rocketchat.atlassian.net/wiki/spaces/RnD/pages/1307803678/PROJ-120+Native+XMPP+Server+Experience)
  §4 (out of scope: hybrid federation model), §7.12 "Protocol isolation per room" and §7.13
  "Cross-protocol membership restrictions", every scenario.

## Constraints

- [ADR 0006](../adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md): rooms and users
  carry `xmppFederation`; an XMPP room never carries `federation` or `federated: true`, which
  is how the two protocols tell their rooms apart today.
- The rule is symmetric: whatever an XMPP room refuses from Matrix, a Matrix room refuses
  from XMPP.

## Open questions

- **Q1** Is the protocol choice a new control in the create-room UI, replacing the two
  toggles?
- **Q2** Which XMPP error does a stanza to a Matrix room's address get? The MUC domain only
  knows XMPP rooms, so to it the room does not exist (`item-not-found`), while the scenario
  asks for a rejection the sender can tell apart.
- **Q3** Does one shared check in the Rocket.Chat room layer own the protocol-mismatch error
  and the member-picker filter, or does each federation keep its own?
- **Q4** Can a DM between a local user and a remote XMPP user gain a third member at all, or
  are federated DMs one-to-one only?
