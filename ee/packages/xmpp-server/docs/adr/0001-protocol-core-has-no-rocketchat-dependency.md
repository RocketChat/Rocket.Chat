# The protocol core has no Rocket.Chat dependency

- **Status:** accepted
- **Date:** 2026-08
- **Scope:** `src/` except `src/service/`

## Decision

The package is two layers in one workspace. Everything under `src/` except `src/service/` is
the protocol core: it imports Node (`net`, `tls`, `dns`, `crypto`), `ltx`, `@xmpp/jid`, `pino`
and `@rocket.chat/emitter`, and nothing else from the monorepo. It knows XMPP and nothing about
rooms, users, settings or the database.

`src/service/` is the integration layer. It is the only place that imports
`@rocket.chat/core-services`, `@rocket.chat/core-typings` and `@rocket.chat/models`. It
consumes the core through the `XMPPServer` facade: a typed event map for everything inbound,
imperative methods for everything outbound, and one request/response delegate
(`authorizeMucJoin`) because join authorization cannot be fire-and-forget.

Every event payload is JSON-serializable and every public method returns a promise, so the
boundary could become a process boundary without changing the API.

## Why

The federation code that existed before (the Matrix service, the XMPP-via-Matrix bridge)
mixes protocol handling with product calls, which makes it impossible to test the protocol
against a scripted peer without a database, and impossible to reason about compliance in
isolation. The S2S handshake, dialback, MUC state machines and XML hardening are the parts
that have to match specifications written by someone else; they are the parts most worth
testing without Rocket.Chat in the loop.

### Alternatives rejected

- **One layer, product calls where convenient.** Faster to write, but every protocol test
  needs the models mocked, and compliance bugs hide behind product bugs.
- **Two packages.** Cleaner in principle, but the service and the core are released and
  versioned together, and a second package adds build and workspace overhead for a boundary
  that an import rule already enforces.

## Consequences

- `tests/integration/` runs two complete `XMPPServer` instances over loopback with no
  Rocket.Chat involved. The load generator reuses the core as a fake remote server.
- The core keeps only ephemeral state ([ADR 0012](0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)).
  Everything durable is the service's problem.
- Adding a capability usually touches both layers: a parser or state machine in the core, a
  handler in the service. Specs describe both halves.
- Nothing in the core may log through `@rocket.chat/logger`; the service adapts its logger to
  the pino-style interface the core expects.
