---
status: implemented
standards: [RFC 6122, XEP-0106]
adrs: [0006, 0011, 0015]
code:
  [
    src/jid/,
    src/stream/InboundSession.ts,
    src/service/helpers/jid.ts,
    src/service/helpers/remoteRoom.ts,
    src/service/helpers/xmppUser.ts,
    src/muc/RemoteMucSession.ts,
    src/XMPPServer.ts,
    packages/tools/src/isBareJid.ts,
    apps/meteor/server/meteor-methods/messages/createDirectMessage.ts,
    apps/meteor/server/meteor-methods/rooms/addUsersToRoom.ts,
    apps/meteor/server/lib/rooms/createRoom.ts,
  ]
tests:
  [
    src/jid/escaping.spec.ts,
    src/jid/normalize.spec.ts,
    src/service/helpers/remoteRoom.spec.ts,
    src/service/helpers/xmppUser.spec.ts,
    src/muc/MucService.spec.ts,
    tests/integration/inbound-addressing.spec.ts,
    tests/integration/muc.spec.ts,
    packages/tools/src/isBareJid.spec.ts,
    tests/end-to-end/direct-messages.spec.ts,
    tests/end-to-end/hosted-muc.spec.ts,
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
- **R4** Domains are normalized before any comparison: trimmed, IDNA converted to ASCII, one
  trailing dot removed, lowercased. A domain that does not survive the conversion, holds a
  character a URL host parser would cut at, drop or decode (`/`, `?`, `#`, `\`, `%`,
  inner whitespace), or is left with an empty label (`a..b`, `.a`, `a..`), raises
  `InvalidJidError` and the stanza or stream carrying it is rejected. Normalizing a
  normalized domain changes nothing. An accepted inbound stanza's `from` and `to` carry
  their domains in normalized form, so a remote account has one record and a message one
  event id however the peer spells its domain. A JID a Rocket.Chat user types, opening a DM
  or adding a member to an XMPP room, is taken with its domain normalized the same way,
  internationalized domains included, so it names the record a stanza from that account
  does.
- **R5** Allow and deny lists are evaluated on normalized domains. A domain on the deny list
  is refused regardless of the allow list; an empty allow list allows every domain.
- **R6** The MUC service domain is `<subdomain>.<domain>`, normalized the same way.
- **R7** When Rocket.Chat joins a remote room on a user's behalf, the occupant's full JID
  uses the fixed resource `rocketchat`.
- **R8** A hosted room's JID is `<escaped room name>@<MUC domain>`, fixed at creation.
- **R9** A remote account has one user record, however many DMs, hosted rooms and remote
  rooms it appears in: every path that knows the sender's real JID upserts the record of
  that bare JID. A remote room that does not tell us an occupant's real JID gets a record of
  its own for them, keyed `<nick>#<room JID>` with the nick escaped per XEP-0106 and each
  `#` in it written `\23`, so no two nick and room pairs share a key: a room's localpart may
  hold `#` too, and XEP-0106 escapes every `\`, so `\23` can only stand for a `#`
  ([remote-muc R6](remote-muc.md), [ADR 0015](../adr/0015-remote-room-occupants-are-the-user-their-disclosed-jid-names.md)).
- **R10** A remote user's display name is the nick they were last seen under: the nick they
  joined a hosted room with, or the one they last spoke under in any room. A record created without a nick (a DM, an invitation, a typed JID)
  is named by its bare JID, and an upsert without a nick keeps the name already stored.
- **R11** No remote address resolves to a local account. A record is created or updated
  only for a `<localpart>@<domain>` address, and only when no user other than a remote XMPP
  user holds that username; otherwise the upsert fails and nothing is stored for the stanza.

## Design

`src/jid/escaping.ts` wraps `@xmpp/jid` with the byte limit. `src/jid/normalize.ts` holds
`normalizeDomain` and `isDomainAllowed`; `InboundSession`, `OutboundSession`, `S2SManager`
and the dialback flow call it on every domain they compare. `src/service/helpers/jid.ts` has
`toBareJid` and `domainOfJid` for the service, and `normalizeUserBareJid` normalizes the
real JIDs remote rooms disclose before they become usernames. `createOrUpdateXMPPUser` in
`src/service/helpers/xmppUser.ts` is the single upsert behind R9 and R10: it reduces the JID
to its bare form with `normalizeUserBareJid`, which refuses anything but one localpart and a
valid domain, and hands it to
`Users.upsertXMPPUser` in `packages/models`, which stores the record and decides which name
survives. The upsert matches remote XMPP users only, so a username a local user holds hits
the unique index instead of that user (R11).

## Out of scope

- PRECIS profiles for localparts and structural validation of localparts and resources
  (RFC 7622), wanted by [accreditation-readiness](../intents/accreditation-readiness.md); see
  [ADR 0011](../adr/0011-domain-normalization-is-idna-and-lowercase.md).
- Resource handling for local users: local users have no resource on the wire except in
  remote rooms (R7).
- Serving several XMPP domains.

## Known defects

### D1 A local username shaped like a bare JID is taken for an XMPP account

Rocket.Chat decides a username names an XMPP account by its shape alone. A local username
can look like `alice@corp.example` when a SAML or LDAP sync copies an email address into it,
or an admin widens `UTF8_User_Names_Validation`. Adding such a user to a room that is not
XMPP federated is refused with `error-xmpp-users-in-non-xmpp-rooms`, XMPP on or off. Opening
a DM between them and an XMPP user, or adding them to a hosted room, tries to create an XMPP
record under their own username; the unique index refuses it (R11), so the DM or the room
fails. Where: `isBareJid` filters in `apps/meteor/ee/server/hooks/xmpp/index.ts` and
`apps/meteor/server/lib/rooms/createRoom.ts`. A fix asks who holds each username and treats
a JID-shaped one as XMPP only when no local user does. Test: `direct-messages.spec.ts`,
"treats a local user whose username looks like a JID as that local user".

### D2 Local JIDs are not escaped

R1 is not implemented: a local user's JID is built as `<username>@<domain>` with no
XEP-0106 escaping, and inbound localparts are looked up without unescaping. A username that
holds a character a localpart cannot carry, which needs a widened
`UTF8_User_Names_Validation`, sends from an invalid JID and cannot be reached. Where: every
`` `${user.username}@${this.server.domain}` `` in `XMPPServerService`, and the username
lookups in its inbound handlers. Test: `direct-messages.spec.ts`, "sends from the escaped
JID of a local user whose username needs escaping".

## Open questions

- **Q1** Occupants of a remote room that discloses no real JID are stored under a synthetic
  `<nick>#<room JID>` address (R9). It is a syntactically valid JID but routes nowhere.
  Should such users be marked so the client never offers to DM them?

## References

- RFC 6122, XEP-0106, RFC 7622 (not implemented)
