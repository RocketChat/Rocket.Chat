---
status: implemented
standards: [XEP-0030]
adrs: [0008]
code: [src/iq/disco.ts, src/muc/MucService.ts, src/router/StanzaRouter.ts]
tests: [src/iq/disco.spec.ts, tests/end-to-end/connectivity.spec.ts]
---

# Spec: Service discovery

## Summary

Remote servers and clients can ask the server what it is and what it offers: the server
identity, the MUC service, the public rooms, and the features of a given room. This is what
lets an XMPP client find `conference.<domain>` and decide whether a room is joinable.

## Motivation

Clients disco a room before joining it and refuse rooms whose identity is not
`conference/text`; servers disco a peer to learn whether it supports dialback. Without
XEP-0030 nothing else interoperates.

## Behaviour

- **R1** `disco#info` on the server domain answers identity `server/im` named `Rocket.Chat`
  and the features `disco#info`, `disco#items`, `urn:xmpp:ping` and `jabber:server:dialback`.
- **R2** `disco#items` on the server domain lists the MUC service domain as an item.
- **R3** `disco#info` on the MUC domain answers identity `conference/text` named
  `Rocket.Chat Conferences` and the features `disco#info` and
  `http://jabber.org/protocol/muc`.
- **R4** `disco#items` on the MUC domain lists the hosted rooms that are public channels, by
  JID. Private groups are never listed, even to their members.
- **R5** `disco#info` on a hosted room JID answers identity `conference/text` named by the
  room subject (or its id when empty) and the features `muc`, `muc_persistent`,
  `muc_unmoderated`, `muc_nonanonymous`, then `muc_public` or `muc_hidden` and `muc_open` or
  `muc_membersonly` depending on whether the room is a public channel.
- **R6** `disco#info` on a room JID the server does not host is answered `item-not-found`.
- **R7** `disco#items` on a room JID discloses no occupants.
- **R8** A disco query on a user JID at our domain is not answered with a disco result; it
  falls to the generic `service-unavailable` of [s2s-connectivity R12](s2s-connectivity.md).

## Design

`buildDiscoReply` in `src/iq/disco.ts` is a pure function over the resolved config, a
public-room lister and a room describer, both supplied by `MucService`. `StanzaRouter` calls
it for every IQ that is not a ping.

## Out of scope

- Entity capabilities (XEP-0115) and extended disco info (XEP-0128) such as room occupant
  counts or descriptions.
- Advertising features of capabilities that are not implemented. Each spec that adds a
  feature says which `var` it adds here.

## Known defects

None.

## Open questions

None.

## References

- XEP-0030, XEP-0045 §6 (room discovery features)
