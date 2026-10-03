---
status: implemented
standards: [RFC 6122, XEP-0106]
adrs: [0006, 0011, 0015]
code: [src/jid/, src/service/helpers/jid.ts, src/service/helpers/xmppUser.ts, src/muc/RemoteMucSession.ts, src/XMPPServer.ts]
tests:
  [
    src/jid/escaping.spec.ts,
    src/jid/normalize.spec.ts,
    src/service/helpers/xmppUser.spec.ts,
    tests/integration/muc.spec.ts,
    tests/end-to-end/remote-muc.spec.ts,
  ]
---

# Spec: Addressing

## Summary

How Rocket.Chat users and rooms are named on the XMPP network, how remote addresses are
identified locally, and how domains are compared.

## Motivation

Every other capability sends and receives JIDs. The mapping has to be bijective (a JID
names exactly one user, a user has exactly one JID), survive usernames that are not valid
localparts, and compare domains the way DNS does.

## Behaviour

- **R1** A local user's JID is `<localpart>@<XMPP domain>`, where the localpart is the
  Rocket.Chat username escaped per XEP-0106 when it contains characters a localpart cannot
  carry (space, `"`, `&`, `'`, `/`, `:`, `<`, `>`, `@`, and `\` followed by an escape
  sequence). Inbound localparts are unescaped before the username lookup.
- **R2** An escaped localpart MUST NOT exceed 1023 bytes (RFC 6122).
- **R3** A remote user is identified by their bare JID: the resource is stripped on every
  inbound stanza, and the bare JID is the local username of their record
  ([ADR 0006](../adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md)).
- **R4** Domains are normalized before any comparison: trimmed, trailing dot removed, IDNA
  converted to ASCII, lowercased. A domain that does not survive the conversion raises
  `InvalidJidError` and the stanza or stream carrying it is rejected.
- **R5** Allow and deny lists are evaluated on normalized domains. A domain on the deny list
  is refused regardless of the allow list; an empty allow list allows every domain.
- **R6** The MUC service domain is `<subdomain>.<domain>`, normalized the same way.
- **R7** When Rocket.Chat joins a remote room on a user's behalf, the occupant's full JID
  uses the fixed resource `rocketchat`.
- **R8** A hosted room's JID is `<escaped room name>@<MUC domain>`, fixed at creation.
- **R9** A remote account has one user record, however many DMs, hosted rooms and remote
  rooms it appears in: every path that knows the sender's real JID upserts the record of
  that bare JID. A remote room that does not tell us an occupant's real JID gets a record of
  its own for them, keyed `<nick>#<room JID>`
  ([remote-muc R6](remote-muc.md), [ADR 0015](../adr/0015-remote-room-occupants-are-the-user-their-disclosed-jid-names.md)).
- **R10** A remote user's display name is the nick they were last seen under: the nick they
  joined a hosted room with, or the one they last spoke under in any room. A record created without a nick (a DM, an invitation, a typed JID)
  is named by its bare JID, and an upsert without a nick keeps the name already stored.

## Design

`src/jid/escaping.ts` wraps `@xmpp/jid` with the byte limit. `src/jid/normalize.ts` holds
`normalizeDomain` and `isDomainAllowed`; `InboundSession`, `OutboundSession`, `S2SManager`
and the dialback flow call it on every domain they compare. `src/service/helpers/jid.ts` has
`toBareJid` and `domainOfJid` for the service, and `normalizeUserBareJid` normalizes the
real JIDs remote rooms disclose before they become usernames. `createOrUpdateXMPPUser` in
`src/service/helpers/xmppUser.ts` is the single upsert behind R9 and R10.

## Out of scope

- PRECIS profiles for localparts and resources (RFC 7622), see
  [ADR 0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md).
- Resource handling for local users: local users have no resource on the wire except in
  remote rooms (R7).
- Serving several XMPP domains.

## Known defects

None.

## Open questions

- Occupants of a remote room that discloses no real JID are stored under a synthetic
  `<nick>#<room JID>` address (R9). It is a syntactically valid JID but routes nowhere.
  Should such users be marked so the client never offers to DM them?

## References

- RFC 6122, XEP-0106, RFC 7622 (not implemented)
