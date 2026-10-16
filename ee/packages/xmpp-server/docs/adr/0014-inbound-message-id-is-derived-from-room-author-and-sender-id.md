# An inbound message's `_id` is derived from its room, its author and the sender's id

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** `src/service/helpers/messageId.ts`, `src/service/XMPPServerService.ts`, `src/muc/RemoteMucSession.ts`, the `XMPP_Server_Message_Id_Secret` setting

## Decision

- A message received from the wire that carries an `id` attribute is stored under
  `_id = HMAC-SHA256(secret, ['xmpp-msg-v1', rid, authorKey, senderId])`, written as 17
  characters of the `Random.id()` alphabet.
- `senderId` is the stanza's `id` attribute, the id XEP-0308 corrections reference.
- `authorKey` is the author's bare JID in a DM and in a hosted room. In a remote room it is
  the nick, joined with the XEP-0421 occupant id when the room sends one.
- The secret is the hidden setting `XMPP_Server_Message_Id_Secret`, generated once on first
  start and never rotated.
- When the derived `_id` is already taken, the message is stored under a random `_id`.
- A message without an `id` attribute, or received before the secret is loaded, gets a
  random `_id`.
- Deduplication is unchanged: it stays on `federation.eventId`
  ([ADR 0007](0007-inbound-messages-are-deduplicated-by-federation-event-id.md)).

## Why

A correction names the message it replaces by the id its sender gave it. In a remote room
that assigns XEP-0359 stanza ids, the stored event id carries the room's id instead, so
nothing stored could be looked up by the sender's id. Deriving the `_id` from what a later
stanza also knows turns that lookup into a primary-key read: no new field, no new index on the
largest collection, and the same path for DMs, hosted rooms and remote rooms.

Each input has a job. The room and the author scope the id, so a correction sent by someone
else, or in another room, computes a different `_id` and finds nothing. XEP-0308 requires the
same full JID in a room, which is the nick. The occupant id stops a later holder of a freed
nick from correcting the previous holder's messages. An occupant id forged by a room that
does not support XEP-0421 can only produce a key that matches nothing, so it is used without
checking the room's features. The version tag lets a later scheme still compute these ids.

The inputs leave out anything that can differ between copies of one message (timestamps,
stanza ids, the body, security labels), because the live copy, the copy each member session
receives and the copy replayed from history must all derive the same `_id`.

The secret exists because derived ids are otherwise predictable from data every occupant
sees. Under XEP-0258 security labels a room holds messages some members are not cleared to
read, and a predictable `_id` lets such a member probe whether a given message exists.

### Alternatives rejected

- **Record the sender's id in a new field.** Needs an index on `messages` that every
  installation builds, XMPP or not, or a lookup that reads every message the author sent in
  the room.
- **Build `federation.eventId` from the sender's id.** Sender ids are only unique per
  sender. Two occupants who number their messages `1`, `2`, `3` would have different
  messages dropped as duplicates, and an occupant who watches another's ids could suppress
  their next message.
- **Concatenate the inputs into the `_id`.** Puts unbounded, client-chosen text into
  permalinks and REST paths.
- **Use the workspace `uniqueID` as the key.** It is sent to Cloud and statistics, so it is
  not secret.

## Consequences

- A correction, and any later stanza that references a message by its sender's id, finds the
  message with `Messages.findOneById`. A stanza that references the room's stanza id (as
  XEP-0424, XEP-0444 and XEP-0461 do in rooms) finds it by `federation.eventId`.
- Messages stored before this decision keep their random `_id`; corrections to them arrive as
  new messages.
- A sender that reuses one of its own ids keeps its first message correctable; the later one
  cannot be corrected.
- A nick change in a remote room ends the ability to correct earlier messages, as XEP-0308
  requires.
- Losing or rotating the secret makes every earlier message uncorrectable; nothing is
  deleted. A deliberate change of scheme bumps the version tag.
- Our own messages in a remote room are stored by Rocket.Chat, not derived, and the stanza id
  the room assigns them is never recorded. A capability that has to find them by the room's
  id (retraction, reactions, replies) must record it, and not in `federation.eventId`, which
  the outgoing hook reads as "came from XMPP" and stops relaying edits for.
