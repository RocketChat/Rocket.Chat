# @rocket.chat/xmpp-server

Native XMPP server-to-server (S2S) federation for Rocket.Chat. Lets a Rocket.Chat instance act
as an XMPP server: exchange 1:1 messages and presence with remote XMPP users, host MUC rooms,
and join MUC rooms on remote servers, over standard RFC 6120/6121 S2S, without a bridge.

This package is developed spec-first. Everything about it lives in [docs/](docs/):

- [docs/README.md](docs/README.md): how work is done here (intents, specs, plans, ADRs).
- [docs/compliance.md](docs/compliance.md): which RFCs and XEPs are supported, partially
  supported, planned or not planned, and the spec that owns each.
- [docs/specs/](docs/specs/): one spec per capability, with requirements and known defects.
- [docs/adr/](docs/adr/): the decisions behind the current shape.
- [docs/architecture.md](docs/architecture.md): module map and message flows.
- [docs/operations.md](docs/operations.md): settings, DNS, TLS, the microservice, the
  end-to-end suite.

## Two layers

- **Protocol core** (`src/`, excluding `src/service/`): transport and protocol only, with no
  Rocket.Chat dependencies. Built on `ltx`/`@xmpp/jid` plus Node `net`/`tls`/`dns`. Exposes
  the `XMPPServer` class: lifecycle, imperative send methods, and a typed event map.
- **Integration service** (`src/service/`): `XMPPServerService`, a `@rocket.chat/core-services`
  `ServiceClass` that bridges the protocol core to Rocket.Chat models and events. It runs only
  in the `ee/apps/xmpp-server-service` microservice, never inside Meteor.

## Testing

```sh
yarn testunit   # unit + in-process integration tests (two servers over loopback)
yarn test:e2e   # against a running Rocket.Chat, xmpp-server-service and XMPP server
```

Unit tests are colocated (`src/**/*.spec.ts`). Integration tests under `tests/integration/`
spin up two `XMPPServer` instances on loopback. The end-to-end suite under `tests/end-to-end/`
drives real XMPP users on a real server such as ejabberd; its setup is in
[docs/operations.md](docs/operations.md#running-the-end-to-end-suite).
