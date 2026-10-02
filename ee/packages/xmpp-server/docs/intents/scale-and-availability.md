# Intent: Scale and availability targets

Author: Diego Sampaio. Status: draft.

## Problem

The server was built to validate protocol behaviour and UX, not to production scalability
patterns. Today it runs as exactly one instance per XMPP domain with all session and room
state in memory ([ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)),
inbound handling has no queue, no concurrency limit and no back-pressure
([configuration-and-lifecycle](../specs/configuration-and-lifecycle.md) out of scope), and
no spec states a capacity, a latency or an availability target. An overloaded service
accepts everything and falls behind silently ([operations.md](../operations.md#observability)).

## Proposed outcome

Measured, agreed targets for each dimension below, and a server that meets them under a
repeatable load test:

- concurrent S2S connections and federation peers;
- concurrent federated identities;
- concurrent federated rooms, hosted and remote;
- message throughput and end-to-end latency;
- presence throughput;
- concurrent file transfers and maximum size, once [file-transfer](../specs/file-transfer.md) ships;
- recovery time after a crash or restart, and what is lost;
- availability and the HA topology that delivers it.

Under overload the service degrades visibly (refuses or slows peers, raises a metric)
rather than queueing without bound. Each peer's session is isolated: a slow or hostile peer
does not delay or corrupt another's traffic.

## Affected users and systems

- Operators sizing a deployment; every user under load.
- [configuration-and-lifecycle](../specs/configuration-and-lifecycle.md) (single instance,
  back-pressure), [s2s-connectivity](../specs/s2s-connectivity.md) R10 queue limits,
  [architecture.md](../architecture.md) if state moves out of process.
- The `/stats` and `/metrics` endpoints and the decode-only load-testing mode.
- PROJ-120 scope "Re-architect the native XMPP server", the non-functional requirements
  table (all TBD), and scenarios 7.10 "Maintain multiple concurrent S2S sessions" and
  "Handle concurrent federated conversations".

## Constraints

- [ADR 0002](../adr/0002-integration-service-runs-only-as-a-microservice.md): the server runs
  as a microservice.
- The specs describe behaviour on the wire and in the database; a re-architecture must keep
  every `R` in them, which is what makes it a rebuild on a validated foundation rather than
  a new product.
- Targets come from load tests, not from estimates.

## Open questions

- What are the target numbers, and against which reference peer (ejabberd, Prosody, M-Link)
  are they measured?
- Is high availability active-active (several instances per domain, which supersedes ADR
  0012) or active-passive with fast failover?
- Which state has to leave the process for HA: MUC rosters, remote-room sessions, the
  dialback secret, outbound queues?
- Where does back-pressure act: TCP read pause per stream, a bounded handler queue, stanza
  errors (`resource-constraint`)?
