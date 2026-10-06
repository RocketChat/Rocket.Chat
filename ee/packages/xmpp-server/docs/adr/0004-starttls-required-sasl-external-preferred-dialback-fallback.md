# STARTTLS is required when a certificate exists; SASL EXTERNAL is preferred and dialback is the fallback

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/stream/`, `src/s2s/`, `src/service/XMPPServerService.ts` (`toCoreConfig`)

## Decision

- With TLS material configured, STARTTLS is advertised as `<required/>` on inbound streams and
  no authentication mechanism is offered before the stream is secured. Outbound streams abort
  when the peer does not offer STARTTLS.
- After TLS, SASL EXTERNAL is offered inbound when the peer certificate verifies for the
  domain the peer claimed, and attempted outbound when we have a certificate. Server Dialback
  (XEP-0220, keys per XEP-0185) is the fallback in both directions and is always available.
- Direct TLS (XEP-0368, `_xmpps-server._tcp`, port 5270) is neither resolved nor offered.
- Without any TLS material the service starts anyway with `requireTls: false`: STARTTLS is not
  offered and the server federates over cleartext dialback with peers that tolerate it.

## Why

Dialback is what every XMPP server deployment speaks and is the only method that works with
a self-signed certificate, so it has to be there. SASL EXTERNAL is cheaper (no second
connection back to the claimed domain) and is what peers with strict policies
(`s2s_secure_auth`) insist on, so it is preferred when the certificate allows it.

Requiring TLS whenever a certificate exists is the posture of current public servers; a
cleartext federation between two servers that both hold certificates has no excuse. Allowing
cleartext when no certificate is configured is a deliberate concession: it keeps a fresh or
misconfigured install from failing to boot, and a peer that refuses cleartext still fails
loudly on its side.

### Alternatives rejected

- **Refuse to start without a certificate.** Safer, but turns a missing setting into a service
  that never comes up, and the end-to-end suite needs the cleartext path against a local
  ejabberd.
- **Direct TLS on 5270 as well.** A second listener and a second SRV name for a transport
  peers still treat as optional. Can be added later without touching the auth flow.
- **Dialback only.** Fails against peers that require certificate authentication.

## Consequences

- A certificate that is not publicly trusted still federates, but only through dialback and
  only with peers that accept encrypted-but-unverified streams.
- The dialback secret is generated per start (nothing persists it), so verifications in
  flight across a restart fail and the peer retries.
- `connection.established` reports which method authenticated the domain, so operators can
  see which peers fell back.
