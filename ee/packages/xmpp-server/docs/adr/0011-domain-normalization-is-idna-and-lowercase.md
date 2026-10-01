# Domain normalization is IDNA to ASCII plus lowercase; no stringprep or PRECIS

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/jid/normalize.ts`, every trust comparison in `src/stream/` and `src/s2s/`

## Decision

`normalizeDomain` trims, strips a trailing dot, converts to ASCII with Node's `domainToASCII`
(IDNA) and lowercases. It throws `InvalidJidError` for anything that does not survive the
conversion. Every comparison that decides trust (dialback domains, the spoof check, allow and
deny lists, the stream `to`) goes through it. Localparts and resources are not normalized
beyond XEP-0106 escaping.

## Why

The comparisons that matter for security are between domains, and domains are DNS names:
IDNA plus case folding is exactly the equivalence DNS uses, and it is what the resolver will
look up. Full RFC 7622 PRECIS profiles for localparts and resources would need a stringprep
library and would only matter for matching user identities that are never compared for
trust.

### Alternatives rejected

- **Full PRECIS (RFC 7622).** A dependency and a surface for subtle mismatches with peers
  that implement it differently, for no security gain in S2S.
- **No normalization.** `Example.COM` and `example.com` would be different trust domains.

## Consequences

- A localpart with unusual Unicode is passed through as the peer sent it; two spellings that
  PRECIS would fold are two users.
- Any new comparison of domains must call `normalizeDomain` on both sides.
