---
status: implemented
standards: []
adrs: [0002, 0004, 0012, 0013]
code:
  [
    src/config.ts,
    src/service/configuration.ts,
    src/service/XMPPServerService.ts,
    ee/apps/xmpp-server-service/src/service.ts,
    apps/meteor/server/settings/federation-service.ts,
  ]
tests: [src/XMPPServer.spec.ts, tests/integration/service-observer.spec.ts, tests/end-to-end/connectivity.spec.ts]
---

# Spec: Configuration and lifecycle

## Summary

How the server is switched on, configured, reconfigured and switched off, and what the
microservice exposes to operate it. Settings live in Rocket.Chat; the service reads them over
the broker and keeps the listener in line with them.

## Motivation

An administrator must be able to enable the feature, change its domain or certificate and
restrict peers without touching the microservice, and the microservice must be observable
under load.

## Behaviour

**Settings**

- **R1** The configuration is read from the `XMPP_Server_*` settings listed in
  [operations.md](../operations.md#admin-settings) and from the license.
- **R2** The server is enabled only when the license has the `federation` module and
  `XMPP_Server_Enabled` is on and `XMPP_Server_Domain` is set. Otherwise it is stopped.
- **R3** TLS is required when both certificate and key are set. With either missing, the
  server starts without STARTTLS ([ADR 0004](../adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)).
- **R4** The allow list is the comma-separated setting, entries trimmed, empty entries
  dropped; an empty list allows every domain.

**Lifecycle**

- **R5** The service applies its configuration on start and again on every `watch.settings`
  event for an `XMPP_Server_*` key and every `license.module` event for `federation`.
  Applications are serialized ([ADR 0013](../adr/0013-reconfigure-restarts-the-listener-only-for-listener-settings.md)).
- **R6** A change to the domain, port, MUC subdomain, certificate or key stops the server and
  starts a new one. Any other change to a running server is applied without a restart.
- **R7** After the listener is up, hosted rooms are registered and remote rooms rejoined from
  the database. A failure in that step is logged and does not stop the listener
  ([ADR 0012](../adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)).
- **R8** Disabling the feature or stopping the service closes the listener and every S2S
  connection.
- **R9** Inbound handlers run detached from the stanza that triggered them; a handler
  failure is logged and never closes the stream.

**Microservice**

- **R10** `XMPP_DECODE_ONLY=true` parses, routes and answers at the protocol level but
  forwards nothing to Rocket.Chat, admits every hosted-room join and requests no history on
  remote-room joins.
- **R11** `XMPP_DNS_OVERRIDES` replaces resolution for the listed domains only.
- **R12** `LOG_LEVEL` sets the process log level; `debug` logs every inbound event.
- **R13** `/stats` and `/metrics` on `PORT` report decoded events by type, handler
  in-flight/completed/failed counts and latency, event-loop lag and memory, as described in
  [operations.md](../operations.md#observability).

## Design

`readXMPPServerConfiguration` builds a plain configuration from a settings getter and the
license flag; `applyConfiguration` compares a fingerprint of the listener settings to decide
between restart and soft update; `toCoreConfig` maps the configuration to the core's
`XMPPServerConfig`, adding the `authorizeMucJoin` delegate unless in decode-only mode. The
microservice entrypoint in `ee/apps/xmpp-server-service/src/service.ts` constructs the
service with the observer that feeds `/stats`.

## Out of scope

- A deny list: the core supports `deniedDomains`, no setting exposes it.
- Binding to a specific address or an ephemeral port: the service always binds `0.0.0.0`
  and the configured port.
- Persisting the dialback secret across restarts.
- Running more than one instance per domain.
- Inbound back-pressure: there is no queue and no concurrency limit on handlers.

## Known defects

### D1 Allow list changes need a service restart

Changes to `XMPP_Server_Domain_Allow_List` are only applied when the server restarts. The
allow list is not part of the listener fingerprint, and the soft update path refreshes only
the presence flag, so the running server keeps enforcing the old list. Where:
`applyConfiguration` and `fingerprintOf` in `XMPPServerService.ts`. Test:
`connectivity.spec.ts`, "drops messages from a domain outside the allow list".

## Open questions

- Should a missing certificate refuse to start instead of degrading to cleartext? See
  [ADR 0004](../adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md).
- Should the dialback secret be a setting, so verifications survive a restart?

## References

- [operations.md](../operations.md)
