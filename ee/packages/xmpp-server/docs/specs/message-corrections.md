---
status: partial
standards: [XEP-0308, XEP-0421]
adrs: [0007, 0014]
code:
  [
    src/xml/correction.ts,
    src/handlers/parse.ts,
    src/muc/stanzas.ts,
    src/muc/MucRoom.ts,
    src/muc/RemoteMucSession.ts,
    src/XMPPServer.ts,
    src/service/XMPPServerService.ts,
    src/service/helpers/messageId.ts,
    apps/meteor/ee/server/hooks/xmpp/index.ts,
    apps/meteor/server/settings/federation-service.ts,
  ]
tests:
  [
    src/muc/MucRoom.spec.ts,
    src/muc/RemoteMucSession.spec.ts,
    src/muc/stanzas.spec.ts,
    src/service/helpers/messageId.spec.ts,
    tests/end-to-end/direct-messages.spec.ts,
    tests/end-to-end/hosted-muc.spec.ts,
    tests/end-to-end/remote-muc.spec.ts,
  ]
---

# Spec: Message corrections

## Summary

An edit of a message is carried over XMPP as a Last Message Correction: a new message that
replaces an earlier one by id. Rocket.Chat edits reach XMPP users as corrections in DMs and
in both kinds of room, and corrections from XMPP users update the message Rocket.Chat
stored.

## Motivation

Without XEP-0308 an edit either stays invisible to the other side or shows up as a
duplicate. Clients on every platform implement the XEP, and a room relays it between
occupants unchanged.

## Behaviour

- **R1** An edit by the author of a message in an XMPP room is sent as a `<message/>` with a
  fresh id, the edited text as body, and `<replace xmlns='urn:xmpp:message-correct:0' id='<original message _id>'/>`:
  type `chat` to the DM partner, `groupchat` to every remote occupant of a hosted room,
  `groupchat` to the remote room from the member's own session.
- **R2** An edit by anyone other than the author stays local. XMPP accepts a correction only
  from the original sender.
- **R3** A `<replace/>` on an inbound chat message, on a `groupchat` sent to a hosted room or
  on a `groupchat` from a remote room is parsed and carried on the event as `replaceId`.
- **R4** A correction received for a message Rocket.Chat stores updates that message's text
  and marks it edited by its author, instead of storing a new message. Every copy of the
  correction after the first changes nothing.
- **R5** A hosted room MUST relay a correction from one occupant to the others with its
  `<replace/>` intact. Not met, see D2.
- **R6** In a remote room, the reflection of our own correction is recognised by its replace
  id and not stored ([remote-muc R9](remote-muc.md)).
- **R7** A correction is applied only to a message of the same author in the same room: the
  same bare JID in a DM or a hosted room; in a remote room the same nick and, when the room
  sends one, the same XEP-0421 occupant id. Any other correction is stored as a new message.

## Design

`src/xml/correction.ts` builds and parses the element. `sendMessage` in the service turns an
edited message into `{ id: random, replaceId: message._id }` for all three room roles; the
Meteor hook drops edits by non-authors before calling it. `parseChatMessage`,
`MucRoom.handleGroupchatMessage` and `RemoteMucSession.handleMessage` extract `replaceId`.

Inbound, every path goes through `receiveMessage` in the service. A message that carries an
`id` attribute is stored under an `_id` derived from the room, the author and that id
([ADR 0014](../adr/0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)), so
a correction derives the `_id` of the message it replaces from its own room, author and
`replaceId`, and reads it by primary key. R7 follows from the author being part of the key;
the lookup also compares `rid` and `u._id`. The update goes through `Message.updateMessage`,
so edit history and client notifications behave as for a local edit, and the outgoing hook
skips it because the message carries `federation.eventId`.

R4's "after the first" relies on two things. Copies that arrive together share an event id
and are dropped while the first is in flight, as in
[message-deduplication R6](message-deduplication.md). A later copy finds the text already
equal to its body and changes nothing.

## Out of scope

- Correcting a message more than once by chaining (a correction of a correction): the
  replace id always points at the original Rocket.Chat message, which is what the XEP
  recommends.
- Corrections of messages the other side never received (sent before the room was joined).
- Corrections of messages stored before ADR 0014, or of messages sent without an `id`
  attribute: they are stored as new messages.
- Corrections in a remote room after the author changed nick, which XEP-0308 does not allow.

## Known defects

### D2 The room strips corrections it relays between XMPP users

In a hosted room, a correction from one XMPP occupant reaches the other XMPP occupants
without its `<replace/>` element, so their clients show it as a new message. The room
rebuilds every relayed message from body and id alone. Where: `MucRoom.handleGroupchatMessage`.
Test: `hosted-muc.spec.ts`, "relays an XMPP user's correction to the other XMPP occupants as
a correction".

## Open questions

- When a correction arrives for a message Rocket.Chat does not have (sent before the room
  was mirrored), should it be stored as a new message, as today, or dropped?
- Should the edit history Rocket.Chat keeps record the correction's stanza id?
- Do `Message_AllowEditing` and `Message_AllowEditing_BlockEditInMinutes` apply to inbound
  corrections, or does the sender's server decide?
- Under XEP-0258 security labels, may a correction carry a different label than the message
  it replaces, or a lower one? The edit history copy must keep the original's label.

## References

- XEP-0308, XEP-0421, XEP-0258
- [message-deduplication](message-deduplication.md)
- [ADR 0014](../adr/0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)
