# Native XMPP Server — Code Architecture

Companion to [xmpp-server.md](xmpp-server.md) (feature behavior and configuration). This document describes how the code is organized and how the pieces interact.

## High-level shape

Everything lives in one workspace package, `ee/packages/xmpp-server` (`@rocket.chat/xmpp-server`), structured in two strictly separated layers. The package runs only in the `ee/apps/xmpp-server-service` microservice. `apps/meteor` holds just the outgoing hooks and the setting definitions:

```
┌─────────────────────────────────────────────────────────────┐
│ apps/meteor                                                 │
│   ee/server/hooks/xmpp/index.ts     (outgoing callbacks)    │
│   server/settings/federation-service.ts (XMPP_Server_*)     │
└──────────────┬──────────────────────────────────────────────┘
               │ service proxy + broker events (network broker)
┌──────────────▼──────────────────────────────────────────────┐
│ ee/apps/xmpp-server-service  (process entrypoint)           │
│ ee/packages/xmpp-server                                     │
│  src/service/   Integration layer (ServiceClass)            │
│    - knows Rocket.Chat: models, core-services, core-typings │
│    - subscribes to core events, calls core API              │
│  ────────────────────────────────────────────────────────   │
│  src/ (rest)    Protocol core                               │
│    - knows only XMPP: no Rocket.Chat imports at all         │
│    - deps: @xmpp/xml, @xmpp/jid, @rocket.chat/emitter, pino │
│    - talks to the world over net/tls sockets                │
└─────────────────────────────────────────────────────────────┘
```

The protocol core is deliberately Rocket.Chat-agnostic: every public method returns a promise and every event payload is JSON-serializable (the `raw: Element` fields serialize via `toString()`).

## Protocol core (`src/`)

### Public surface (`src/index.ts`)

Exports only the deliberate API — no barrel re-exports:

- `XMPPServer` (class) — lifecycle (`start`/`stop`), imperative send API, typed events.
- Types: `XMPPServerConfig`, `TlsConfig`, `MucDelegates`, `XMPPServerEventMap` and event payload types.
- `escapeLocalpart`/`unescapeLocalpart` (XEP-0106) and `normalizeDomain` — needed by the integration layer for username↔JID mapping.

Events use `@rocket.chat/emitter` (`on()` returns an unsubscribe function). The event map covers: transport (`server.started/stopped`, `connection.established/lost/failed`, `error`), 1:1 (`message.received`, `message.error`, `presence.received`, `presence.subscriptionRequest/subscribed/unsubscribed/probe`), hosted MUC (`muc.occupantJoined/Left`, `muc.messageReceived`, `muc.subjectChanged`, `muc.inviteReceived`), and remote MUC (`muc.remoteJoined/JoinFailed/OccupantJoined/OccupantLeft/Message/SessionLost`).

The only request/response hook is the `authorizeMucJoin` config delegate (join authorization cannot be expressed over a fire-and-forget emitter).

### Module map

| Path | Responsibility |
| --- | --- |
| `src/XMPPServer.ts` | Facade: config validation, owns `S2SManager`/`MucService`/emitter, delegates everything |
| `src/config.ts` | `XMPPServerConfig` (domain, port, TLS, MUC subdomain, allow/deny lists, limits, delegates) |
| `src/events.ts` | The typed event map |
| `src/jid/normalize.ts` | Domain normalization (`domainToASCII` + lowercase) — applied at **every trust comparison** |
| `src/jid/escaping.ts` | XEP-0106 localpart escaping (wraps `@xmpp/jid`) |
| `src/xml/StanzaParser.ts` | Streaming stanza framing on `@xmpp/xml` `Parser` + hardening: rejects DOCTYPE/entities/comments/PIs, 256 KiB stanza cap, depth cap, `reset()` for post-STARTTLS stream restarts |
| `src/stream/XmppStream.ts` | One socket + one parser: open/send/`upgradeToTls`/restart/close with hard timeouts |
| `src/stream/InboundSession.ts` | Receiving-server state machine: stream header → STARTTLS → SASL EXTERNAL or dialback → ready. Maintains `authenticatedFromDomains`; every inbound stanza's `from` must match (spoofing protection). Also answers `db:verify` as authoritative server |
| `src/stream/OutboundSession.ts` | Originating-server state machine (resolve → connect → STARTTLS → auth → ready) |
| `src/s2s/S2SManager.ts` | The hub: TCP listener, per-domain routes `{outbound session, bounded stanza queue, backoff}`, `sendStanza(el)` routed by `to` domain, idle reaping, XEP-0199 keepalive, IQ id→promise tracker |
| `src/s2s/dialback.ts` | XEP-0220 flows + XEP-0185 key derivation (`HMAC-SHA256(SHA256(secret), "recv orig streamId")`); `DialbackVerifier` tracks in-flight verifications with timeouts. Verification always dials the **claimed** domain via DNS — never trusts the source connection |
| `src/s2s/saslExternal.ts` | Peer-certificate-for-domain validation (dNSName SANs, XmppAddr otherName) |
| `src/s2s/dnsResolver.ts` | SRV `_xmpp-server._tcp` resolution (RFC 2782 ordering), A/AAAA:5269 fallback. Injectable (tests point it at localhost) |
| `src/s2s/backoff.ts` | Exponential backoff with jitter for reconnects |
| `src/router/StanzaRouter.ts` | Inbound dispatch: spoof check → JID validation → message/presence/iq branch, MUC-domain stanzas diverted to `MucService`/`RemoteMucSession` |
| `src/handlers/{message,presence,iq}.ts` | Stanza → event translation for 1:1 traffic |
| `src/iq/disco.ts`, `src/iq/ping.ts` | XEP-0030 on the server domain, the MUC domain **and individual room JIDs** (clients disco a room before joining and refuse it if the answer is not `conference/text`); XEP-0199; unknown iq get/set answered with `service-unavailable` (interop requirement) |
| `src/muc/MucService.ts` | Registry of hosted rooms (plus which are public); routes room-addressed stanzas; service-level disco |
| `src/muc/MucRoom.ts` | Hosted-room state machine: occupants, nick conflicts, roles, presence fan-out, status codes (110/303/307 — never 201, the room always pre-exists in Rocket.Chat), the subject that closes a join, message broadcast + reflection, outgoing invitations. Rocket.Chat members are registered as **virtual occupants** (visible to remote users, delivered via events not sockets) |
| `src/muc/RemoteMucSession.ts` | Rocket.Chat user joined into a *remote* MUC as a client over S2S (fixed resource `rocketchat`); tracks join state and remote occupant roster; surfaces disconnects as `muc.remoteSessionLost`. **One session per local member**, keyed `${localBareJid}\|${roomJid}` — a member without one cannot speak, so `mucSendToRemoteRoom` throws rather than dropping the message |
| `src/muc/stanzas.ts` | Pure builders/parsers for `muc#user`, invites (builds mediated XEP-0045 §7.8; parses mediated + direct XEP-0249), status codes |

### State ownership

The protocol core holds **only ephemeral state**, all rebuilt on `start()`: open sessions, per-domain outbound queues and backoff timers, in-flight dialback verifications and IQ ids, MUC occupant maps, remote-MUC session state. Everything durable — rosters, room membership, user↔JID mapping, message history, the dialback secret, TLS material — belongs to the integration layer.

## Integration layer (`src/service/`)

`XMPPServerService extends ServiceClass` (broker name `'xmpp-server'`), mirroring the posture of `FederationMatrix` in `ee/packages/federation-matrix`. Its interface (`IXMPPServerService` in `packages/core-services`, proxied as `XMPPServer`) exposes: `isRunning()`, `sendMessage(message, room, user)`, `registerHostedRoom(room)`, `inviteToHostedRoom(rid, inviterId, jid)`, `addHostedRoomMember(rid, userId)`, `removeHostedRoomMember(rid, userId)`, `joinRemoteMUC(userId, rid)`, `ensureXMPPUsersExistLocally(jids)`.

- The service configures itself (see [Settings and lifecycle wiring](#settings-and-lifecycle-wiring)). Each reconfiguration diffs the settings against the running config: listener-affecting changes (domain/port/TLS) stop and restart the core; soft changes (allowlist, presence flag) are hot-applied. Core event handlers are attached when the core starts, not in `created()`, so a stopped service is fully inert.
- Because MUC state in the core is ephemeral, every start rebuilds it from the database (`restoreMucState`, non-fatal by design — a failure degrades group chat but must not take the listener down): each `host-muc` room is re-registered with its local members re-seated as virtual occupants, and each `remote-muc` room is rejoined once per local member. Skipping the latter is why a mirrored room goes silent after a restart.
- Join authorization is the one request/response path into Rocket.Chat: the `authorizeMucJoin` delegate allows any federated domain into a public channel (`t === 'c'`) but requires an existing subscription for a private group, which is what makes invitations meaningful.
- Inbound handlers live in `src/service/events/{message,presence,muc}.ts` (mirroring `federation-matrix/src/events/`).
- `src/service/helpers/createOrUpdateXMPPUser.ts` upserts remote users (see data model below).

## Data model and Matrix coexistence

The native XMPP path must not interfere with Matrix federation or the existing XMPP-via-Matrix bridge. This is guaranteed structurally, not by runtime checks:

- **Rooms** carry a new field `xmppFederation: { version, role: 'dm'|'host-muc'|'remote-muc', muc?, with?, origin }` and **never** set `federated: true` or `room.federation`. `FederationActions.shouldPerformFederationAction` (which throws for `federated: true` rooms that are not Matrix-native) therefore never sees them, and every Matrix hook bails on the first check.
- **Remote users** store the full bare JID as username (`alice@remote.tld`), set `federated: true` (so the client's remote-user treatment applies) plus `xmppFederation: { version, jid, origin }`, and **never** set `user.federation` — keeping `isUserNativeFederated` false and all Matrix branches closed. Matrix's informal remote-user heuristics (`startsWith('@')`, `includes(':')`) never match a bare JID; conversely local username validation (no `@` allowed) prevents JID squatting.
- **Message dedupe / loop-breaking** reuses the federation stamp: inbound XMPP messages are saved via `Message.saveMessageFromFederation` with `federation.eventId = 'xmpp:<origin-domain>:<stanza-id>'`; the outgoing `afterSaveMessage` hook skips any message already carrying `federation.eventId`.

## Message flow, end to end

**Outgoing** (`apps/meteor/ee/server/hooks/xmpp/index.ts`):

```
user sends message → afterSaveMessage callback
  → bail unless isRoomXMPPFederated(room)
  → bail if message.federation.eventId (came from the wire) / system message / remote author
  → XMPPServer.sendMessage(message, room, user)      [service proxy]
      role 'dm'         → core.sendChatMessage(from local JID, to room.xmppFederation.with)
      role 'host-muc'   → core.mucBroadcastMessage(fromNick = username)
      role 'remote-muc' → core.mucSendToRemoteRoom(as the user's occupant)
  → S2SManager.sendStanza → existing session, or queue + connect (SRV → TCP → STARTTLS → dialback)
```

**Membership** (same hook file), for rooms with role `host-muc`:

```
room created           → afterCreateRoom → registerHostedRoom
                       → each initial member: local → mucAddLocalOccupant
                                              JID   → mucInvite (mediated invite from the room)
member added later     → beforeAddUsersToRoom: bare JIDs are materialized as local users first
                                               (and rejected outright for non-XMPP rooms)
                       → afterAddedToRoom: same local/remote split as above
member leaves/removed  → local → occupant presence 'unavailable'
                       → JID   → kicked from the room (status 307)
remote occupant joins  → muc.occupantJoined → upsert user + subscription (so they appear as a member)
remote occupant leaves → muc.occupantLeft ('left' only) → performUserRemoval, which runs no
                         callbacks and therefore cannot bounce back as a kick
```

And for `remote-muc` (mirrored) rooms, where membership is a client session rather than a roster entry:

```
member added/joins     → afterAddedToRoom → joinRemoteMUC (its own session, nick = username)
member leaves/removed  → leaveRemoteMUC
message sent           → sendMessage joins first if the session is missing (restart, or never joined)
inbound groupchat      → deduped on the room-assigned XEP-0359 id, since one copy arrives per
                         member session, and reflections of our own messages are recognized by
                         the Rocket.Chat message id we sent them with
```

**Incoming**:

```
remote server connects (or reuses session) → InboundSession authenticates domain
  → StanzaRouter dispatch → handler → typed event
  → service event handler:
      1:1 message  → allowlist → resolve local target → upsert remote user
                   → find/create DM room (stamped xmppFederation role 'dm')
                   → dedupe on federation.eventId → Message.saveMessageFromFederation
      MUC message  → resolve room by xmppFederation.muc → skip local echoes → same save path
      occupants    → upsert user, create/remove subscription, system messages
      MUC invite   → upsert inviter, create shadow room (role 'remote-muc')
                   → subscription status INVITED; on accept → core.mucJoinRemoteRoom
      presence     → map show/type → Users.updateOne + api.broadcast('presence.status')
```

**Presence outgoing**: the service listens to the broker event `presence.status` (`this.onEvent`, same as FederationMatrix) and fans the mapped presence out to the remote bare JIDs of the user's XMPP DM rooms.

## Settings and lifecycle wiring

- Settings are registered as a new `XMPP_Server` section of the `Federation` group in `apps/meteor/server/settings/federation-service.ts` (all `enterprise: true, modules: ['federation']`).
- The service owns its configuration. In `started()` it reads the `XMPP_Server_*` settings through the `Settings` service proxy (Meteor's settings cache) and the license through the `License` proxy (`readXMPPServerConfiguration` in `src/service/configuration.ts`), then gates `enabled` on `License.hasModule('federation') && XMPP_Server_Enabled`. After that it reconfigures on every `watch.settings` event for an `XMPP_Server_*` key and on every `license.module` event for `federation`. Reconfigurations are queued one at a time: saving several settings at once fires one event per key, and two overlapping starts would compete for the port.
- Unlike the Matrix service, stopping is real: the package holds a TCP listener that must be released when the feature is disabled, and when the broker stops the service (`stopped()`).

### The microservice

`ee/apps/xmpp-server-service` is the only host of `XMPPServerService`. Meteor does not register it in either deployment mode. Without the microservice, Meteor's `XMPPServer.*` calls from the hooks resolve to nothing, so the feature is simply inactive.

```sh
# Meteor started with TRANSPORTER=TCP (or a NATS URL), then:
yarn workspace @rocket.chat/xmpp-server-service ms
```

The process starts only after Meteor's `settings` and `license` services are reachable, as every networked service does. The S2S listener binds `XMPP_Server_Port` (default 5269) in this process. The health check listens on `PORT` (default 3039), and moleculer metrics use the broker's usual port (9458). The generic `ee/apps/Dockerfile` builds it with `SERVICE=xmpp-server-service`. Each service process opens its own listener, so run a single instance of this service per domain.

`GET /stats` on the health port returns a JSON snapshot:
- `decoded`: running totals of every inbound event the protocol core has decoded, keyed by event name.
- `inflight`, `completed` and `failed`: the Rocket.Chat-side handling of those events. A handler counts as in flight from the moment its event is decoded until its database writes and broker calls settle.
- `decodeOnly`: whether the service runs with `XMPP_DECODE_ONLY=true`.
- `durations`: raw handler-latency histogram buckets.
- `eventLoopLagP99Ms`: the worst event-loop delay since the previous read.
- `rssBytes`.

`GET /metrics` exposes the same data in Prometheus format, plus the Node defaults.

Inbound handling has no queue and no concurrency limit: handlers are started as stanzas arrive and never throttle the socket. An overloaded service therefore accepts everything and falls behind silently. What grows is `inflight`, not refused traffic.

With `XMPP_DECODE_ONLY=true`, stanzas are still parsed, routed and answered at the protocol level, but no inbound event reaches Rocket.Chat, hosted-MUC joins skip the database authorization check, and remote-MUC joins request no discussion history (`<history maxstanzas="0"/>`). In normal mode that history is how the server catches up on messages sent while it was offline. In decode-only mode it would only replay the same backlog on every restart. Use it to load-test decoding alone.

`XMPP_DNS_OVERRIDES=domain=host:port,…` answers S2S lookups for the listed domains without DNS; every other domain still resolves normally. It exists so load-test peers on local ports can pass dialback.

`LOG_LEVEL` (`warn`, `info` or `debug`) sets the process's log level. Without it, loggers stay at `warn`, because the `Log_Level` admin setting only takes effect inside Meteor's own process. At `debug`, every inbound event is logged as `XMPP event` with its payload, including the XML of the stanza that produced it. Payloads are only serialized when debug is enabled, so leave it off during throughput runs.

## Client touch points

Deliberately minimal:

- `CreateChannelModal.tsx`: an `xmppFederated` toggle, gated like the Matrix one (`XMPP_Server_Enabled` setting + `federation` license module + `access-federation` permission), mutually exclusive with the Matrix toggle; flows as `extraData.xmppFederated` (added to `ChannelsCreateProps`/`GroupsCreateProps` rest-typings) and is converted server-side by a `beforeCreateRoomCallback` into the `xmppFederation` room field — `beforeCreateRoom` rather than `prepareCreateRoom` because only the former sees the final room name, which becomes the MUC localpart.
- `UserAutoCompleteMultiple.tsx`: fabricates a selectable chip for bare-JID input (parallel to the existing `@user:server` Matrix regex), enabled via the `xmpp` prop by the DM dialog, the create-channel members field and the Add-users panel of a hosted room.
- `channels.invite`/`groups.invite` pass raw usernames through for hosted MUCs (as they already did for Matrix rooms), since the invited JID has no local user record yet.
- Everything else renders as ordinary rooms/users — no dedicated views.

## Testing layout

- **Unit** (jest, `@rocket.chat/jest-presets/server`, colocated `*.spec.ts`): dialback key vectors (XEP-0185), JID escaping round-trips, `StanzaParser` hardening cases, `MucRoom` state machine with a stubbed sender, mapping helpers, hook bail conditions.
- **Package integration** (`tests/integration/`): two in-memory `XMPPServer` instances on ephemeral ports with an injected DNS resolver and self-signed certs — full dialback dance, queue flush, spoof rejection, MUC join/broadcast/kick; a scripted `FakeXmppPeer` for negative paths.
- **End-to-end** (`tests/end-to-end/`): real XMPP users on a real XMPP server talking to a running Rocket.Chat; see below.

### End-to-end tests

The suite checks that Rocket.Chat reacts correctly to traffic from a real XMPP server. It runs locally against servers you already have running and sets none of them up; it is not part of CI.

```
                ┌─ @xmpp/client (C2S) ──▶ XMPP server (ejabberd) ──S2S──┐
node --test ────┤                                                        ▼
                └─ REST ──────────────▶ Rocket.Chat ──broker──▶ xmpp-server-service
```

- **Runner**: the built-in `node:test` runner, which loads the TypeScript specs through `tsx`, the loader the Meteor API suite uses. `tsx` lets the specs import the shared test helpers: the REST helpers and test admin from `apps/meteor/tests/data`, `retry` from the API suite, and the `DDPListener` from the Matrix federation suite.
- **XMPP side**: `helper/xmpp-client.ts`. Each suite registers fresh accounts in-band (XEP-0077) and removes them when it finishes. Every inbound stanza is recorded, so a wait never misses one that arrived before it started.
- **Rocket.Chat side**: `helper/rocketchat.ts`, a set of thin wrappers over the shared helpers, logged in as the repo's test admin. Test users keep an unverified email, because email 2FA would otherwise block their login. Presence tests also give the user a live DDP session, since a user with no session never shows a status.
- **Preflight**: every suite first checks the Rocket.Chat XMPP settings and the service's `/stats` (a decode-only service never forwards to Rocket.Chat). It then sends an S2S ping from an XMPP user to Rocket.Chat's domain, which proves federation in both directions. If a check fails, the suite stops and says what to fix.
- **Coverage**: connectivity (ping, disco, allow list), direct messages, presence and subscriptions, rooms hosted by Rocket.Chat, and rooms hosted by the XMPP server. Each MUC spec has a "several Rocket.Chat members" block for duplicated messages. Cases that fail today are `it.skip` and link to [Known bugs](xmpp-server.md#known-bugs).

What the servers need:

- **ejabberd**:
  - `mod_register` allows registration, and `registration_timeout: infinity` is set; without it, ejabberd accepts one registration per IP every ten minutes.
  - `mod_muc` and `mod_mam` are on, so rooms can archive. Archiving rooms stamp XEP-0359 stanza ids, which some of the duplicate cases depend on.
  - `s2s_use_starttls: optional` is set when Rocket.Chat has no TLS certificate.
- **Rocket.Chat**:
  - The repo's test admin exists, as it does under `TEST_MODE` (`apps/meteor/tests/data/user.ts`).
  - The XMPP server is enabled, and its allow list is empty or includes the XMPP server's domain.
- **xmpp-server-service**: runs without `XMPP_DECODE_ONLY`.
- **Name resolution**: each server resolves the other's domain and MUC subdomain, through DNS, `/etc/hosts` or `XMPP_DNS_OVERRIDES` on the service.
- **Node**: trusts the XMPP server's certificate, for example with `NODE_EXTRA_CA_CERTS` pointing at a local mkcert root.

```sh
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" XMPP_E2E_XMPP_DOMAIN=xmpp.host \
yarn workspace @rocket.chat/xmpp-server test:e2e
```

To run one file, or a single case by name, call the runner directly from `ee/packages/xmpp-server`:

```sh
node --import tsx --test --test-name-pattern='stores a message from the room once' tests/end-to-end/remote-muc.spec.ts
```

| Variable | Default |
|---|---|
| `XMPP_E2E_XMPP_DOMAIN` | required: the XMPP server's domain |
| `XMPP_E2E_XMPP_SERVICE` | `xmpp://localhost:5222` |
| `XMPP_E2E_XMPP_MUC_DOMAIN` | `conference.<domain>` |
| `TEST_API_URL` | `http://localhost:3000`. The same variable as every other e2e suite. |
| `XMPP_E2E_RC_DDP_URL` | `TEST_API_URL`. With microservices, point it at the DDP streamer (for example `http://localhost:4000`): it owns websocket sessions, and presence depends on them. |
| `XMPP_E2E_SERVICE_URL` | `http://localhost:3039`. When it does not answer, the `/stats` checks are skipped. |

### Load testing

`ee/apps/xmpp-server-service/loadtest/` is a load generator. It answers two questions:
- **`--mode ramp`** (the default): up to which constant rate does the service keep up?
- **`--mode max`**: how many events per second can it process at most?

Shared setup:
- Each fake remote domain `lt<i>.test` is a real `XMPPServer` on port `15269+i`. Each opens its own inbound S2S socket to the service.
- Scenarios:
  - `dm`: 1:1 messages
  - `presence`: online/away flips
  - `muc`: groupchat into a hosted room, whose reflections also give an XMPP-side echo latency
  - `mix`: weighted combinations of the three
- A warm-up runs before measuring, so first-contact costs (creating remote users, DM rooms and room joins) are excluded unless `--cold` is passed.

```sh
yarn workspace @rocket.chat/xmpp-server build
# the service must know how to dial back to the peers
XMPP_DNS_OVERRIDES=$(yarn workspace @rocket.chat/xmpp-server-service loadtest overrides --domains 4) \
  yarn workspace @rocket.chat/xmpp-server-service ms2
RC_USER=admin RC_PASSWORD=… yarn workspace @rocket.chat/xmpp-server-service loadtest run --scenario dm --mode max
```

The generator creates `lt-local-<n>` users and, for `muc`, a hosted channel `lt-muc` through the REST API. `--configure <domain>` also enables the XMPP server settings. The peers connect to the service on `XMPP_Server_Port` unless `--rc-port` says otherwise. They always offer STARTTLS, because a service with a certificate configured refuses dialback over cleartext.

#### Ramp mode

The generator sends at a fixed arrival rate that never waits on the service, so a slow service shows up as backlog instead of lowering the load. It raises the rate step by step and waits for the backlog to drain after each step. A step does **not** count as kept up when any of these hold:
- the service processed less than 95% of what was sent;
- the backlog (sent minus processed) kept growing;
- handler p99 went above 1 s;
- the service's event-loop p99 went above 100 ms;
- the backlog did not drain;
- any handler failed, any send failed, or `/stats` timed out.

The run reports the last step that kept up. Steps where the generator itself missed the target rate or lagged are flagged as generator-bound, and steps cut short by Ctrl-C are flagged as interrupted. Neither kind ever counts as the ceiling.

#### Max mode

The generator keeps the service saturated without flooding it. It holds a queue of about `--queue-seconds` (default 0.5 s) of the service's recent throughput ahead of what the service has processed, and re-sizes that queue as throughput changes.

The rate the service processes at, measured after a settle period, is its maximum throughput. Handler latency in this mode is mostly time spent in that queue, so read it as queueing delay, not service time.

The result is flagged as not trustworthy when:
- handlers or sends failed;
- the backlog did not drain;
- fewer than 5 s were measured;
- the generator could not keep the queue at least half full. The service was then sometimes idle, so the figure is only a floor.

#### Checking the results

Every run ends with an accounting of events. Every send must be decoded exactly once and handled exactly once. For `dm` and `muc` the run also counts the messages in Mongo by `federation.eventId`, which catches lost and duplicated messages.

All of it goes into `loadtest-<runId>.json`. Ctrl-C ends the current measurement early and still drains, checks and writes the report; a second Ctrl-C exits at once.

The generator was calibrated against a fake service whose capacity was known from its own job timings:
- ramp mode passed at 400/s and failed at 500/s, against a capacity of 449/s;
- max mode measured 454/s, against a capacity of 456/s;
- injected handler failures were reported;
- a service faster than the generator (about 130k events/s on one core) was flagged as generator-bound.

Run each scenario twice:
1. With `XMPP_DECODE_ONLY=true` on the service. `/stats` reports the mode and the generator adapts. This gives the parsing and routing ceiling.
2. Normally.

A large gap between the two puts the bottleneck on the Rocket.Chat side. Suspects are the Mongo pool and the `Room`/`Message` broker calls, which run inside Meteor, so watch Meteor's CPU as well.
