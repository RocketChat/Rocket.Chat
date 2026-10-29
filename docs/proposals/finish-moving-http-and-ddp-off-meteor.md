# Proposal: finish moving HTTP and DDP off Meteor

Status: proposed, not implemented.

## Context

The server owns its HTTP server and serves DDP with `@rocket.chat/ddp-server`
([ADR 0010](../adr/0010-own-http-server-in-front-of-meteor.md)). Meteor's `webapp` still answers every request the
root app does not route, and Meteor's DDP code still runs the methods and accounts behind the DDP server
([features/http-server.md](../features/http-server.md), [features/ddp-sessions.md](../features/ddp-sessions.md)).
The goal is a server where nothing reaches Meteor, so `webapp`, Meteor's `ddp-server` and the packages around them
can be dropped.

## Proposal

Each step is its own pull request, and each leaves production working with the Meteor fallback behind it.

### 1. Move the `WebApp.connectHandlers` sites to the root app

Still on the fallback: avatar (and its global middleware), file-upload, fileDecrypt, data-export, assets,
emoji-custom, custom-sounds, i18n, robots, livechat, CAS, SAML, requestSeats, the swagger `/api-docs`, the OAuth2
server `/oauth/*`, and the ui-master page injection.

These run after Meteor strips the `ROOT_URL` path prefix and after its static files, so a moved handler must add the
prefix itself and must not shadow a file in `public/`. Start with the self-contained file and asset handlers, then the
authentication flows. Leave the page injection to step 3.

### 2. Decide the path prefix of the root routes

`/api`, `/hooks`, the health probes, the Apps-Engine and UiKit apps, and passport answer at the root even when
`ROOT_URL` has a path; `/_timesync` reads a prefix global that is never set. That is the behavior from before the move,
and changing it is a decision of its own, with the reverse proxies and clients that rely on it.

### 3. Serve the client page, runtime config and `public/`

Covered by [serve-client-without-meteor-webapp.md](serve-client-without-meteor-webapp.md). After it, the client
version published to `meteor_autoupdate_clientVersions` comes from the Vite manifest, so `MeteorService` stops
reading it from Meteor's autoupdate publication handler.

### 4. Retire Meteor's DDP server

- **Readers of `Meteor.server.sessions`**, which is now always empty:
  - `server/startup/rateLimiter.js` sets `broadcastAuth` from it, so it is always false;
  - `MeteorService` closes Meteor sessions on `user.forceLogout`; `RealtimeService` already does it for the real ones.
- **The method registry:** methods still registered with `Meteor.methods` run through the DDP server's fallback.
  Move each to the DDP server or to REST, with its rate-limit rule.
- **Accounts:** `login` and `logout` go through Meteor's methods so the `Accounts` hooks run, and sessions are
  announced to `Meteor.onConnection`. Move those consumers (the SAU monitor, livechat agent activity and business hours, the
  logout clean-up, failed-login logging) to the session lifecycle or the `accounts.*` events, then log in through the `accounts` service as
  ddp-streamer does.
- **`server/lib/debug.js`** wraps `Meteor.methods` and `Meteor.publish` for logging and tracing; move that to the DDP
  server's method dispatch.

### 5. Close the DDP differences

- The REST `method.call` endpoints no longer reach the `stream-*` methods. Check mobile, desktop and the SDKs before
  this ships in a release; serve the writes they need over REST or the DDP server.
- The user document sent after login uses `getBaseUserFields` in the monolith and a list of its own in ddp-streamer.
  Share one.
- Subscriptions made before login are not re-run after it. Decide whether the server re-runs them or clients keep
  re-subscribing.
- Per-connection presence is wired only in EE, as before. Decide whether CE gets it.

### 6. Compress the root app's responses

Meteor gzips what it serves; the routes on the root app are not compressed. Add compression on the root app, with the
same exclusions, before the larger responses (files, the page) move to it.

### 7. Drop Meteor's server

Once the fallback receives nothing, the root app's `notFound` answers 404, and `webapp`, Meteor's `ddp-server`,
`ddp-rate-limiter` and `packages/meteor-inject-initial` are removed.

## Risks

- Every moved handler changes ordering against Meteor's prefix stripping and static files. Compare headers and
  status codes against the fallback for each one, under a path prefix and behind a CDN.
- The accounts move touches login for every client. SAU and presence must neither drop nor double count, in the
  monolith and in microservices mode.
- `stream-*` writes over REST may be used by clients this repository does not contain.
