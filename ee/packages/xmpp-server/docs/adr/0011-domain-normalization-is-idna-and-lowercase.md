# Domain normalization is IDNA to ASCII plus lowercase; localparts are compared under PRECIS UsernameCaseMapped

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** `src/jid/normalize.ts`, every trust comparison in `src/stream/` and `src/s2s/`, remote room JIDs in `src/muc/MucService.ts` and `src/XMPPServer.ts`, the [accreditation-readiness](../intents/accreditation-readiness.md) intent

## Decision

`normalizeDomain` trims, strips a trailing dot, converts to ASCII with Node's `domainToASCII`
(IDNA) and lowercases. It throws `InvalidJidError` for anything that does not survive the
conversion. Every comparison that decides trust (dialback domains, the spoof check, allow and
deny lists, the stream `to`) goes through it.

User localparts are compared under the UsernameCaseMapped profile of RFC 8265, after XEP-0106
unescaping. The profile is implemented in this package, not taken from a third-party one.
Every part of an inbound `from` or `to` is checked against the structure RFC 7622 sets
(no empty or oversize part, no character it forbids); a JID that fails is refused with
`jid-malformed` and creates nothing. Resources are checked for structure only, never folded.

Remote room JIDs keep their own rule: `normalizeRoomJid` lowercases the localpart. It is
applied to the room JID of every incoming invitation and to the room part of every remote
room session key.

Until [accreditation-readiness](../intents/accreditation-readiness.md) ships, user localparts
and resources are not normalized or validated beyond XEP-0106 escaping.

## Why

The comparisons that matter for security are between domains, and domains are DNS names:
IDNA plus case folding is exactly the equivalence DNS uses, and it is what the resolver will
look up.

A localpart becomes a Rocket.Chat username, so two spellings that a peer treats as one user
must not become two users here, and a malformed JID must not become a username at all.
UsernameCaseMapped is the comparison RFC 7622 assigns to localparts, which is what the
accreditation review checks against. It is implemented here because the npm options are
stale or brand new, and the review scrutinises vendored Unicode code.

A remote room JID is compared for identity: it is the key of the channel that mirrors the
room ([remote-muc R1](../specs/remote-muc.md)) and of the sessions that carry its traffic. A
direct invitation (XEP-0249) carries a room JID typed by the inviter's client, so two
invitations into one room can spell it differently, and without folding case each spelling
would get its own channel. RFC 7622 maps localpart case, and MUC services treat room names
case-insensitively, so lowercasing loses nothing.

### Alternatives rejected

- **No PRECIS for localparts** (this ADR's earlier decision). Two spellings PRECIS folds
  would be two users, and nothing would stop a malformed localpart from becoming a username.
- **A third-party PRECIS library.** The options are stale or brand new.
- **Only rejecting what `@xmpp/jid` cannot parse.** It accepts parts RFC 7622 forbids.
- **No normalization of domains.** `Example.COM` and `example.com` would be different trust
  domains.

## Consequences

- Any new comparison of domains must call `normalizeDomain` on both sides, and any new
  comparison of user localparts the UsernameCaseMapped one.
- A Rocket.Chat username that cannot be carried as a localpart, even with XEP-0106 escaping,
  is not federated.
