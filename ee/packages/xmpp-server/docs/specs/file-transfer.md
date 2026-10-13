---
status: draft
standards: [XEP-0066, XEP-0363]
adrs: [0001, 0006]
code: []
tests: []
---

# Spec: File transfer

## Summary

A file attached to a message in an XMPP room reaches the XMPP user, and a file an XMPP user
sends reaches the Rocket.Chat room as an upload. Files travel as out-of-band URLs
(XEP-0066), the way they travel across the XMPP ecosystem today, in DMs and rooms alike. The
XEP-0363 upload slot service is a client-to-server protocol and is not implemented; what
interoperates is the URL exchange its clients produce.

## Motivation

Text-only federation is the first thing users notice. Today an attachment in an XMPP room
is silently not relayed and an inbound file offer or file URL is stored as plain text
([direct-messages](direct-messages.md) lists attachments as out of scope). Federated servers
reach each other over HTTPS, since Rocket.Chat itself is served over it, so a file URL works
in both directions. Remote files are downloaded and stored rather than shown as links,
because users in defense deployments often cannot reach the remote host; only the path
between the servers is open.

Our files are served from a dedicated endpoint so federated files stay apart from internal
ones, and an enclave network can open just that one path to its peers. The link only
travels over the authenticated S2S connection to authorized domains, which is the real
protection: on the other side it is usually the user's client, not their server, that
fetches the file, so there is no XMPP identity to check over HTTPS. Links are signed, per
file and expiring, where other XMPP servers' upload links are usually permanent and
unsigned. A recipient that has not fetched the file before its link expires does not get
it; most clients and servers fetch as soon as the message lands, and the sender can share
the file again. Deployments with intermittent links (DDIL) are expected to set a longer
expiry.

## Behaviour

Drafted; the requirements below describe the outcome and need the open questions answered
before they are fixed.

**Out-of-band URLs**

- **R1** A message with file attachments saved by a local user in an XMPP DM or room is sent
  with an HTTPS URL for each attachment as the body and as
  `<x xmlns='jabber:x:oob'><url/></x>`, one message per attachment. The URL is a signed
  link to that one file on a dedicated federation download endpoint. No Rocket.Chat login
  is needed: the token in the link is the credential, so anyone holding it can download
  the file until it expires, after a time an administrator sets (24 hours by default, with
  no option for links that never expire). It stops working earlier when the message is
  deleted or federation with the recipient's domain is suspended. An expired or revoked
  link answers with a clear error; sharing the file again sends a new link.
- **R2** An inbound message carrying `<x xmlns='jabber:x:oob'/>`, or whose body is a single
  HTTPS URL, is treated as a file message: the file is fetched, validated against the
  workspace upload settings (size limit, allowed MIME types), stored through the upload
  pipeline and attached to a message authored by the remote user. When the fetch or the
  validation fails, the message is stored with the URL as its text.
- **R3** R2 applies in DMs, hosted rooms and remote rooms.

- **R4** ~~A file attached in an XMPP DM is additionally offered over XEP-0234 to a remote
  user whose client advertises it, with name, size, MIME type and a XEP-0300 hash.~~
  Removed: Jingle is out of scope.
- **R5** ~~A Jingle file offer to a local user is accepted when it passes the upload
  settings, received over the negotiated transport, stored and attached as in R2. Offers
  that fail the settings are declined with the reason the standard provides.~~ Removed:
  Jingle is out of scope.
- **R6** ~~A transfer that fails or is cancelled leaves no partial message; the sender is
  told.~~ Removed with Jingle; a failed fetch is covered by R2.
- **R7** The feature is advertised in `disco#info`.
- **R8** When the domain allow list is not empty, R2 fetches only from hosts in an
  authorized federation domain; a URL on any other host is stored as text.

## Design

Decided in the plan.

## Out of scope

- Implementing an XEP-0363 upload slot service for remote users.
- Jingle File Transfer (XEP-0234). The servers reach each other over HTTPS, so URLs carry
  files both ways; Jingle would add sessions between full JIDs, a resource for every local
  user and a transport to choose, for no file a URL cannot carry. A client that can only
  send files over Jingle cannot send them to Rocket.Chat users.
- Public file URLs: every upload in the workspace would be exposed, not just federated ones,
  with nothing to revoke or audit.
- Streaming media and calls (Jingle RTP, XEP-0167).
- Encrypted transfers (XEP-0384, OMEMO).

## Known defects

None; not implemented.

## Open questions

- **Q1** ~~R1 needs a URL that works without authentication. A signed link with an expiry,
  a public file setting, or a dedicated federation download endpoint? Who may fetch it and
  for how long?~~ A signed link on a dedicated endpoint: R1, Motivation.
- **Q2** ~~R2: fetch and store, or render as a link and let the client fetch? Fetching
  means Rocket.Chat makes outbound HTTPS requests to arbitrary hosts named by remote
  users.~~ Fetch and store, from authorized domains only: R2, R8, Motivation.
- **Q3** ~~XEP-0234 sessions run between full JIDs and need a transport: in-band
  bytestreams (XEP-0261) work over S2S alone but are slow; SOCKS5 bytestreams (XEP-0260)
  need a proxy (XEP-0065) reachable by both ends. Which does the end product accept, and
  does Rocket.Chat have to run a proxy?~~ No Jingle: see Out of scope.
- **Q4** ~~Local users have no resource on the wire outside remote rooms ([addressing
  R7](addressing.md)). Jingle needs one; does the DM path start advertising a resource, and
  what does that mean for presence?~~ No Jingle: see Out of scope.
- **Q5** ~~When both paths apply to one attachment (R1 and R4), is the file sent twice?~~ No
  Jingle: see Out of scope.
- **Q6** ~~How long is an R1 link valid? 24 hours is proposed.~~ An administrator setting,
  24 hours by default, never unlimited: R1.

## References

- XEP-0066, XEP-0363
- XEP-0234, for why it is out of scope
