# A remote room's occupant is the user their disclosed real JID names, a per-room record otherwise

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** `src/XMPPServer.ts`, `src/muc/RemoteMucSession.ts`, `src/service/XMPPServerService.ts`, `src/service/helpers/xmppUser.ts`, [remote-muc R6](../specs/remote-muc.md), [addressing R9, R10](../specs/addressing.md)

## Background

An occupant of a MUC room has two addresses. Their **real JID** (`alice@remote.tld`) is
their account, the address anyone can message, subscribe to or look up. Their **occupant
JID** (`team@conference.remote.tld/ally`) is the room's address plus the nick they chose
there. Everything an occupant sends goes through the room, and the room sends it on to the
other occupants from the occupant JID. A message never says who sent it; only the room
knows.

The room may say so in the presence it sends when someone joins: an
`<x xmlns='http://jabber.org/protocol/muc#user'><item jid='alice@remote.tld/phone'/></x>`
child. The room owner decides who gets that attribute (XEP-0045 §4.2, the
`muc#roomconfig_whois` option):

- **Non-anonymous:** every occupant. Usual for private groups of people who know each other,
  and required by OMEMO encryption, which needs every member's account. Clients such as
  Conversations create their private group chats this way.
- **Semi-anonymous:** moderators only. The default of ejabberd and Prosody, so most public
  channels are semi-anonymous. A visible real JID lets any stranger
  in the room message the person, track them across rooms or keep contacting them after
  they leave. Moderators still see it because a ban has to target the account; a nick can
  be changed at will.

A third kind, fully anonymous (nobody, not even owners), is NOT RECOMMENDED by XEP-0045 and
behaves like semi-anonymous for us.

Our sessions in a remote room are ordinary participants ([ADR 0009](0009-one-remote-muc-session-per-local-member.md)),
so we see what any participant sees: the real JID in a non-anonymous room, and in a
semi-anonymous one only when the local member's session has been made a moderator. XEP-0421
occupant ids do not fill the gap. An occupant id is stable for one account in one room and is
meant to differ between rooms, so it cannot link a person across rooms.

## Decision

- A message in a remote room is authored by the user record of the sender's bare real JID
  whenever the room disclosed that JID to any of our sessions in the room, for the occupant
  holding the nick at that moment. It is the same record a DM from that JID or a hosted-room
  occupant with that JID uses: one record per remote account
  ([ADR 0006](0006-remote-users-are-local-users-keyed-by-bare-jid.md)).
- When no session was told the real JID, the message is authored by a record keyed
  `<nick>#<room JID>`, as before. Nothing links that record to the same person in another
  room.
- The room's word is taken for the JID, with two exceptions: a JID on our own domain or MUC
  domain, and a JID without a localpart, both fall back to the per-room record.
- A remote user's display name is the nick they were last seen under, in any room we host or
  joined. A user first seen outside a room is named by their bare JID, and a DM never renames
  anyone.

## Why

Rocket.Chat has one name per user and no per-room nick, so mapping a person to one user
means one record and a name that follows their latest nick. The only party that knows who
an occupant is, is the room, so its disclosure is the only sound key.

A room that hides real JIDs is choosing not to let us link the person across rooms. Any key
built from what we do see would be a guess, and a wrong guess shows one person's messages
under someone else's name.

The room is trusted for the JIDs it discloses, as every XMPP client trusts it: it is the
only source, and rooms routinely host accounts from many servers, so the JID's domain cannot
be required to match the room's. A JID on our own domains is the exception, because local
users only ever speak in a remote room through our own sessions, whose reflections are
skipped. A room naming one of them is either echoing us or impersonating a local user.

### Alternatives rejected

- **One record per nick per MUC service (`<nick>#<conference.remote.tld>`).** Merges every
  person who uses the same nick on that service. Anyone could join any room on the service
  under a nick and post as that record, and renaming it would rename everyone sharing it.
- **Real JIDs only: drop messages, or refuse to join, when a room hides them.** Keeps one
  record per person but makes semi-anonymous rooms, most public channels, unusable.
- **Key by the XEP-0421 occupant id.** It is scoped to one room by design, so it is no better
  than the nick for linking rooms, and not every server sends it.
- **Require the disclosed JID's domain to match the room's.** Would reject nearly every
  legitimate occupant, since rooms are where accounts from different servers meet.

## Consequences

- In rooms that disclose real JIDs, a person is one Rocket.Chat user across every room and
  their DMs. In semi-anonymous rooms they are one user per room, all named by their nick.
- A remote MUC service can attribute messages to any remote account, including one a local
  user has a DM with. It already could under its own nicks; now it reaches the shared record.
- One person's messages can end up under two records in one room: the per-room record
  before the room discloses their JID to us, the real one after. Examples are history from
  an occupant who already left, a room whose owner turns disclosure on, or a local member
  becoming a moderator. Earlier messages keep their author. A correction is applied only by
  the original message's author ([ADR 0014](0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)),
  so a correction that arrives under the other record is stored as a new message.
- A user's display name changes whenever they speak or join under another nick. Messages
  already stored keep the name they were stored with: the upsert does not rewrite them the
  way a rename through Rocket.Chat does.
- Per-room records are never deleted and have no real address, as ADR 0006 already notes.
