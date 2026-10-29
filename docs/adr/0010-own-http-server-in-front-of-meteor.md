# The server owns its HTTP and WebSocket server, in front of Meteor's

- **Status:** accepted
- **Date:** 2026-10
- **Scope:** `apps/meteor/server/lib/http`, `apps/meteor/server/lib/realtime`, `packages/http-router`,
  `packages/ddp-server`, `ee/apps/ddp-streamer`

## Decision

The monolith listens on a Node HTTP server of its own, answered by a root Hono app. Meteor's `webapp` keeps building
its server and app, but never binds the port: whatever no route of ours answers is handed to Meteor's app unchanged.
Routes move off Meteor one at a time, and Meteor is removed once nothing reaches it
([features/http-server.md](../features/http-server.md)).

These moved in the first step:

- **Every raw handler:** the REST API, webhooks and federation routers are mounted on the root app instead of going
  through an Express bridge on `WebApp.rawConnectHandlers`. The health probes, `/_timesync`, `/theme.css` and the
  `.well-known` metadata are Hono routes. The Express apps (passport, the Apps-Engine HTTP API, UiKit) run as
  middlewares under the paths they serve. Force_SSL and the global headers are base middlewares that apply to every
  response, Meteor's included.
- **The WebSocket:** the DDP endpoints are served in process by `@rocket.chat/ddp-server`
  ([features/ddp-sessions.md](../features/ddp-sessions.md)). Methods it does not implement still run through Meteor's
  method registry, and `login`/`logout` through Meteor's accounts.

This revises what [ADR 0008](0008-ddp-server-package-in-ce.md) kept in ddp-streamer. `login`/`logout` are in the
package, which takes where sessions log in as a parameter: the `accounts` service for ddp-streamer, Meteor's accounts
for the monolith. Presence tracking on lifecycle events, forced logouts, and keeping the login-service and
client-version publications current are shared too.

## Why

- Removing Meteor means replacing its HTTP and WebSocket server. Owning the socket first, with Meteor behind it, lets
  every route move in its own small change while production keeps working, instead of one switch for everything.
- `WebApp.startListening` is a hook Meteor documents as overridable, so taking over the port needs no patch to
  Meteor. Meteor still parses the listen options and runs its startup callbacks.
- The REST API was already Hono. Mounting it directly drops the Express bridge and the body handling it needed.
- The monolith and ddp-streamer now run one DDP implementation, so a fix to the protocol reaches both deployments.

Rejected alternatives:

- **Keep mounting on `WebApp.rawConnectHandlers`.** Every new route would still depend on Meteor's server, and the
  REST API would keep going through the Express bridge.
- **Emit unrouted requests on Meteor's HTTP server.** That ran Meteor's request listeners on our sockets, which reset
  the idle timeout to Meteor's 5 seconds after every response and overrode `HTTP_SOCKET_TIMEOUT_MS`. Unrouted requests
  go to Meteor's Express app instead.
- **Register Hono's Node adapter or routers from app code.** Meteor's bundler cannot load ESM-only packages or
  `exports` subpaths, so the plumbing lives in `@rocket.chat/http-router`, which loads through Node.

## Consequences

- Meteor's DDP server is still built and attached to its unbound server; it receives no connections.
  `Meteor.server.sessions` is empty, so code reading it sees no session.
- Behavior that changed:
  - the DDP session metrics count the new server's sessions;
  - the SockJS xhr and polling transports answer 404;
  - the `stream-*` methods are no longer reachable through REST `method.call`;
  - subscriptions made before login are not re-run after it;
  - DDP accepts an `X-Forwarded-For` longer than `HTTP_FORWARDED_COUNT`, as REST and ddp-streamer already did;
  - `/theme.css` sends its byte length as `Content-Length`, not its character count.
- New HTTP code registers on the root app; `WebApp.connectHandlers` is legacy.
- A workspace package the server loads has its third-party dependencies repeated in `apps/meteor/package.json`, or
  the production bundle starts without them.
- What remains on Meteor, and the order to move it, is in
  [proposals/finish-moving-http-and-ddp-off-meteor.md](../proposals/finish-moving-http-and-ddp-off-meteor.md).
