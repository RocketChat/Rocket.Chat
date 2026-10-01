---
status: partial
standards: [XEP-0308]
adrs: [0007]
code:
  [
    src/xml/correction.ts,
    src/handlers/parse.ts,
    src/muc/stanzas.ts,
    src/muc/MucRoom.ts,
    src/muc/RemoteMucSession.ts,
    src/XMPPServer.ts,
    src/service/XMPPServerService.ts,
    apps/meteor/ee/server/hooks/xmpp/index.ts,
  ]
tests:
  [
    src/muc/RemoteMucSession.spec.ts,
    src/muc/stanzas.spec.ts,
    tests/end-to-end/direct-messages.spec.ts,
    tests/end-to-end/hosted-muc.spec.ts,
    tests/end-to-end/remote-muc.spec.ts,
  ]
---

# Spec: Message corrections

## Summary

An edit of a message is carried over XMPP as a Last Message Correction: a new message that
replaces an earlier one by id. Rocket.Chat edits reach XMPP users as corrections in DMs and
in both kinds of room. Corrections from XMPP users are received but not yet applied.

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
- **R3** A `<replace/>` on an inbound chat message or on a `groupchat` from a remote room is
  parsed and carried on the event as `replaceId`.
- **R4** A correction received for a message Rocket.Chat stores MUST update that message's
  text and mark it edited by its author, instead of storing a new message. Not met, see D1.
- **R5** A hosted room MUST relay a correction from one occupant to the others with its
  `<replace/>` intact. Not met, see D2.
- **R6** In a remote room, the reflection of our own correction is recognised by its replace
  id and not stored ([remote-muc R9](remote-muc.md)).

## Design

`src/xml/correction.ts` builds and parses the element. `sendMessage` in the service turns an
edited message into `{ id: random, replaceId: message._id }` for all three room roles; the
Meteor hook drops edits by non-authors before calling it. `parseChatMessage` and
`RemoteMucSession.handleMessage` extract `replaceId`; `MucRoom.handleGroupchatMessage` does
not, which is D2's cause. No inbound handler reads `replaceId` yet.

## Out of scope

- Correcting a message more than once by chaining (a correction of a correction): the
  replace id always points at the original Rocket.Chat message, which is what the XEP
  recommends.
- Corrections of messages the other side never received (sent before the room was joined).

## Known defects

### D1 Corrections from XMPP users arrive as new messages

When an XMPP user corrects a message, Rocket.Chat stores the corrected text as a second
message and leaves the original unchanged, in DMs, in hosted rooms and in remote rooms. The
replace id is parsed but no inbound handler looks it up, and the correction gets a new event
id and passes deduplication.

A fix has to find the stored message by the id the sender gave the original. In a room that
assigns its own XEP-0359 stanza ids the stored event id uses the room's id, not the sender's,
so that room needs the sender's id recorded as well. Where: `onIncomingMessage`,
`persistMucMessage`, `onRemoteMucMessage` in `XMPPServerService.ts`. Tests: "applies a
correction from the XMPP user to the stored message" in `direct-messages.spec.ts` and
`hosted-muc.spec.ts`; "applies a correction from an occupant to the stored message" in
`remote-muc.spec.ts`.

### D2 The room strips corrections it relays between XMPP users

In a hosted room, a correction from one XMPP occupant reaches the other XMPP occupants
without its `<replace/>` element, so their clients show it as a new message. The room
rebuilds every relayed message from body and id alone. Where: `MucRoom.handleGroupchatMessage`.
Test: `hosted-muc.spec.ts`, "relays an XMPP user's correction to the other XMPP occupants as
a correction".

## Open questions

- When a correction arrives for a message Rocket.Chat does not have (sent before the room
  was mirrored), should it be stored as a new message or dropped?
- Should the edit history Rocket.Chat keeps record the correction's stanza id?

## References

- XEP-0308
- [message-deduplication](message-deduplication.md)
