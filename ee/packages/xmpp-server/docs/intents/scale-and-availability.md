# Intent: Scale and availability targets

Author: Diego Sampaio. Status: accepted.

## Problem

The server was built to validate protocol behaviour and UX, not to production scalability
patterns. Today it runs as exactly one instance with all session and room
state in memory ([ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)),
inbound handling has no queue, no concurrency limit and no back-pressure
([configuration-and-lifecycle](../specs/configuration-and-lifecycle.md) out of scope), and
no spec states a capacity, a latency or an availability target. An overloaded service
accepts everything and falls behind silently ([operations.md](../operations.md#observability)).

## Proposed outcome

The server's capacity in each dimension below, measured by a repeatable load test and
published as the numbers Rocket.Chat states:

- concurrent S2S connections and federation peers;
- concurrent federated identities;
- concurrent federated rooms, hosted and remote;
- message throughput and end-to-end latency;
- presence throughput;
- concurrent file transfers and maximum size, once [file-transfer](../specs/file-transfer.md) ships;
- recovery time after a crash or restart, and what is lost.

No target is fixed up front. When a customer asks for a number the measured capacity does
not reach, the request is evaluated then and pursued as its own work.

The XMPP server service stays a single instance, without high availability. Availability
is the recovery time above: a crash or restart is recovered by restarting that instance,
which rebuilds its state from the database.

Under overload the service degrades visibly (refuses or slows peers, raises a metric)
rather than queueing without bound. Each peer's session is isolated: a slow or hostile peer
does not delay or corrupt another's traffic.

## Affected users and systems

- Operators sizing a deployment; every user under load.
- [configuration-and-lifecycle](../specs/configuration-and-lifecycle.md) (back-pressure),
  [s2s-connectivity](../specs/s2s-connectivity.md) R10 queue limits.
- The `/stats` and `/metrics` endpoints and the decode-only load-testing mode.

## Constraints

- [ADR 0002](../adr/0002-integration-service-runs-only-as-a-microservice.md): the server runs
  as a microservice.
- The specs describe behaviour on the wire and in the database; a re-architecture must keep
  every `R` in them, which is what makes it a rebuild on a validated foundation rather than
  a new product.
- The numbers come from load tests, not from estimates or requested targets.
- Load tests measure against Openfire, with Prosody as a second peer: the servers
  [interop-certification](interop-certification.md) certifies against. M-Link is out of
  scope.
- No high availability, active-active or active-passive: a single instance of the XMPP
  server service, and
  [ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md) holds.
  Adding HA is too complex for the value it brings.
- Back-pressure acts per inbound stream: handlers run through a bounded, ordered queue per
  stream, and the socket stops reading at a high watermark and resumes at a low one, the
  way ejabberd and Prosody throttle peers. A global limit on Rocket.Chat-side handlers feeds
  the same pause. Outbound writes wait for the socket to drain, and a peer that never drains
  is closed. `resource-constraint` (type `wait`) answers only IQ get and set when the global
  queue is full, never groupchat or presence: an error sent to a remote room gets our member
  expelled.

## Open questions

- **Q1** ~~What are the target numbers, and against which reference peer (ejabberd,
  Prosody, M-Link) are they measured?~~ Measured against Openfire, with Prosody as a second
  peer: see Constraints. The numbers moved to Q5.
- **Q2** ~~Is high availability active-active (several instances per domain, which
  supersedes ADR 0012) or active-passive with fast failover?~~ Neither: see the no-HA
  constraint.
- **Q3** ~~Which state has to leave the process for HA: MUC rosters, remote-room sessions,
  the dialback secret, outbound queues?~~ None: see the no-HA constraint.
- **Q4** ~~Where does back-pressure act: TCP read pause per stream, a bounded handler
  queue, stanza errors (`resource-constraint`)?~~ Per inbound stream: see Constraints.
- **Q5** ~~What are the starting target numbers? They come from the field team, sized on
  the biggest deal in the pipeline (Navy, for example); load testing sets the final ones.~~
  None up front: the numbers are what load testing measures, see Proposed outcome.
