# HTTP server

The Rocket.Chat server answers HTTP on a server of its own, not on Meteor's. Meteor's `webapp` still builds its
server but never binds it: our server owns the listening socket and hands Meteor only what it does not route itself.
This page explains how a request finds its handler and where to add a new one. The decision is recorded in
[ADR 0010](../adr/0010-own-http-server-in-front-of-meteor.md).

## How a request is answered

The server (`apps/meteor/server/lib/http/httpServer.ts`) is a Node `http.Server` answered by a root Hono app,
`httpApp`. Meteor still parses `PORT`, `BIND_IP` and `UNIX_SOCKET_PATH`; overriding `WebApp.startListening`, a hook
Meteor documents as overridable, makes our server listen with those options instead of Meteor's.

Every request goes through three stages:

1. **Base middlewares** run first, for every request, whoever answers it: the Force_SSL redirect, the
   `X-Instance-ID` header, and the security headers with the Content-Security-Policy. They set their headers on the
   Node response, so they reach the pages and files Meteor still serves as well as our routes.
2. **Routes on the root app:**
   - the REST API (`/api`), the incoming webhooks (`/hooks`) and the federation routes, as routers mounted directly
     on the root app;
   - the health probes (`/health`, `/livez`, `/readyz`), `/_timesync`, `/theme.css`, and the OAuth and MCP
     `.well-known` metadata, as plain Hono routes;
   - Express apps, each under the paths it serves: passport (`/oauth/*`, `/_oauth/*`), the
     Apps-Engine HTTP API (`/api/apps/private/*`, `/api/apps/public/*`) and UiKit interactions
     (`/api/apps/ui.interaction/*`);
   - the DDP endpoints' non-websocket answers (see [DDP sessions](ddp-sessions.md)).
3. **Meteor's app** gets every request no route answered, untouched. That is still most of the product's pages and
   files: the client page, `public/`, avatars, uploads, assets, livechat, i18n, SAML, CAS, the OAuth2 server and every
   other `WebApp.connectHandlers` site. Meteor strips the `ROOT_URL` path prefix and serves its static files before
   those handlers run, as it always did.

WebSocket upgrades take a separate path: a handler registered with `addUpgradeHandler` may claim an upgrade, and the
DDP server claims its endpoints. Any other upgrade goes to Meteor's server.

## Adding a route

- **A Hono handler:** register it on `httpApp` (`httpApp.get(path, handler)`). This is the default for new code.
- **A `Router` from `@rocket.chat/http-router`:** `mountRouter(httpApp, router)` answers every request under the
  router's base. A router can be mounted after the server has started answering requests, which the federation routes
  rely on once a license allows them.
- **An existing Express or connect app:** `httpApp.use('<path>/*', nodeHandler(app))`. A request the app hands on with
  `next()` continues to the routes after it. Mount it only under the paths it serves, and before any router whose base
  covers them, since a router answers everything under its base.
- **A header or check for every response:** `addBaseMiddlewares(...)`. It runs ahead of every route, including routes
  registered before it, so it does not depend on module evaluation order.
- **A `WebApp.connectHandlers` handler** still works and is reached through the fallback. Don't add new ones.

Routes on the root app see the request before Meteor strips the `ROOT_URL` path prefix. `/theme.css` and the DDP
endpoints add the prefix to their path. Every other route answers at the root, as the raw handlers it replaced did:
the REST API, webhooks and health probes
([ADR 0009](../adr/0009-web-client-built-by-vite-served-by-the-server.md)), and `/_timesync`, which reads a prefix
global that is never set.

The Hono and Node plumbing (`createRootApp`, `createNodeServer`, `createMiddlewareSlot`, `mountRouter`, `nodeHandler`)
lives in `@rocket.chat/http-router`: Meteor's bundler cannot load ESM-only packages or package `exports` subpaths, such
as `@hono/node-server` or `hono/router/trie-router`, from app code, while workspace packages load through Node.

## Connection handling

- **Idle sockets:** `HTTP_SOCKET_TIMEOUT_MS`, when set, is the socket and keep-alive timeout, so it can be put above a
  proxy's idle timeout. Otherwise the server keeps Meteor's behavior: a 5 second idle timeout that Meteor's own
  per-request adjustment extends for long requests.
- **Malformed requests** get Node's answer, `400 Bad Request` (`431` for oversized headers, `408` on a request
  timeout), instead of a dropped connection, so a load balancer can tell them apart from a failing server.
- **Client address:** `HTTP_FORWARDED_COUNT` decides which `X-Forwarded-For` entry is the client for REST (the
  `remoteAddress` middleware) and DDP sessions. With more entries than the count, the one that many hops from the end
  is used. The Express apps keep their own `trust proxy` setting: passport trusts one proxy, the OAuth2 server
  `HTTP_FORWARDED_COUNT`.
- **Compression:** the routes on the root app are not compressed, as the raw handlers they replace were not. Meteor's
  gzip still applies to what it serves.

## Deployment

The production bundle only ships the third-party dependencies listed in `apps/meteor/package.json`. A workspace
package the server loads, such as `@rocket.chat/http-router` or `@rocket.chat/ddp-server`, has its own dependencies
repeated there; otherwise the container fails at startup with `MODULE_NOT_FOUND`. `yarn dev` does not show this,
because it loads packages from the hoisted root `node_modules`.
