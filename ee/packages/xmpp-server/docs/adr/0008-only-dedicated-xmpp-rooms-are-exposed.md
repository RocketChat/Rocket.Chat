# Only dedicated XMPP rooms are exposed; remote rooms are entered by invitation only

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/muc/MucService.ts`, `src/service/XMPPServerService.ts` (`authorizeMucJoin`, `onMucInvite`), `src/service/helpers/remoteRoom.ts`, client touch points

## Decision

- A Rocket.Chat room is reachable over XMPP only when it was created with the **XMPP
  Federated** toggle, which stamps it `xmppFederation.role = 'host-muc'` and gives it a MUC
  JID `<escaped name>@<conference>.<domain>`. Regular channels, groups and teams are never
  routable on the MUC service and never listed by disco#items.
- A hosted public channel admits any occupant from an allowed domain; a hosted private group
  admits only occupants who already hold a subscription, which an invitation creates.
- A room hosted on a remote server is mirrored only after a remote user invites a local user.
  There is no way to search for or join a remote room from Rocket.Chat.

## Why

Exposing every channel would make the whole workspace discoverable from the internet the
moment the feature is turned on, and the authorization model of a MUC (open, members-only,
password) does not map onto Rocket.Chat permissions. An explicit toggle at creation time
keeps the decision with the room creator and keeps the MUC localpart fixed, since the room
name becomes part of an address other servers store.

Invite-only entry into remote rooms is a scope decision: a join dialog, room search and
bookmark handling are client features that can be added on top of the same session model.

### Alternatives rejected

- **Expose every public channel.** See above.
- **Allow toggling federation on an existing room.** The localpart would be derived from a
  name that may already have changed, and existing members would silently become visible.
- **A `members-only` MUC flag mirrored from room type with Rocket.Chat permissions checked
  on every stanza.** The join is the only point where the MUC protocol allows a refusal with
  a reason the client understands.

## Consequences

- The toggle is mutually exclusive with the Matrix one; a room federates one way or not at all.
- Renaming a hosted room does not change its MUC JID.
- `xmppFederation.muc` is the lookup key for every inbound room stanza.
- Mirrored rooms are created as private groups with the invitee as the only member; later
  invitees are expected to be added by the same path, or by a member from Rocket.Chat. The
  remote room's configuration is not read, and most rooms that invite are members-only: as
  a public channel, a members-only room would be readable by the whole workspace, and
  anyone who joined it would see the room while their own session was refused.
- A mirrored room is shown as `<localpart>:<room domain>` (`fname`), as Matrix rooms are, and
  is named after its whole JID, with every character outside `[0-9a-zA-Z-_.]` replaced by
  `_` and the first 8 hex digits of the JID's SHA-256 appended: `team@conference.remote.tld`
  shows as `team:conference.remote.tld` and is named `team_conference.remote.tld-<hash>`.
  Room names are unique across the workspace and XEP-0045 gives a room no identifier other
  than its JID, so the name is derived from it. `<localpart>:<domain>` itself would be unique
  but fails Rocket.Chat's channel-name validation. The replacement alone would merge rooms
  whose names differ only in replaced characters (`café` and `cafè`, any two CJK names of
  the same length), which a Matrix room id, random ASCII, never has; the hash keeps them
  apart and keeps a local channel from taking the name first by accident.
