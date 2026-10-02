---
status: implemented
standards: [RFC 6120, RFC 2782, XEP-0220, XEP-0185]
adrs: [0003, 0004, 0005, 0011, 0012]
code: [src/stream/, src/s2s/, src/xml/, src/router/StanzaRouter.ts, src/config.ts]
tests:
  [
    src/xml/StanzaParser.spec.ts,
    src/s2s/dialback.spec.ts,
    src/s2s/dnsResolver.spec.ts,
    src/router/StanzaRouter.spec.ts,
    src/XMPPServer.spec.ts,
    tests/integration/s2s.spec.ts,
    tests/end-to-end/connectivity.spec.ts,
  ]
---

# Spec: S2S connectivity

## Summary

Rocket.Chat accepts server-to-server connections from other XMPP servers and opens
connections to them on demand, authenticates the remote domain on every connection, and only
dispatches stanzas whose origin was authenticated. Everything else in this package rides on
these streams.

## Motivation

Federation without a bridge means speaking RFC 6120 S2S directly. The connection layer is the
part a hostile peer talks to first, so it carries the hardening (restricted XML, size caps,
spoof check, domain lists) and the authentication (STARTTLS, SASL EXTERNAL, dialback).

## Behaviour

**Inbound streams**

- **R1** The server listens on `bindAddress:port` (default `0.0.0.0:5269`). Each accepted TCP
  connection is one XML stream.
- **R2** The stream header's `to` MUST be the server domain or the MUC domain; anything else
  is answered with the stream error `host-unknown`. A `from`, when present, MUST pass the
  allow and deny lists; otherwise `policy-violation`.
- **R3** When TLS material is configured, `<starttls/>` is advertised in stream features, as
  `<required/>` when TLS is required, and no authentication mechanism is offered before the
  stream is secured. A `<starttls/>` request is answered with `<proceed/>`, the socket is
  upgraded, and the stream restarts with a fresh stream id. A request without TLS material,
  or on an already secure stream, is answered with `<failure/>` and the stream closed.
- **R4** After TLS, SASL `EXTERNAL` is offered when the peer certificate verifies for the
  domain the stream header claimed. An `<auth mechanism='EXTERNAL'/>` whose authzid (or, for
  `=`, the stream `from`) is an allowed domain and matches the certificate authenticates that
  domain and restarts the stream. Failures are `invalid-mechanism`, `encryption-required`,
  `invalid-authzid` or `not-authorized`, each followed by a stream close.
- **R5** Server Dialback is accepted in all three roles. Receiving: a `<db:result/>` for an
  allowed domain is verified with the claimed domain over a separate outbound connection
  (never over the inbound one); `valid` authenticates the domain and is echoed as
  `type='valid'`; `invalid` is echoed and the stream closed with `not-authorized`; an error
  is echoed as `type='error'`. A `<db:result/>` for a domain outside the lists is answered
  `type='error'`. When TLS is required, a `<db:result/>` over cleartext closes the stream
  with `policy-violation`. Authoritative: a `<db:verify/>` is answered `valid` or `invalid`
  against our secret. Keys follow XEP-0185 (`HMAC-SHA256` keyed with the hex SHA-256 of the
  secret over `receiving originating streamId`) and are compared in constant time.
- **R6** A `message`, `presence` or `iq` is dispatched only when its `from` domain is one of
  the domains authenticated on that connection and its `to` domain is ours. A stanza that
  fails either check, or has no `from` or `to`, is dropped and logged.
- **R7** XML is restricted per RFC 6120 §11.1: a DOCTYPE, entity declaration, comment, CDATA
  section or processing instruction closes the stream. A top-level element larger than the
  stanza cap (default 256 KiB) or nested deeper than the depth cap closes the stream.

**Outbound streams**

- **R8** A remote domain is resolved through `_xmpp-server._tcp.<domain>` SRV records ordered
  per RFC 2782 (ascending priority, weighted random inside a priority), falling back to
  A/AAAA on port 5269 when there are none. A single SRV target of `.` means the domain
  offers no XMPP service and the connection fails without a fallback.
- **R9** The outbound side negotiates in this order: connect (15 s timeout), STARTTLS when
  the peer offers it (abort when TLS is required and the peer offers none), SASL EXTERNAL
  when we hold a certificate and the peer offers the mechanism, otherwise dialback.
- **R10** There is one route per remote domain holding at most one outbound session. Stanzas
  sent while the session is not ready are queued, up to 256 per domain; beyond that the send
  rejects with `QueueOverflowError`. A failed connection is retried with exponential backoff
  and full jitter from 1 s up to 5 min; `connection.failed` reports the attempt count. A
  route idle for 10 min is closed.
- **R11** Replies the server generates (IQ results, stanza errors) are routed by their `to`
  domain through the same routes as application traffic.

**Routing of authenticated stanzas**

- **R12** An IQ `get` or `set` that no handler answers is answered with
  `service-unavailable` (type `cancel`). IQ `result` and `error` with no pending request are
  logged and dropped. Any top-level element other than `message`, `presence` or `iq` is
  dropped.
- **R13** Stream errors use RFC 6120 §4.9 conditions; stanza errors use §8.3 conditions with
  the original stanza's id and swapped addressing.
- **R14** `connection.established` is emitted once per authenticated domain and connection
  with the direction, whether TLS is on and which method authenticated it;
  `connection.lost` when a connection closes.

## Design

`InboundSession` and `OutboundSession` are the two state machines, each owning one
`XmppStream` (socket plus `StanzaParser`). `S2SManager` owns the listener, the per-domain
routes with their queues and `Backoff`, and performs dialback verification by opening a
one-shot `OutboundSession` in `verifyDialback` mode towards the claimed domain. `dialback.ts`
derives and checks keys; `saslExternal.ts` checks a peer certificate for a domain;
`dnsResolver.ts` resolves and orders addresses and is injectable for tests. `StanzaRouter`
dispatches what the sessions accepted.

The dialback secret is generated at start and never persisted
([ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)).

## Out of scope

- Client-to-server connections, BOSH, WebSocket. Rocket.Chat clients are not XMPP clients.
- Direct TLS, XEP-0368 ([ADR 0004](../adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)).
- Bidirectional streams (XEP-0288): each direction is its own connection.
- Stream management (XEP-0198): no acknowledgements, no resumption. Pending triage in
  [compliance.md](../compliance.md).
- Serving more than one domain: the server is exactly one domain plus its MUC subdomain.
- XmppAddr and SRVName certificate names ([ADR 0005](../adr/0005-peer-certificates-are-matched-on-dnsname-only.md)).
- A deny list exists in the core config but has no setting ([configuration-and-lifecycle](configuration-and-lifecycle.md)).

## Known defects

None pinned by a test.

## Open questions

- **Q1** `message.error` is declared in the event map but never emitted: an error stanza
  from a peer (for example `remote-server-not-found` for a message we sent) is dropped by
  the chat parser. Should the sender be told?
- **Q2** Should the server send XEP-0199 pings on idle outbound routes instead of closing
  them?

## References

- RFC 6120 §4 (streams), §5 (STARTTLS), §6 (SASL), §8.3 (stanza errors), §11.1 (restricted XML)
- RFC 2782, XEP-0220, XEP-0185
- [ADR 0004](../adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md),
  [ADR 0005](../adr/0005-peer-certificates-are-matched-on-dnsname-only.md),
  [ADR 0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md)
