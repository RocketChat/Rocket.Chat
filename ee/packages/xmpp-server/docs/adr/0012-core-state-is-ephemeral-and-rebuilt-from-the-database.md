# Core state is ephemeral and rebuilt from the database on every start

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/` state, `src/service/XMPPServerService.ts` (`restoreMucState`)

## Decision

The protocol core persists nothing. Sessions, per-domain queues and backoff timers, in-flight
dialback verifications, hosted-room occupant maps, remote-room sessions and the dialback
secret exist only in memory. On every start the service rebuilds what the core needs from the
database: every `host-muc` room is registered again with its local members as virtual
occupants, and every `remote-muc` room is rejoined once per subscribed local member. A
failure during that rebuild is logged and does not stop the listener.

One service process per XMPP domain. A second process would hold a second, disjoint copy of
all of the above.

## Why

The durable facts (who is a member of which room, which user is which JID, what was said)
already live in Rocket.Chat's collections, and the service can derive the core's state from
them. Persisting the core's own view would create a second source of truth that drifts from
the first on every crash. The cost is a burst of work on start, which is bounded by the number
of federated rooms.

### Alternatives rejected

- **Persist occupant and session state.** Drift, plus a migration surface in a package that
  is meant to stay product-agnostic.
- **Shared state across instances (Redis, NATS KV).** Needed only for multi-instance, which
  the listener model does not support yet; it would be designed together with that.

## Consequences

- Remote occupants of hosted rooms are not restored; they rejoin on their own when their
  server reconnects. Until then they are members in Rocket.Chat but not occupants in the core.
- A restart produces one join per member of every mirrored room and requests history, which
  is how messages sent during the downtime are caught up.
- Dialback verifications in flight across a restart fail and are retried by the peer.
- Multi-instance deployment is out of scope until a shared-state design exists; the
  operations doc says to run one instance.
