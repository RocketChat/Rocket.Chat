---
status: draft
standards: [XEP-0234, XEP-0066, XEP-0363, XEP-0047, XEP-0065]
adrs: [0001, 0006]
code: []
tests: []
---

# Spec: File transfer

## Summary

A file attached to a message in an XMPP room reaches the XMPP user, and a file an XMPP user
sends reaches the Rocket.Chat room as an upload. Two paths: out-of-band URLs (XEP-0066), the
way files travel across the XMPP ecosystem today and the only way in rooms, and Jingle File
Transfer (XEP-0234) for clients that negotiate it. The XEP-0363 upload slot service is a
client-to-server protocol and is not implemented; what interoperates is the URL exchange
its clients produce.

## Motivation

Text-only federation is the first thing users notice. Today an attachment in an XMPP room
is silently not relayed and an inbound file offer or file URL is stored as plain text
([direct-messages](direct-messages.md) lists attachments as out of scope). The end product
commits to Jingle; interoperability with every client and with rooms requires the URL path
as well.

## Behaviour

Drafted; the requirements below describe the outcome and need the open questions answered
before they are fixed.

**Out-of-band URLs**

- **R1** A message with file attachments saved by a local user in an XMPP DM or room is sent
  with a fetchable HTTPS URL for each attachment as the body and as
  `<x xmlns='jabber:x:oob'><url/></x>`, one message per attachment. The URL is fetchable by
  the recipient without a Rocket.Chat session for a bounded time.
- **R2** An inbound message carrying `<x xmlns='jabber:x:oob'/>`, or whose body is a single
  HTTPS URL, is treated as a file message: the file is fetched, validated against the
  workspace upload settings (size limit, allowed MIME types), stored through the upload
  pipeline and attached to a message authored by the remote user. When the fetch or the
  validation fails, the message is stored with the URL as its text.
- **R3** R2 applies in DMs, hosted rooms and remote rooms.

**Jingle**

- **R4** A file attached in an XMPP DM is additionally offered over XEP-0234 to a remote
  user whose client advertises it, with name, size, MIME type and a XEP-0300 hash.
- **R5** A Jingle file offer to a local user is accepted when it passes the upload settings,
  received over the negotiated transport, stored and attached as in R2. Offers that fail the
  settings are declined with the reason the standard provides.
- **R6** A transfer that fails or is cancelled leaves no partial message; the sender is told.

**Both**

- **R7** The features are advertised in `disco#info`.

## Design

Decided in the plan.

## Out of scope

- Implementing an XEP-0363 upload slot service for remote users.
- Streaming media and calls (Jingle RTP, XEP-0167).
- Encrypted transfers (XEP-0384, OMEMO).

## Known defects

None; not implemented.

## Open questions

- R1 needs a URL that works without authentication. A signed link with an expiry, a public
  file setting, or a dedicated federation download endpoint? Who may fetch it and for how
  long?
- R2: fetch and store, or render as a link and let the client fetch? Fetching means
  Rocket.Chat makes outbound HTTPS requests to arbitrary hosts named by remote users.
- XEP-0234 sessions run between full JIDs and need a transport: in-band bytestreams
  (XEP-0261) work over S2S alone but are slow; SOCKS5 bytestreams (XEP-0260) need a proxy
  (XEP-0065) reachable by both ends. Which does the end product accept, and does
  Rocket.Chat have to run a proxy?
- Local users have no resource on the wire outside remote rooms
  ([addressing R7](addressing.md)). Jingle needs one; does the DM path start advertising a
  resource, and what does that mean for presence?
- When both paths apply to one attachment (R1 and R4), is the file sent twice?

## References

- XEP-0066, XEP-0363, XEP-0234, XEP-0166, XEP-0261, XEP-0260, XEP-0065, XEP-0300
