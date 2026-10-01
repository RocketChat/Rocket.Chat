---
status: implemented
standards: [XEP-0199]
adrs: []
code: [src/iq/ping.ts, src/router/StanzaRouter.ts]
tests: [src/router/StanzaRouter.spec.ts, tests/end-to-end/connectivity.spec.ts]
---

# Spec: Ping

## Summary

The server answers XMPP pings, which is how peers and the end-to-end suite check that
federation with Rocket.Chat is alive in both directions.

## Motivation

A ping answered over S2S proves DNS, TLS and authentication all worked. It is the preflight
of every test suite and the first thing an administrator tries.

## Behaviour

- **R1** An IQ `get` carrying `<ping xmlns='urn:xmpp:ping'/>` addressed to the server domain,
  the MUC domain or any JID at either is answered with an empty IQ `result` carrying the
  same id, from the JID it was sent to.
- **R2** `urn:xmpp:ping` is advertised in the server's `disco#info`
  ([service-discovery R1](service-discovery.md)).

## Design

`isPing` and `buildPingReply` in `src/iq/ping.ts`; `StanzaRouter` checks for a ping before
disco.

## Out of scope

- Sending pings. The server never pings a peer; idle outbound routes are closed instead
  ([s2s-connectivity R10](s2s-connectivity.md)).

## Known defects

None.

## Open questions

None.

## References

- XEP-0199
