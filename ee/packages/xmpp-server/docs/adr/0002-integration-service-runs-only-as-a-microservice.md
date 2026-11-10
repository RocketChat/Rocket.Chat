# The integration service runs only as a microservice

- **Status:** accepted
- **Date:** 2026-09
- **Scope:** `src/service/`, `ee/apps/xmpp-server-service`, `apps/meteor/ee/server/hooks/xmpp`

## Decision

`XMPPServerService` is hosted by `ee/apps/xmpp-server-service` and by nothing else. Meteor
does not register the service in either deployment mode. Meteor keeps only the outgoing
hooks (`afterSaveMessage`, room and membership callbacks) and the setting definitions, and
reaches the service through the `XMPPServer` broker proxy. When the microservice is absent,
those calls resolve to nothing and the feature is inactive.

## Why

The service owns a TCP listener on port 5269 that has to be reachable from the internet.
Binding it inside Meteor would tie the XMPP port to the web process: every Meteor instance in
a cluster would bind its own listener with its own in-memory state, and the port could not be
exposed independently of the HTTP one. A separate process has one listener, one state, its
own health port and its own resource limits, and can be load-tested on its own.

### Alternatives rejected

- **Run inside Meteor in monolith mode, as a microservice otherwise.** Two code paths for
  lifecycle and two sets of operational instructions, for a feature that already requires an
  enterprise license and is expected to run in microservices deployments.
- **Run the listener in Meteor and only the handlers in the service.** Splits the core across
  a network boundary for no gain; the core is the part that must stay in one process.

## Consequences

- The feature requires a microservices deployment. The feature doc says so.
- One instance of the service per XMPP domain; a second instance would bind a second listener
  with disjoint MUC and session state ([ADR 0012](0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)).
- Settings and license reach the service through the broker, so the service cannot start
  before Meteor's `settings` and `license` services are reachable.
- The `Log_Level` admin setting does not reach the process; `LOG_LEVEL` does.
