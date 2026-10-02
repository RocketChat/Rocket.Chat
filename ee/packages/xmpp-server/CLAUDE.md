# @rocket.chat/xmpp-server

Native XMPP server-to-server federation. Spec-first: read [docs/README.md](docs/README.md)
before changing behaviour.

## Commands

```sh
yarn testunit                       # jest: src/**/*.spec.ts and tests/integration
yarn typecheck && yarn lint         # from this folder; never run the Meteor typecheck for this package
yarn test:e2e                       # needs a running Rocket.Chat, xmpp-server-service and ejabberd; see docs/operations.md
node --import tsx --test --test-name-pattern='<name>' tests/end-to-end/<file>.spec.ts
yarn workspace @rocket.chat/xmpp-server-service ms   # the only process that hosts the service
```

## Conventions

- `src/` minus `src/service/` is the protocol core. It imports nothing from `@rocket.chat/*`
  except `emitter`. `src/service/` is the only place that knows Rocket.Chat.
- Every capability has a spec in `docs/specs/`. A behaviour change edits the spec in the same
  PR. A new bug becomes a `D<n>` entry plus an `it.skip` end-to-end test whose comment links
  the anchor. A fix un-skips the test and deletes the entry.
- Work on a `planned` spec starts in plan mode with the spec attached and produces
  `docs/plans/<slug>.md` before any code.
- The `/xmpp-intent`, `/xmpp-spec` and `/xmpp-plan` skills run the authoring stages; worked
  prompts and the model to use for each stage are in `docs/examples.md`.
- Decisions that constrain later work go to `docs/adr/`. Check the existing ones before
  proposing a change to the data model, the auth flow or the room model.
- `docs/compliance.md` is derived from spec frontmatter. Never edit it without the spec.
- Comments follow the repo's `docs/code-comments.md`: intent, not mechanism; reasoning goes
  to the spec or an ADR.
- Tests name the requirement they prove (`R3`) or the defect they pin (`D1`).

## Architecture

Two layers in one package: the protocol core (streams, dialback, routing, MUC state machines,
events) and the integration service (`XMPPServerService`, a `ServiceClass` that maps events to
Rocket.Chat models). Meteor only holds the outgoing hooks and the settings. Map:
[docs/architecture.md](docs/architecture.md). Supported standards:
[docs/compliance.md](docs/compliance.md).

## Things Claude gets wrong

- The XML library is `ltx` plus `@xmpp/jid`, not `@xmpp/xml`.
- There is no `src/handlers/message.ts` or `src/service/events/`. Parsing is `src/handlers/parse.ts`;
  inbound handlers are methods of `XMPPServerService`.
- The spoof check is in `InboundSession`, not in `StanzaRouter`.
- Rooms and users carry `xmppFederation`; never set `federation` or `federated: true` on a
  room. See ADR 0006.
- Remote-MUC sessions are per local member and do not survive a restart; a member without
  a session cannot speak.
- A remote-room author is the record of the real JID the room disclosed (`fromJid` on
  `muc.remoteMessage`); `<nick>#<room JID>` is only the fallback when it disclosed none.
  Rocket.Chat has no per-room nick, so the user's `name` is the latest nick. See ADR 0015.
- A known defect is not fixed until its `it.skip` is a plain `it` and passes, against ejabberd
  for an end-to-end test.
- `yarn typecheck` in `apps/meteor` fails for unrelated reasons; typecheck this package only.
