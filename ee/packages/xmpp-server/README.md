# @rocket.chat/xmpp-server

Native XMPP server-to-server (S2S) federation for Rocket.Chat. Lets a Rocket.Chat
instance act as an XMPP server: exchange 1:1 messages and presence with remote
XMPP users, host MUC rooms, and join MUC rooms on remote servers — all over
standard RFC 6120/6121 S2S, without a bridge.

See [../../../docs/features/xmpp-server.md](../../../docs/features/xmpp-server.md)
(feature & operations) and
[../../../docs/features/xmpp-server-architecture.md](../../../docs/features/xmpp-server-architecture.md)
(code architecture) for the full picture.

## Two layers

- **Protocol core** (`src/`, excluding `src/service/`) — transport and protocol
  only, with no Rocket.Chat dependencies. Built on `ltx`/`@xmpp/jid` plus Node
  `net`/`tls`/`dns`. Exposes the `XMPPServer` class: lifecycle, imperative send
  methods, and a typed event map via `@rocket.chat/emitter`.
- **Integration service** (`src/service/`) — `XMPPServerService`, a
  `@rocket.chat/core-services` `ServiceClass` that bridges the protocol core to
  Rocket.Chat models and events.

The protocol core is kept free of product dependencies; only the service layer
imports `@rocket.chat/*` product packages. The service runs only in the
`ee/apps/xmpp-server-service` microservice
(`yarn workspace @rocket.chat/xmpp-server-service ms`), never inside Meteor.

## What it implements

- S2S streams with STARTTLS, SASL EXTERNAL and Server Dialback (XEP-0220/0185)
- DNS SRV resolution, connection reuse, bounded queueing and backoff
- Stanza routing with spoofing protection; disco (XEP-0030) and ping (XEP-0199)
- MUC (XEP-0045) subset: hosted rooms, remote-room client sessions, and
  mediated/direct (XEP-0249) invites

## Testing

```sh
yarn testunit   # unit + in-process integration tests (two servers over loopback)
```

Unit tests are colocated (`src/**/*.spec.ts`). Integration tests under
`tests/integration/` spin up two `XMPPServer` instances on loopback with an
injected DNS resolver and self-signed certificates, exercising dialback,
messaging, presence and cross-server MUC without any external peer.

```sh
yarn test:e2e   # against a running Rocket.Chat, xmpp-server-service and XMPP server
```

The end-to-end suite (`tests/end-to-end/`) drives real XMPP users on a real
server such as ejabberd. Its setup and environment variables are in
[the architecture doc](../../../docs/features/xmpp-server-architecture.md#end-to-end-tests).
