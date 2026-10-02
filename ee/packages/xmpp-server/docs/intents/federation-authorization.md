# Intent: Per-identity federation authorization

Author: Diego Sampaio. Status: draft.

## Problem

Who may federate is decided per domain only. Any local user can DM any JID on an allowed
domain, any remote user on an allowed domain can DM any local user, and any remote user on
an allowed domain can join a hosted public channel. The remote user record is created on
first contact ([direct-messages R1](../specs/direct-messages.md),
[hosted-muc R4, R7](../specs/hosted-muc.md)). Defense and coalition deployments must be
able to say which people may talk across the boundary, not only which servers.

## Proposed outcome

- A Rocket.Chat user federates only when authorized to, and only with the domains their
  authorization names. An unauthorized user cannot open a DM with a JID, add a JID to a
  room, or have their messages relayed.
- A remote identity reaches Rocket.Chat only when authorized. A message, join or invitation
  from an unauthorized remote JID is refused with a stanza error and leaves nothing behind:
  no user record, no room, no subscription, no stored message.
- Adding an unauthorized remote JID to a hosted room is refused on the Rocket.Chat side,
  and the JID receives no invitation.
- When the authorization of either side cannot be evaluated (the database or the
  authorization source fails), the operation is refused. Nothing fails open.
- Authorization survives a service restart; a JID refused before the restart is refused
  after it.

## Affected users and systems

- Administrators, who maintain the authorizations; every user who federates.
- [direct-messages](../specs/direct-messages.md), [hosted-muc](../specs/hosted-muc.md),
  [remote-muc](../specs/remote-muc.md) and [presence](../specs/presence.md) gain a gate on
  every inbound and outbound path; [addressing](../specs/addressing.md) if the mapping
  between a user and their JID stops being derived from the username.
- Rocket.Chat permissions (`access-federation` today only gates creating XMPP rooms) and
  the admin settings in [operations.md](../operations.md#admin-settings).
- [PROJ-120](https://rocketchat.atlassian.net/wiki/spaces/RnD/pages/1307803678/PROJ-120+Native+XMPP+Server+Experience)
  §2 (job to be done: "under their own authorized identity"), §5 S1 ("per-identity
  authorization gate"), and the scenarios §7.2 "Authorize a mapped Rocket.Chat identity for
  XMPP federation", §7.3 "Display a human-readable federated user name", §7.4 "Reject a
  message from an unauthorized identity", §7.6 "Prevent unauthorized MUC access", §7.7
  "Reject a private-room invitation for an unauthorized identity" and "Remove a federated
  participant from a private room", §7.9 "Fail closed when authorization state can't be
  evaluated", §7.10 "Recover federation state after server restart".

## Constraints

- [ADR 0006](../adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md): a remote user
  is a local user keyed by bare JID. The gate must run before that record is created.
- Fail closed: an error while evaluating is a refusal, never an admission.
- The domain allow and deny lists keep working and are evaluated first
  ([s2s-connectivity R2, R5](../specs/s2s-connectivity.md)).

## Open questions

- **Q1** Where do authorizations come from: a Rocket.Chat role or permission, a per-user
  list of domains, an allow list of remote JIDs, an external directory (LDAP group, SAML
  attribute)?
- **Q2** Is the PRD's "identity mapping" the derived `<username>@<domain>` of [addressing
  R1](../specs/addressing.md), or an administrator-assigned JID per user? Does a mapping
  carry a display name, so remote users show a configured name instead of the nick or bare
  JID of [addressing R10](../specs/addressing.md)?
- **Q3** Which stanza error does a refused remote identity get (`forbidden`,
  `not-authorized`, `service-unavailable`), given that a distinct error tells a prober which
  accounts exist?
- **Q4** Does revoking an authorization remove the user from rooms and DMs they already
  hold, or only stop new traffic?
- **Q5** Are hosted public channels still open to every authorized remote identity, or does
  a room carry its own list?
