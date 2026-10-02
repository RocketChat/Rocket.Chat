---
status: partial
standards: [RFC 6121]
adrs: [0006, 0010]
code:
  [
    src/handlers/parse.ts,
    src/router/StanzaRouter.ts,
    src/XMPPServer.ts,
    src/service/helpers/presence.ts,
    src/service/XMPPServerService.ts,
  ]
tests: [src/service/helpers/presence.spec.ts, tests/integration/routing.spec.ts, tests/end-to-end/presence.spec.ts]
---

# Spec: Presence

## Summary

Rocket.Chat users and their XMPP DM partners see each other's availability. Subscriptions
are implicit: sharing a DM is the subscription
([ADR 0010](../adr/0010-presence-subscriptions-auto-accepted-only-from-dm-partners.md)).

## Motivation

XMPP clients show contacts as online or offline and some refuse to start a chat with an
offline contact. A Rocket.Chat user who never appears online is a worse correspondent than
a bot.

## Behaviour

- **R1** When a local user's status changes and presence is enabled, a `<presence/>` is sent
  from their JID to the `with` JID of every XMPP DM room they are in: `online` as available,
  `away` with `<show>away</show>`, `busy` with `<show>dnd</show>`, anything else as
  `type='unavailable'`.
- **R2** An availability `<presence/>` from a known remote user, when presence is enabled,
  sets that user's status: `unavailable` to offline, `<show>` `away` or `xa` to away, `dnd`
  to busy, otherwise online. The change is stored as both `status` and `statusDefault` and
  broadcast like any local status change.
- **R3** A `<presence type='subscribe'/>` to a local user is answered `subscribed` and then
  with our own `subscribe` when the two already share an XMPP DM room, and `unsubscribed`
  otherwise. Nothing is stored.
- **R4** `subscribed`, `unsubscribe`, `unsubscribed` and `probe` from a peer are decoded and
  counted but have no effect.
- **R5** With `XMPP_Server_Presence_Enabled` off, nothing is sent and inbound presence is
  ignored.
- **R6** Presence is never sent to a JID the user does not share a DM with.

## Design

The router emits `presence.received` for availability presence and one event per
subscription type. The service maps status to presence and back in
`src/service/helpers/presence.ts`. Outbound fan-out listens on the broker event
`presence.status`, the same source the Matrix service uses, and looks up the user's `dm`
rooms.

## Out of scope

- Roster storage and a roster UI.
- Answering probes.
- Status text: `<status/>` is parsed but not stored; `statusText` is not sent.
- Presence priority and multiple resources.
- Presence into and out of rooms is specified in [hosted-muc](hosted-muc.md) and
  [remote-muc](remote-muc.md).

## Known defects

### D1 Presence from XMPP users is ignored

Every inbound availability presence is discarded. The remote user is loaded without the
field that marks it as an XMPP user, so it never passes the federated-user check and its
status never changes. Where: `onIncomingPresence` projection in `XMPPServerService.ts`.
Test: `presence.spec.ts`, "applies a contact's presence to their Rocket.Chat user".

### D2 Rocket.Chat status changes do not reach XMPP contacts

After a Rocket.Chat user changes status, the XMPP server never receives a presence from
them. The user holds a live session, their status really changes, and the DM with the
contact is marked as XMPP-federated. The cause is not known; the service's debug log
(`LOG_LEVEL=debug`) is the place to start. Test: `presence.spec.ts`, "relays a Rocket.Chat
status change to subscribed contacts".

### D3 Every inbound message may reset the sender's status to offline

Suspected, not pinned by a test. The remote user upsert that runs on every inbound message
sets `status: OFFLINE` unconditionally, which would undo any presence applied by R2 once D1
is fixed. Where: `src/service/helpers/xmppUser.ts`.

## Open questions

- **Q1** Should the service send the current presence of every user with XMPP DMs when a
  peer domain connects, so contacts learn the status without waiting for a change?
- **Q2** Should `unavailable` be sent for every user when the service stops?

## References

- RFC 6121 §3 (subscriptions), §4 (exchanging presence)
- [ADR 0010](../adr/0010-presence-subscriptions-auto-accepted-only-from-dm-partners.md)
