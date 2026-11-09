# The DDP server lives in a CE package

- **Status:** accepted; what stays in ddp-streamer revised by [ADR 0010](0010-own-http-server-in-front-of-meteor.md)
- **Date:** 2026-10
- **Scope:** `packages/ddp-server`, `ee/apps/ddp-streamer`, later `apps/meteor`

## Decision

The Meteor-free DDP server built for `ee/apps/ddp-streamer` moves to `packages/ddp-server`
(`@rocket.chat/ddp-server`), under the repository's MIT license. That covers the codec, sessions, method and
publication dispatch, the connection lifecycle and registry, the Streamer adapter, the presence methods, and the
client-version and login-service publications. ddp-streamer becomes a service around the package. `apps/meteor`
becomes its second consumer when it stops relying on Meteor's own DDP server.

These stay in ddp-streamer:

- **The service shell:** boot, broker, metrics, the HTTP routes for health and SockJS info, connection counts,
  presence bookkeeping on connection events, and sending the user document after login.
- **`login` and `logout`:** they call the `accounts` service, and only account-service implements it.
- **The Meteor fallback:** forwarding unknown methods to `MeteorService` only makes sense when Meteor runs in a
  different process.

## Why

- Removing Meteor requires a DDP endpoint in the community monolith, because mobile, desktop and bot clients speak
  DDP and must stay wire-compatible. A server that already runs in production, with its tests, exists. Writing a
  second one would mean maintaining two implementations of the same protocol.
- The split follows each piece's dependencies, not where it used to run. Everything that moved depends only on
  workspace packages and `core-services` proxies, which resolve in process as well as over the broker. Everything
  that stayed needs a service that is remote in microservices mode, or is deployment plumbing.

## Consequences

- The moved code is MIT-licensed from now on.
- Like `@rocket.chat/streamer` ([ADR 0002](0002-streamer-package-barrel-entry.md)), the package has a single entry
  that exports only what its consumers import. The monolith adds the exports it needs when it adopts the package.
- Names (`Server`, `Session`, `MeteorCollection`) and the `DDP-Streamer` log label are unchanged. Renaming them is a
  separate change.
