# One remote-MUC session per local member; local members of hosted rooms are virtual occupants

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/XMPPServer.ts`, `src/muc/RemoteMucSession.ts`, `src/muc/MucRoom.ts`, `src/service/XMPPServerService.ts`

## Decision

- **Remote rooms.** Each local member of a mirrored room is joined into the remote MUC with
  their own session: occupant JID `<username>@<domain>/rocketchat`, nick `<username>`. The
  session map is keyed `<local bare JID>|<room JID>`. A member without a session cannot
  speak; `mucSendToRemoteRoom` throws rather than relaying under someone else's nick, and
  `sendMessage` joins first when the session is missing.
- **Hosted rooms.** Each local member is registered in the room as a virtual occupant: they
  appear in the roster sent to remote occupants with their real JID and role, but no stanza
  is ever sent to them. Copies of room traffic reach Rocket.Chat as events instead.

## Why

XMPP has no notion of a server speaking for several people in one room; a MUC occupant is a
full JID with a nick, and a message is attributed to the occupant that sent it. Giving every
member their own session is the only way a message by Bob shows up as Bob on the remote side
and the only way the remote room can enforce its own per-occupant rules (bans, voice,
moderation) correctly.

Virtual occupants in hosted rooms solve the mirror-image problem: remote clients expect to see
who is in the room, but the local members have no socket. Registering them as occupants with
a `isLocal` flag keeps the roster truthful while the delivery path stays the event emitter.

### Alternatives rejected

- **One session per room, messages relayed with the author's name in the body.** Misattributes
  every message, breaks corrections (the room accepts them only from the original sender) and
  bans.
- **No virtual occupants; remote clients see only remote occupants.** Clients then show an
  empty room and some refuse to send to it.

## Consequences

- A remote room receives one join per local member and reflects every message once per
  session, which is why deduplication prefers the room-assigned id
  ([ADR 0007](0007-inbound-messages-are-deduplicated-by-federation-event-id.md)).
- Sessions are ephemeral: every start rejoins every member of every mirrored room, and a
  mirrored room with many members produces a burst of joins on restart.
- Discussion history requested on join is how the server catches up on messages sent while
  it was down; decode-only mode disables it because it has nowhere to store them.
- A remote occupant's own presence changes in the mirrored room are observed per session but
  not yet applied to anything.
