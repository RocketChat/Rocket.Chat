# Native XMPP Server — Code Architecture

Companion to [xmpp-server.md](xmpp-server.md) (feature behavior and configuration). This document describes how the code is organized and how the pieces interact.

## High-level shape

Everything lives in one workspace package, `ee/packages/xmpp-server` (`@rocket.chat/xmpp-server`), structured in two strictly separated layers, plus thin wiring inside `apps/meteor`:

```
┌─────────────────────────────────────────────────────────────┐
│ apps/meteor                                                 │
│   ee/server/startup/xmppServer.ts   (lifecycle, settings)   │
│   ee/server/hooks/xmpp/index.ts     (outgoing callbacks)    │
│   server/settings/federation-service.ts (XMPP_Server_*)     │
└──────────────┬──────────────────────────────────────────────┘
               │ service proxy (@rocket.chat/core-services)
┌──────────────▼──────────────────────────────────────────────┐
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

The protocol core is deliberately Rocket.Chat-agnostic so it can later be hosted in a standalone process (`ee/apps/`-style microservice) without changes: every public method returns a promise and every event payload is JSON-serializable (the `raw: Element` fields serialize via `toString()`).

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
| `src/iq/disco.ts`, `src/iq/ping.ts` | XEP-0030 on server + MUC domains; XEP-0199; unknown iq get/set answered with `service-unavailable` (interop requirement) |
| `src/muc/MucService.ts` | Registry of hosted rooms; routes room-addressed stanzas; service-level disco |
| `src/muc/MucRoom.ts` | Hosted-room state machine: occupants, nick conflicts, roles, presence fan-out, status codes (110/201/303/307), message broadcast + reflection. Rocket.Chat members are registered as **virtual occupants** (visible to remote users, delivered via events not sockets) |
| `src/muc/RemoteMucSession.ts` | Rocket.Chat user joined into a *remote* MUC as a client over S2S (fixed resource `rocketchat`); tracks join state and remote occupant roster; surfaces disconnects as `muc.remoteSessionLost` |
| `src/muc/stanzas.ts` | Pure builders/parsers for `muc#user`, invites (mediated XEP-0045 §7.8 + direct XEP-0249), status codes |

### State ownership

The protocol core holds **only ephemeral state**, all rebuilt on `start()`: open sessions, per-domain outbound queues and backoff timers, in-flight dialback verifications and IQ ids, MUC occupant maps, remote-MUC session state. Everything durable — rosters, room membership, user↔JID mapping, message history, the dialback secret, TLS material — belongs to the integration layer.

## Integration layer (`src/service/`)

`XMPPServerService extends ServiceClass` (broker name `'xmpp-server'`), mirroring the posture of `FederationMatrix` in `ee/packages/federation-matrix`. Its interface (`IXMPPServerService` in `packages/core-services`, proxied as `XMPPServer`) exposes: `configure(config)`, `stop()`, `isRunning()`, `sendMessage(message, room, user)`, `registerHostedRoom(room)`, `joinRemoteMUC(userId, rid)`, `ensureXMPPUsersExistLocally(jids)`.

- `configure()` diffs the incoming settings against the running config: listener-affecting changes (domain/port/TLS) stop and restart the core; soft changes (allowlist, presence flag) are hot-applied. Core event handlers are attached in `configure()`, not `created()`, so a stopped service is fully inert. It also re-registers every hosted MUC room with the core so hosted rooms survive restarts.
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
- `apps/meteor/ee/server/startup/xmppServer.ts` registers the service, watches all `XMPP_Server_*` keys (`settings.watchMultiple`) and gates on `License.hasModule('federation') && XMPP_Server_Enabled`, calling `XMPPServer.configure(...)` or `XMPPServer.stop()`. `License.onToggledFeature('federation', { up, down })` covers license flips. Invoked from `startRocketChat.ts` in `loadAfterLicense`.
- Unlike the Matrix service, `stop()` is real: the package holds a TCP listener that must be released when the feature is disabled.

## Client touch points

Deliberately minimal:

- `CreateChannelModal.tsx`: an `xmppFederated` toggle, gated like the Matrix one (`XMPP_Server_Enabled` setting + `federation` license module + `access-federation` permission), mutually exclusive with the Matrix toggle; flows as `extraData.xmppFederated` (added to `ChannelsCreateProps`/`GroupsCreateProps` rest-typings) and is converted server-side by a `prepareCreateRoomCallback` into the `xmppFederation` room field.
- `UserAutoCompleteMultiple.tsx`: fabricates a selectable chip for bare-JID input (parallel to the existing `@user:server` Matrix regex) so DMs can be started by typing a JID.
- Everything else renders as ordinary rooms/users — no dedicated views.

## Testing layout

- **Unit** (jest, `@rocket.chat/jest-presets/server`, colocated `*.spec.ts`): dialback key vectors (XEP-0185), JID escaping round-trips, `StanzaParser` hardening cases, `MucRoom` state machine with a stubbed sender, mapping helpers, hook bail conditions.
- **Package integration** (`tests/integration/`): two in-memory `XMPPServer` instances on ephemeral ports with an injected DNS resolver and self-signed certs — full dialback dance, queue flush, spoof rejection, MUC join/broadcast/kick; a scripted `FakeXmppPeer` for negative paths.
- **E2E** (`tests/end-to-end/`, mirroring `federation-matrix/tests/`): a Prosody container as the remote peer plus a scripted `@xmpp/client`, covering DMs, presence and both MUC directions against a running Rocket.Chat.
