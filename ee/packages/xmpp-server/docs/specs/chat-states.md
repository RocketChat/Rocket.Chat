---
status: draft
standards: [XEP-0085]
adrs: [0006]
code: []
tests: []
---

# Spec: Chat states

## Summary

A Rocket.Chat user sees when their XMPP contact is typing, and the XMPP contact sees when
the Rocket.Chat user is. XEP-0085 Chat State Notifications is the mechanism; Rocket.Chat
already has typing indicators on both the client and the server side.

## Motivation

Typing indicators are the most visible day-to-day signal after messages themselves, and
every XMPP client shows them. Rocket.Chat publishes a user's activity in a room as the
broker event `room.user-activity`, which the Matrix service already consumes, and renders
remote activity through the same stream clients listen to. The mapping costs little.

## Behaviour

**Direct messages**

- **R1** When a local user starts typing in an XMPP DM room, a `<message type='chat'/>`
  without a body carrying `<composing xmlns='http://jabber.org/protocol/chatstates'/>` is
  sent from their JID to the DM partner. When they stop typing without sending, `<paused/>`
  is sent. At most one stanza per state change.
- **R2** Every outbound chat message with a body carries `<active/>`.
- **R3** An inbound `<composing/>` from the DM partner shows them as typing in the DM room,
  the same way a local user's typing is shown. Any other state (`active`, `paused`,
  `inactive`, `gone`) or a message with a body clears it.
- **R4** Chat states are never stored. A stanza carrying only a chat state is not a message
  ([direct-messages R3](direct-messages.md)).
- **R5** A chat state from a user who is not the DM partner, or for a DM that does not
  exist, is ignored.
- **R6** `http://jabber.org/protocol/chatstates` is advertised in `disco#info`.

**Rooms**

- **R7** Rooms: see open questions. Until decided, chat states addressed to a hosted room or
  received from a remote room are ignored.

## Design

Decided in the plan. The outbound trigger is the `room.user-activity` broker event; the
inbound path adds a chat-state parser beside `parseChatMessage` and a service handler that
calls the same user-activity notification local typing uses.

## Out of scope

- `inactive` and `gone` as distinct states on the Rocket.Chat side; both clear the indicator.
- Recording or uploading activity (`user-recording`, `user-uploading`): no XEP-0085 state
  matches; they are sent as `composing` or not at all, per the open question.

## Known defects

None; not implemented.

## Open questions

- Rooms: should a local member's typing be sent to hosted-room occupants and the remote
  room, and remote occupants' typing shown in the mirrored channel? Clients send chat states
  to rooms; rooms reflect them to every occupant, which in a large room is a lot of traffic.
- Should `user-recording` and `user-uploading` be sent as `composing`?
- Rocket.Chat's typing event fires repeatedly while the user types; R1 needs the service to
  collapse that into one `<composing/>` until the state changes. Is the broker event
  already debounced enough?

## References

- XEP-0085
- Root repo [ADR 0005](../../../../../docs/adr/0005-stream-fan-out-rides-the-service-broker.md): how `room.user-activity` reaches a service
