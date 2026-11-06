# Presence subscriptions are auto-accepted only from existing DM partners

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/service/XMPPServerService.ts` (`onSubscriptionRequest`, `broadcastLocalPresence`)

## Decision

- An inbound `<presence type='subscribe'/>` is answered with `subscribed` followed by our own
  `subscribe` when the local user already shares an XMPP DM room with the sender, and with
  `unsubscribed` otherwise. No roster is stored.
- Outbound presence is fanned out to the remote bare JID of every XMPP DM room the local user
  is in. The DM room is the subscription.
- Both directions are gated by `XMPP_Server_Presence_Enabled`.

## Why

Rocket.Chat has no roster and no UI for approving a presence request. Deriving the
subscription from an existing DM gives a rule a user can understand (people I talk to see my
status) without a new data model or a new dialog, and it leaks presence to nobody the user
has not already engaged with.

### Alternatives rejected

- **Accept every request.** Leaks status to any domain that asks.
- **Store a roster and ask the user.** Needs a model, a UI and a notification path; a later
  capability can add it on top without changing the wire behaviour for DM partners.
- **Never accept.** Remote clients then never see Rocket.Chat users as online.

## Consequences

- The policy is fixed; there is no setting and no per-user choice.
- A remote user who never opened a DM cannot subscribe, even if the local user wants it.
- `presence.subscribed`, `presence.unsubscribed` and `presence.probe` are emitted by the core
  but only counted by the service; probes are not answered.
