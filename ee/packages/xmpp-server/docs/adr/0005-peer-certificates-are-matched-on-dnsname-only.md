# Peer certificates are matched on dNSName only

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/s2s/saslExternal.ts`

## Decision

For SASL EXTERNAL, a peer certificate is accepted for a domain when the TLS socket reports the
chain as trusted (`socket.authorized`) and Node's `checkServerIdentity` matches the domain
against the certificate's dNSName subject alternative names, wildcards included. The
XmppAddr and SRVName otherName entries defined by RFC 6120 §13.7.1.2 are not evaluated.

## Why

Certificates issued by public CAs carry dNSName entries and, in practice, nothing else;
Let's Encrypt does not issue XmppAddr or SRVName. Node's matcher implements the dNSName rules
correctly and is maintained; parsing otherName entries would mean decoding the certificate's
ASN.1 by hand.

### Alternatives rejected

- **Parse otherName entries.** Correct per the RFC, but adds an ASN.1 dependency or
  hand-written parsing to the authentication path for certificates nobody issues.

## Consequences

- A peer whose certificate names its domain only through XmppAddr or SRVName cannot use SASL
  EXTERNAL and falls back to dialback. It still federates.
- The reverse direction has the same limit: our certificate must carry dNSName entries for
  the XMPP domain and the MUC subdomain.
