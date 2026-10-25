# Peer certificates name a domain by dNSName, SRVName or XmppAddr, never by the CN

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** `src/s2s/saslExternal.ts`, the [accreditation-readiness](../intents/accreditation-readiness.md) intent

## Decision

- A peer certificate is accepted for a domain when the TLS socket reports the chain as
  trusted (`socket.authorized`) and one of the server identities RFC 6120 §13.7.1.2 defines
  names that domain:
  - a dNSName subject alternative name, wildcards included;
  - an SRVName for `_xmpp-server.<domain>`;
  - an XmppAddr equal to the domain.
- The subject CN never names a domain, even in a certificate with no subject alternative
  name (RFC 9525 §6.3).
- Our own certificate may name our domain and the MUC subdomain through any of the three.

Until [accreditation-readiness](../intents/accreditation-readiness.md) ships, the code
matches dNSName only, through Node's `checkServerIdentity`, which falls back to the CN when
a certificate has no dNSName.

## Why

Defense PKIs issue certificates that name servers by XmppAddr, and under the fail-closed
switch the accreditation-readiness intent adds, a peer whose name does not match is refused
instead of falling back to dialback. Matching dNSName only would keep those PKIs from
federating at all.

The cost that kept XmppAddr and SRVName out is gone: Node already decodes both otherName
entries in the certificate's `subjectaltname` (`othername:XmppAddr:…`,
`othername:SRVName:…`), so no ASN.1 parsing reaches the authentication path.

RFC 9525 no longer recognises the CN as an identifier: it is untyped, so a CN cannot say
which service it names.

### Alternatives rejected

- **dNSName only** (this ADR's earlier decision). A peer named only by XmppAddr or SRVName
  falls back to dialback, which fail-closed forbids.
- **Keep Node's CN fallback.** Accepts a name RFC 9525 rejects, and a security review would
  flag it.
- **An ASN.1 library to read otherName entries.** A new dependency on the authentication
  path for what Node already exposes.

## Consequences

- `checkServerIdentity` cannot be used alone: the CN fallback has to be cut off before it,
  and SRVName and XmppAddr are matched beside it.
- A certificate that names the domain only in its CN no longer authenticates through SASL
  EXTERNAL. With fail-closed off it falls back to dialback; with it on, the peer is refused.
- A certificate meant for public peers should still carry dNSName entries: it is what public
  CAs issue and what every peer checks.
