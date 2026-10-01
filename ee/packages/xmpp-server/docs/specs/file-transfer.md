---
status: planned
standards: [XEP-0234]
adrs: [0001, 0006]
code: []
tests: []
---

# Spec: File transfer

## Summary

A file attached to a message in an XMPP room reaches the XMPP user, and a file an XMPP user
sends reaches the Rocket.Chat room as an upload. XEP-0234 Jingle File Transfer is the
standard the end product commits to; whether the HTTP-based path most clients use today
(XEP-0363 upload, XEP-0066 out-of-band URL) is also offered is pending triage.

## Motivation

Text-only federation is the first thing users notice. Today an attachment in an XMPP room
is silently not relayed and an inbound file offer is dropped
([direct-messages](direct-messages.md) lists attachments as out of scope).

## Behaviour

Drafted; the requirements below describe the outcome, not the transport, and need the open
questions answered before they are fixed.

- **R1** A message with one or more file attachments saved by a local user in an XMPP DM is
  offered to the remote user, with the file name, size, MIME type and a content hash.
- **R2** A file offered to a local user by a remote user is accepted when it passes the
  workspace's upload settings (size limit, allowed MIME types), stored through the upload
  pipeline, and attached to a message in the DM authored by the remote user. Offers that
  fail the settings are declined with the reason the standard provides.
- **R3** The transfer runs over S2S without requiring direct connectivity between the
  endpoints.
- **R4** A transfer that fails or is cancelled leaves no partial message in the room; the
  sender is told.
- **R5** The feature is advertised in `disco#info`.
- **R6** Attachments in hosted and remote rooms: see open questions.

## Design

Decided in the plan.

## Out of scope

- Streaming media and calls (Jingle RTP, XEP-0167).
- Encrypted transfers (XEP-0384, OMEMO).

## Known defects

None; not implemented.

## Open questions

- XEP-0234 sessions run between full JIDs and need a transport: in-band bytestreams
  (XEP-0261) work over S2S alone but are slow; SOCKS5 bytestreams (XEP-0260) need a proxy
  (XEP-0065) reachable by both ends. Which transport does the end product accept, and does
  Rocket.Chat have to run a proxy?
- Local users have no resource on the wire outside remote rooms
  ([addressing R7](addressing.md)). Jingle needs one; does the DM path start advertising a
  resource, and what does that mean for presence?
- Most XMPP clients send files as an HTTP URL in the body with XEP-0066 `<x xmlns='jabber:x:oob'/>`,
  obtained from their own server's XEP-0363 upload service. Is accepting such URLs inbound
  (fetch and store, or render as a link) and sending Rocket.Chat upload URLs outbound the
  path that actually interoperates, with XEP-0234 for clients that negotiate it? XEP-0363 is
  pending triage in [compliance.md](../compliance.md).
- Rooms: MUCs have no Jingle; file sharing in rooms is HTTP-upload-only across the
  ecosystem. Is R6 therefore XEP-0066 only?
- Rocket.Chat upload URLs require authentication. Would outbound links need a signed public
  URL, and for how long?

## References

- XEP-0234, XEP-0166, XEP-0261, XEP-0260, XEP-0065, XEP-0300 (hashes), XEP-0363, XEP-0066
