# Intent: Per-identity federation authorization

Author: Diego Sampaio. Status: accepted.

## Problem

Who may federate is decided per domain only. Any local user can DM any JID on an allowed
domain, any remote user on an allowed domain can DM any local user, and any remote user on
an allowed domain can join a hosted public channel. The remote user record is created on
first contact ([direct-messages R1](../specs/direct-messages.md),
[hosted-muc R4, R7](../specs/hosted-muc.md)). Defense and coalition deployments must be
able to say which people may talk across the boundary, not only which servers.

## Proposed outcome

- A Rocket.Chat user federates only when they hold the federation permission. A user
  without it cannot open a DM with a JID, add a JID to a room, or have their messages
  relayed, and to remote senders they look like an account that does not exist: messages
  and IQs addressed to them get `service-unavailable` (type `cancel`), presence is ignored.
- Remote identities are authorized per domain. A domain the allow and deny lists refuse is
  refused when it connects (a `policy-violation` stream error, or a failed SASL or dialback
  exchange), and leaves nothing behind: no user record, no room, no subscription, no stored
  message.
- Adding a JID on a refused domain to a hosted room is refused on the Rocket.Chat side, and
  the JID receives no invitation.
- Hosted public channels are open to every authorized remote identity. A room that needs its
  own member list is a private room with invitations.
- A user's address is the one derived from their username
  ([addressing R1](../specs/addressing.md)), and display names travel in both directions:
  remote users show theirs, and ours carry ours.
- Revoking an authorization stops federated traffic at once, in both directions: messages,
  presence, invitations and files are neither sent nor accepted. Memberships stay, and
  restoring the authorization resumes traffic with nothing to rebuild.
  - Our users' sessions in remote rooms are closed, and rejoined when access returns.
  - Remote members of our rooms and DMs stay listed, but receive nothing and cannot post.
  - Each affected room and DM gets a system message when the suspension begins, such as
    "Federation with `navy.example` suspended", and another when it ends, such as
    "Federation with `navy.example` restored", so its history shows the gap. Local members
    keep talking, and the history stays readable.
  - Messages posted during the suspension are never sent to the suspended domain, then or
    after it is restored. This differs from a link that is merely down, where
    [connection-recovery](connection-recovery.md) applies.
  - The change, who made it, and every affected room and DM are logged.
- When the authorization of either side cannot be evaluated (the database or the
  authorization source fails), the operation is refused. Nothing fails open.
- Authorization survives a service restart; a JID refused before the restart is refused
  after it.

## Affected users and systems

- Administrators, who maintain the authorizations; every user who federates.
- [direct-messages](../specs/direct-messages.md) (R2: a message to a user without the
  permission is answered, not dropped), [hosted-muc](../specs/hosted-muc.md),
  [remote-muc](../specs/remote-muc.md) and [presence](../specs/presence.md) gain a gate on
  every inbound and outbound path; [addressing](../specs/addressing.md) R10 for display
  names.
- Rocket.Chat permissions (`access-federation` today only gates creating XMPP rooms), the
  admin settings in [operations.md](../operations.md#admin-settings), user renames, and a
  new system message type for suspension and restoration.
- [connection-recovery](connection-recovery.md), which rejoins the sessions a revocation
  closed.

## Constraints

- [ADR 0006](../adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md): a remote user
  is a local user keyed by bare JID. The gate must run before that record is created.
- Fail closed: an error while evaluating is a refusal, never an admission.
- The domain allow and deny lists keep working and are evaluated first
  ([s2s-connectivity R2, R5](../specs/s2s-connectivity.md)).
- Authorizations come from a Rocket.Chat permission granted per role, so roles synced from
  LDAP or SAML apply, combined with the existing domain allow list. Allow lists of
  individual remote JIDs, per-user domain lists and per-room lists are deferred past S1.
- A user who has federated cannot be renamed, since their address follows the username and
  a rename would show remote contacts and rooms a different person.
- A local user without the permission never gets `forbidden`: a distinct error tells a
  prober who holds it (RFC 6121 §8.5.1).
- A suspension never blocks local chat: on networks with limited connectivity the XMPP
  link fails routinely, and tying a room's use to a remote server would block the room.

## Open questions

- **Q1** ~~Where do authorizations come from: a Rocket.Chat role or permission, a per-user
  list of domains, an allow list of remote JIDs, an external directory (LDAP group, SAML
  attribute)?~~ A permission granted per role, plus the domain allow list: see
  Constraints.
- **Q2** ~~Is the PRD's "identity mapping" the derived `<username>@<domain>` of [addressing
  R1](../specs/addressing.md), or an administrator-assigned JID per user? Does a mapping
  carry a display name, so remote users show a configured name instead of the nick or bare
  JID of [addressing R10](../specs/addressing.md)?~~ Derived, with display names both
  ways: see Proposed outcome and Constraints.
- **Q3** ~~Which stanza error does a refused remote identity get (`forbidden`,
  `not-authorized`, `service-unavailable`), given that a distinct error tells a prober which
  accounts exist?~~ A refused domain is refused when it connects; a user without the
  permission looks like one that does not exist: see Proposed outcome.
- **Q4** ~~Does revoking an authorization remove the user from rooms and DMs they already
  hold, or only stop new traffic?~~ It only stops traffic; memberships stay: see Proposed
  outcome.
- **Q5** ~~Are hosted public channels still open to every authorized remote identity, or
  does a room carry its own list?~~ Open to every authorized identity: see Proposed
  outcome.
- **Q6** ~~What is the suspension notice in an affected room or DM: a system message, or a
  banner, which needs a design next to the topic, announcement and other room elements? How
  long is it shown?~~ A system message when the suspension begins and another when it ends,
  with local chat kept active: see Proposed outcome and Constraints.
