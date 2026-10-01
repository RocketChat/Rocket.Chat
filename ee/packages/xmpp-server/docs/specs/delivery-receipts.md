---
status: planned
standards: [XEP-0184]
adrs: [0007]
code: []
tests: []
---

# Spec: Delivery receipts

## Summary

A message sent to an XMPP user comes back with a confirmation that it reached them, and a
message received from an XMPP user is confirmed to its sender. XEP-0184 Message Delivery
Receipts is the mechanism; it says a message was delivered, not that it was read.

## Motivation

The end product needs the sender to know whether a federated message arrived. XMPP clients
show a tick for a received receipt and nothing otherwise, so a Rocket.Chat that never
answers receipt requests looks unreliable to the other side. The current implementation
sends and answers nothing ([direct-messages](direct-messages.md) lists it as out of scope).

## Behaviour

Drafted from the XEP; to be confirmed with the package owner before a plan is written.

- **R1** Every `chat` message sent to a remote user carries
  `<request xmlns='urn:xmpp:receipts'/>`.
- **R2** When a `chat` message carrying `<request/>` has been stored, the server sends to the
  sender's full JID a `<message/>` with a fresh id containing
  `<received xmlns='urn:xmpp:receipts' id='<id of the received message>'/>`, from the
  recipient's JID. A message that is dropped (unknown user, not allowed) gets no receipt.
- **R3** A `<received id='X'/>` addressed to a local user marks the Rocket.Chat message with
  `_id` X as delivered to the sender's bare JID. How that is stored and shown is an open
  question.
- **R4** A receipt is never requested for a message that itself carries `<received/>`, nor
  for an error message, nor for a message without a body.
- **R5** Receipts are neither requested nor answered for `groupchat` messages.
- **R6** `urn:xmpp:receipts` is advertised in the server's `disco#info`.
- **R7** A `<received/>` for an id Rocket.Chat does not know is ignored.

## Design

Decided in the plan.

## Out of scope

- Read receipts. XEP-0184 cannot express "read"; Rocket.Chat's read receipts have no XMPP
  counterpart.
- Receipts in rooms (R5), unless the open questions decide otherwise.
- Chat markers (XEP-0333), which do express displayed state but are not implemented by
  most servers' S2S paths.

## Known defects

None; not implemented.

## Open questions

- What does "delivered" map to on the Rocket.Chat side? Options: a new per-message field
  read by the client, reuse of the read-receipt feature as "delivered" when
  `Message_Read_Receipt_Enabled` is on, or nothing visible and only the XMPP side benefits.
- R2 answers on behalf of the user as soon as the message is stored. Should the receipt wait
  for a user session, which XEP-0184 intends, or is storage the right moment for a server
  that is the endpoint?
- Should hosted rooms relay receipt requests and receipts between occupants, as some rooms do?
- Does the receipt need `<origin-id/>` ([message-deduplication R7](message-deduplication.md))
  so a remote room's rewritten ids do not break R3?

## References

- XEP-0184, XEP-0333 (not planned), XEP-0359
