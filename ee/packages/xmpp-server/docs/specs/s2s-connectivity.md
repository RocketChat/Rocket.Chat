---
status: implemented
standards: [RFC 6120, RFC 2782, XEP-0220, XEP-0185]
adrs: [0003, 0004, 0005, 0011, 0012]
code: [src/stream/, src/s2s/, src/xml/, src/router/StanzaRouter.ts, src/config.ts]
tests:
  [
    src/xml/StanzaParser.spec.ts,
    src/stream/XmppStream.spec.ts,
    src/s2s/dialback.spec.ts,
    src/s2s/dnsResolver.spec.ts,
    src/s2s/S2SManager.spec.ts,
    src/router/StanzaRouter.spec.ts,
    src/XMPPServer.spec.ts,
    tests/integration/s2s.spec.ts,
    tests/integration/inbound-addressing.spec.ts,
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
  or on an already secure stream, is answered with `<failure/>` and the stream closed. TLS
  material that cannot be loaded fails that one upgrade, in either direction, and closes
  only that stream.
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
  the domains authenticated on that connection and its `to` domain is ours. Otherwise the
  stream MUST be closed with `not-authorized` when no domain has authenticated yet (RFC 6120
  §4.9.3.12), `improper-addressing` when `from` or `to` is missing (§8.1.1.2, §8.1.2.2),
  `invalid-from` when the `from` domain is not authenticated on the connection (§8.1.2.2),
  and `host-unknown` when the `to` domain is neither the server domain nor the MUC domain
  (§8.1.1.2).
- **R17** An inbound connection on which no domain authenticates within a minute is closed
  with the `connection-timeout` stream error.
- **R7** XML is restricted per RFC 6120 §11.1: a DOCTYPE, entity declaration, comment, CDATA
  section or processing instruction closes the stream. A top-level element larger than the
  stanza cap (default 256 KiB) or nested deeper than the depth cap closes the stream. The
  cap counts each top-level element's own bytes and the whitespace before it, however the
  reads split or share them; the stream header is counted on its own. The check runs
  before the element is parsed. The
  stream is decoded as UTF-8 across reads, so a character split between two reads arrives
  whole (RFC 6120 §11.6).

**Outbound streams**

- **R8** A remote domain is resolved through `_xmpp-server._tcp.<domain>` SRV records ordered
  per RFC 2782 (ascending priority, weighted random inside a priority), falling back to
  A/AAAA on port 5269 when there are none. A single SRV target of `.` means the domain
  offers no XMPP service and the connection fails without a fallback.
- **R9** The outbound side negotiates in this order: connect (15 s timeout), STARTTLS when
  the peer offers it (abort when TLS is required and the peer offers none), SASL EXTERNAL
  when we hold a certificate and the peer offers the mechanism, otherwise dialback.
- **R10** There is one route per remote domain holding at most one outbound session. Stanzas
  sent while the session is not ready are queued, up to 256 per domain; beyond that the new
  send rejects with `QueueOverflowError` and the stanzas already queued are kept. A failed connection is retried with exponential backoff
  and full jitter from 1 s up to 5 min; `connection.failed` reports the attempt count. A
  route idle for 10 min is closed.
- **R11** Replies the server generates (IQ results, stanza errors) are routed by their `to`
  domain through the same routes as application traffic.
- **R15** A stanza handed to the server for sending whose `from` domain is neither the server
  domain nor the MUC domain MUST be refused: the send rejects and nothing is written to any
  stream (RFC 6120 §8.1.2.2: the `from` domain must be one the sending server validated).
- **R16** After three consecutive failed connection attempts to a remote domain, every stanza
  queued for it MUST be rejected with the connection failure, alongside R10's
  `connection.failed`. The limit is a Rocket.Chat choice, not a protocol rule.
- **R18** Stopping the server ends each outbound stream with the closing
  `</stream:stream>` (RFC 6120 §4.4), after everything already written to it, so a stanza
  whose send resolved is not lost to the stop.

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
- XmppAddr and SRVName certificate names, and refusing the subject CN, wanted by
  [accreditation-readiness](../intents/accreditation-readiness.md) ([ADR 0005](../adr/0005-peer-certificates-name-a-domain-by-dnsname-srvname-or-xmppaddr.md)).
- A deny list exists in the core config but has no setting ([configuration-and-lifecycle](configuration-and-lifecycle.md)).
- A cap on inbound connections, overall or per peer address, and closing authenticated
  inbound streams that sit idle: only the authentication deadline (R17) bounds them today.
  Part of [scale-and-availability](../intents/scale-and-availability.md).

## Known defects

### D1 An XML declaration split across reads closes the stream

A peer whose `<?xml ...?>` declaration arrives in two reads gets `not-well-formed` and loses
the stream. The parser strips the declaration only when all of it is in the first read, and
takes a partial one for a processing instruction (R7). Servers send the declaration and the
stream header in one write, so only a slow or hand-typed connection hits it. Where:
`StanzaParser.write`. Test: `tests/integration/inbound-addressing.spec.ts`, "opens a stream
whose XML declaration arrives split across reads"; no XMPP server can be made to split its
declaration, so this one is an integration test.

### D2 Stopping the server drops stanzas not yet written out

A send resolves once the stanza is handed to the socket. Stopping the server destroys
outbound sockets instead of closing their streams, so stanzas still buffered are lost
although their send resolved (R18). Where: `S2SManager.stopAll` calls `destroy()` on outbound
sessions. Test: `tests/integration/s2s.spec.ts`, "delivers every stanza already sent when
the server stops"; the end-to-end harness cannot stop the service between a send and its
delivery, so this one is an integration test.

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
  [ADR 0005](../adr/0005-peer-certificates-name-a-domain-by-dnsname-srvname-or-xmppaddr.md),
  [ADR 0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md)
