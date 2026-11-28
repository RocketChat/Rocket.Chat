# DDP sessions

Clients that speak DDP (the web client, mobile, desktop and bots) connect over a WebSocket. In the monolith that
WebSocket is served in process by `@rocket.chat/ddp-server`, the DDP server ddp-streamer also runs
([ADR 0008](../adr/0008-ddp-server-package-in-ce.md)), not by Meteor's DDP server. This page explains what a session
can do, what still runs through Meteor, and who reacts to a session's life. The decision is recorded in
[ADR 0010](../adr/0010-own-http-server-in-front-of-meteor.md); the HTTP side is in [HTTP server](http-server.md).

## Endpoints

Under the `ROOT_URL` path prefix:

| Path                                   | Answer                                                          |
| -------------------------------------- | --------------------------------------------------------------- |
| `/websocket`, `/sockjs/websocket`      | a DDP session over a plain WebSocket                            |
| `/sockjs/<server>/<session>/websocket` | a DDP session with SockJS framing                               |
| `/sockjs/info`                         | the SockJS info document, offering the websocket transport only |
| any other `/sockjs/*`                  | 404: the xhr and polling transports are not served              |
| `/websocket` without an upgrade        | 400                                                             |

Microservices deployments already served only the websocket transport. Any other WebSocket upgrade goes to Meteor.

## What a session can call

The server (`apps/meteor/server/lib/realtime/ddpServer.ts`) answers these itself:

- `login` and `logout`;
- the streams (`stream-*` subscriptions and methods), from `NotificationsModule`;
- the `meteor.loginServiceConfiguration` and `meteor_autoupdate_clientVersions` publications.

Every other method runs through Meteor's method registry, inside a Meteor invocation that carries the session's user
and connection, so `Meteor.methods` code sees `this.userId` and `this.connection` as before. A subscription to any
other name is answered with a 404 error: no Meteor publication is served.

Every method call, and every subscription to a publication the server serves, counts against the DDP rate-limit rules
(`DDPRateLimiter`) before it runs, whichever side implements it. A subscription to an unknown name is refused before it
is counted, as Meteor's server did. Errors a client may see keep their code and reason; anything else becomes a generic
error.

## Logging in

`login` and `logout` call Meteor's own `login` and `logout` methods for the session. Everything that hangs off
Meteor's accounts keeps working: the `Accounts` login hooks and validators, two-factor checks, login restrictions,
the SAU monitor and device management. After a login the session is sent its own user document, as Meteor's default
publication did. A logout closes the socket once the result is sent, so the client reconnects with its default
subscriptions.

When a session connects, the `Meteor.onConnection` callbacks run with a connection object that has the session's id,
client address and request headers.

## Who follows a session

`server/lib/realtime/sessions.ts` holds the process's sessions (`sessions`) and their lifecycle events (`lifecycle`:
connected, logged in, activity, logged out, disconnected). Their consumers:

- **Presence (EE):** a logged-in session is a presence connection of this instance, refreshed on activity and removed
  on logout or disconnection. The instance's connection count follows the sessions.
- **Metrics:** `rocketchat_ddp_sessions_count`, `rocketchat_ddp_sessions_auth` and `rocketchat_ddp_connected_users`
  count these sessions.
- **`RealtimeService`:** closes the sessions of a forced logout, keeps the login services and client versions the
  publications serve up to date, and terminates every session when the server stops.

The monolith does not broadcast the `socket.*` and `accounts.*` broker events that ddp-streamer sends: the Meteor hooks
above already do that work, and doing both would count each login twice.

## In microservices mode

The proxy routes `/websocket` and `/sockjs` to ddp-streamer, so no session reaches the monolith's server. ddp-streamer
uses the same package, logging sessions in through the `accounts` service instead of Meteor, and forwards the methods
it does not implement to the monolith over the broker.

## Differences from Meteor's DDP server

- Subscriptions made before login are not re-run after it. The web client re-subscribes; ddp-streamer behaves the same.
- The `stream-*` methods exist only on the DDP server, so the REST `method.call` endpoints do not reach them.
- The SockJS xhr and polling transports are not served.
- With more `X-Forwarded-For` entries than `HTTP_FORWARDED_COUNT`, the session's client address is the entry that many
  hops from the end. Meteor required an exact count and otherwise used `X-Real-IP`.
