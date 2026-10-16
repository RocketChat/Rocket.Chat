# Remote users are local user records keyed by bare JID, marked `xmppFederation`, never `federation`

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/service/helpers/xmppUser.ts`, `packages/core-typings` (`IUser`, `IRoom`), `apps/meteor/ee/server/hooks/xmpp`

## Decision

- A remote XMPP user is a document in the users collection whose `username` is the bare JID
  (`alice@remote.tld`), with `federated: true`, role `federated-external`, and
  `xmppFederation: { version, jid, origin }`. The record is upserted the first time the user
  interacts and updated on every later interaction.
- A room that takes part in XMPP federation carries
  `xmppFederation: { version, role: 'dm' | 'host-muc' | 'remote-muc', muc?, with?, origin }`.
- Neither users nor rooms ever get `user.federation`, `room.federation` or
  `room.federated: true`. Those belong to Matrix.
- Occupants of a remote room who do not disclose a real JID are materialized under a
  synthetic bare JID `<nick>#<room@conference.remote.tld>`.

## Why

The product already knows how to render, mention and list a federated user; reusing the user
record gets all of that for free and keeps every message's `u._id` pointing at a real
document. Using the bare JID as username makes the mapping bijective without a lookup table,
and local username validation already forbids `@`, so no local user can squat a JID.

Matrix federation keys its behaviour on `federated` and `federation`, and
`FederationActions.shouldPerformFederationAction` throws for a `federated` room that is not
Matrix-native. Keeping those fields untouched is what lets both federations coexist without a
single runtime check in either code path. The Matrix remote-user heuristics (`@` plus `:`)
never match a bare JID, so the separation holds in both directions.

### Alternatives rejected

- **Reuse `federation` with a `type: 'xmpp'` discriminator.** Every Matrix hook would need a
  guard, and one missed guard would throw inside a message pipeline.
- **A separate collection for remote XMPP users.** Breaks everything that joins messages to
  users by `_id`, and the client has no way to render them.
- **Username as localpart only.** Collides with local users and loses the domain.

## Consequences

- Searching users by JID is a username lookup.
- Every remote user upsert sets `status: OFFLINE`, which is the suspected cause of
  [presence D3](../specs/presence.md#d3-every-inbound-message-may-reset-the-senders-status-to-offline).
- The synthetic `nick#room` users are never deleted and have no real address; a room that
  later discloses JIDs produces a second record per occupant.
- `isUserXMPPFederated` and `isRoomXMPP*` in `core-typings` are the only guards the hooks need.
