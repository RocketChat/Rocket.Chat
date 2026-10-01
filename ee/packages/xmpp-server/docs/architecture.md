# Code architecture

How the code is organized and how the pieces interact. Behaviour is specified per capability
in [specs/](specs/); the decisions behind this shape are in [adr/](adr/).

## High-level shape

One workspace package, `ee/packages/xmpp-server` (`@rocket.chat/xmpp-server`), in two strictly
separated layers. The package runs only in the `ee/apps/xmpp-server-service` microservice.
`apps/meteor` holds just the outgoing hooks and the setting definitions:

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
│    - deps: ltx, @xmpp/jid, @rocket.chat/emitter, pino       │
│    - talks to the world over net/tls sockets                │
└─────────────────────────────────────────────────────────────┘
```

The protocol core is Rocket.Chat-agnostic ([ADR 0001](adr/0001-protocol-core-has-no-rocketchat-dependency.md)):
every public method returns a promise and every event payload is JSON-serializable (the
`raw: Element` fields serialize via `toString()`).

## Protocol core (`src/`)

### Public surface (`src/index.ts`)

Exports only the deliberate API:

- `XMPPServer` (class): lifecycle (`start`/`stop`), imperative send API, typed events.
- `XMPPServerService` for the microservice entrypoint.
- Types: `XMPPServerConfig`, `TlsConfig`, `MucDelegates`, `XMPPServerEventMap` and event payloads.
- `escapeLocalpart`/`unescapeLocalpart` (XEP-0106) and `normalizeDomain`, needed by the
  Meteor hooks for the username to JID mapping.

Events use `@rocket.chat/emitter` (`on()` returns an unsubscribe function). The map in
`src/events.ts` covers transport (`server.*`, `connection.*`, `error`), 1:1 traffic
(`message.received`, `message.error`, `presence.*`), hosted MUC (`muc.occupantJoined/Left`,
`muc.messageReceived`, `muc.subjectChanged`, `muc.inviteReceived`) and remote MUC
(`muc.remote*`). Not every declared event is emitted today; each spec lists the ones its
capability relies on.

The only request/response hook is the `authorizeMucJoin` config delegate: join authorization
cannot be expressed over a fire-and-forget emitter.

### Module map

| Path | Responsibility |
| --- | --- |
| `src/XMPPServer.ts` | Facade. Resolves config, owns `S2SManager`, `StanzaRouter`, `MucService`, the emitter and the remote-MUC session map (keyed `localBareJid\|roomJid`). Inbound stanzas are tried against remote-MUC sessions, then invites, then the router |
| `src/config.ts` | `XMPPServerConfig`, `MucDelegates`, and `resolveConfig()` with the defaults (port 5269, TLS required, random dialback secret, `conference` subdomain, 256 KiB stanza cap, 15 s connect timeout, 10 min idle timeout, queue of 256) |
| `src/events.ts` | The typed event map |
| `src/errors.ts` | `XmppError` subclasses: invalid JID, domain not allowed, queue overflow, connection failed, not joined to remote room, server not running |
| `src/jid/normalize.ts` | `normalizeDomain` (IDNA to ASCII plus lowercase) applied at every trust comparison, and `isDomainAllowed` (deny list wins) |
| `src/jid/escaping.ts` | XEP-0106 localpart escaping with the 1023-byte limit |
| `src/xml/StanzaParser.ts` | Streaming framing on ltx's SAX parser. Rejects DOCTYPE, entities, comments, CDATA and processing instructions (RFC 6120 §11.1), caps size and depth, `reset()` for the restart after STARTTLS |
| `src/xml/build.ts`, `errors.ts`, `resolve.ts`, `namespaces.ts`, `correction.ts` | Element builder, `buildStanzaError()` (RFC 6120 §8.3), namespace resolution from the stream header, namespace constants, XEP-0308 `<replace/>` build and parse |
| `src/stream/XmppStream.ts` | One socket plus one parser: open, send, `upgradeToTls`, restart, close, with hard timeouts |
| `src/stream/InboundSession.ts` | Receiving-server state machine: header, STARTTLS, SASL EXTERNAL or dialback, ready. Owns `authenticatedFromDomains`; every content stanza's `from` domain must be in it (spoofing protection) and its `to` domain must be ours. Answers `db:verify` as authoritative server. Applies the allow and deny lists |
| `src/stream/OutboundSession.ts` | Originating-server state machine (resolve, connect, STARTTLS, SASL EXTERNAL or dialback, ready), plus a one-shot `verifyDialback` mode |
| `src/s2s/S2SManager.ts` | The hub. TCP listener, per-domain routes `{outbound session, bounded queue, backoff}`, `sendStanza(el)` routed by `to` domain, idle route reaping, and dialback verification by dialling the claimed domain |
| `src/s2s/dialback.ts` | XEP-0185 key derivation (`HMAC-SHA256(SHA256(secret), "recv orig streamId")`), constant-time verification, stream ids |
| `src/s2s/saslExternal.ts` | Peer certificate for domain: `socket.authorized` plus a dNSName match through Node's `checkServerIdentity`. XmppAddr and SRVName otherName entries are not evaluated ([ADR 0005](adr/0005-peer-certificates-are-matched-on-dnsname-only.md)) |
| `src/s2s/dnsResolver.ts` | `_xmpp-server._tcp` SRV with RFC 2782 ordering, A/AAAA on 5269 fallback, the `.` target convention. Injectable |
| `src/s2s/backoff.ts` | Exponential backoff with full jitter, 1 s to 5 min |
| `src/router/StanzaRouter.ts` | Dispatch of authenticated stanzas: MUC-addressed traffic to `MucService`, `message` and `presence` to typed events, IQ ping and disco to auto-replies, any other IQ get or set to `service-unavailable` |
| `src/handlers/parse.ts` | Pure parsers: chat message (body, thread, XEP-0308 replace id), availability presence, subscription type |
| `src/iq/disco.ts`, `src/iq/ping.ts` | XEP-0030 on the server domain, the MUC domain and individual room JIDs (clients disco a room before joining and refuse it unless it is `conference/text`); XEP-0199 |
| `src/muc/MucService.ts` | Registry of hosted rooms plus which are public; routes room-addressed stanzas; detects invites addressed to local users |
| `src/muc/MucRoom.ts` | Hosted-room state machine: occupants keyed by nick, nick conflicts, join authorization, presence fan-out with status 110 and 307 (never 201, the room always pre-exists in Rocket.Chat), the subject that closes a join, groupchat reflection, mediated invitations. Rocket.Chat members are **virtual occupants**: in the roster, delivered via events rather than sockets |
| `src/muc/RemoteMucSession.ts` | A local user joined into a remote MUC as a client over S2S, fixed resource `rocketchat`. Tracks join state and the remote roster, with the real JIDs the room discloses; prefers the XEP-0359 stanza id for dedup; skips its own reflections. One session per local member ([ADR 0009](adr/0009-one-remote-muc-session-per-local-member.md)); a member without one cannot speak, so `mucSendToRemoteRoom` throws instead of dropping |
| `src/muc/stanzas.ts` | Pure builders and parsers for `muc#user` presence, groupchat (with replace), subject, join presence, mediated invites (XEP-0045 §7.8.2) and invite parsing (mediated and XEP-0249 direct) |
| `src/types/ltx.d.ts` | Types for the CommonJS parts of `ltx` and `@xmpp/jid` the package uses |

### State ownership

The protocol core holds **only ephemeral state**, rebuilt on `start()`: open sessions,
per-domain queues and backoff timers, in-flight dialback verifications, MUC occupant maps,
remote-MUC sessions. Everything durable (room membership, the user to JID mapping, message
history, TLS material) belongs to the integration layer
([ADR 0012](adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)). The dialback
secret is generated at every start; nothing persists it.

## Integration layer (`src/service/`)

`XMPPServerService extends ServiceClass` (broker name `'xmpp-server'`), mirroring the posture of
`FederationMatrix`. Its interface, `IXMPPServerService` in `packages/core-services`, is proxied
as `XMPPServer` and exposes `isRunning`, `sendMessage`, `registerHostedRoom`,
`inviteToHostedRoom`, `addHostedRoomMember`, `removeHostedRoomMember`, `joinRemoteMUC`,
`leaveRemoteMUC` and `ensureXMPPUsersExistLocally`.

- The service configures itself from the `XMPP_Server_*` settings and the license, and
  reconfigures on every change, one change at a time
  ([specs/configuration-and-lifecycle.md](specs/configuration-and-lifecycle.md)).
- Every start rebuilds MUC state from the database (`restoreMucState`): each `host-muc` room is
  re-registered with its local members as virtual occupants, each `remote-muc` room is
  rejoined once per local member. A failure there degrades group chat but never takes the
  listener down.
- Join authorization is the one request/response path into Rocket.Chat: `authorizeMucJoin`
  allows any federated domain into a public channel and requires an existing subscription for
  a private group.
- Inbound handlers are private methods of `XMPPServerService`, attached in `attachHandlers`
  when the core starts. Each runs detached from the stanza that triggered it; failures are
  logged and reported to the `observeHandler` hook, never thrown back into the stream.
- `src/service/helpers/xmppUser.ts` upserts remote users; `helpers/presence.ts` maps status
  to presence and back; `helpers/jid.ts` has `toBareJid` and `domainOfJid`;
  `helpers/messageId.ts` derives the `_id` of inbound messages; `configuration.ts` reads the
  settings.

## Data model and Matrix coexistence

The native XMPP path must not interfere with Matrix federation or the XMPP-via-Matrix bridge.
This is guaranteed structurally ([ADR 0006](adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md)):

- **Rooms** carry `xmppFederation: { version, role: 'dm'|'host-muc'|'remote-muc', muc?, with?, origin }`
  and never `federated: true` or `room.federation`. `FederationActions.shouldPerformFederationAction`
  never sees them, and every Matrix hook bails on its first check.
- **Remote users** store the bare JID as username (`alice@remote.tld`), set `federated: true`
  (so the client's remote-user treatment applies) plus `xmppFederation: { version, jid, origin }`,
  and never `user.federation`. Matrix's remote-user heuristics (`startsWith('@')`,
  `includes(':')`) never match a bare JID; local username validation (no `@`) prevents JID
  squatting. One account is one record across DMs and rooms; a remote room that hides an
  occupant's real JID gets a `<nick>#<room JID>` record of its own for them, and the display
  name follows the latest nick
  ([ADR 0015](adr/0015-remote-room-occupants-are-the-user-their-disclosed-jid-names.md)).
- **Message dedup and loop-breaking** reuse the federation stamp: inbound messages are saved via
  `Message.saveMessageFromFederation` with `federation.eventId = 'xmpp:<origin-domain>:<stanza-id>'`;
  the outgoing hook skips any message that already carries one
  ([ADR 0007](adr/0007-inbound-messages-are-deduplicated-by-federation-event-id.md)). Their
  `_id` is derived from the room, the author and the sender's id, so a later correction can
  find them by primary key
  ([ADR 0014](adr/0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)).

## Message flow, end to end

**Outgoing** (`apps/meteor/ee/server/hooks/xmpp/index.ts`):

```
user sends message → afterSaveMessage callback
  → bail unless isRoomXMPPFederated(room)
  → bail if message.federation.eventId (came from the wire) / system message / remote author
  → bail if edited by someone other than the author (XMPP accepts corrections only from the sender)
  → XMPPServer.sendMessage(message, room, user)      [service proxy]
      an edit becomes { id: random, replaceId: message._id }, otherwise { id: message._id }
      role 'dm'         → core.sendChatMessage(from local JID, to room.xmppFederation.with)
      role 'host-muc'   → core.mucBroadcastMessage(fromNick = username)
      role 'remote-muc' → joinRemoteMUC if no session, then core.mucSendToRemoteRoom
  → S2SManager.sendStanza → existing session, or queue + connect (SRV → TCP → STARTTLS → auth)
```

**Membership**, for rooms with role `host-muc`:

```
room created           → beforeCreateRoom turns the transient xmppFederated flag into xmppFederation
                       → afterCreateRoom → registerHostedRoom
                       → each initial member: local → addHostedRoomMember (virtual occupant)
                                              JID   → inviteToHostedRoom (mediated invite)
member added later     → beforeAddUsersToRoom: bare JIDs are materialized as local users first
                                               (and rejected outright for non-XMPP rooms)
                       → afterAddedToRoom: same local/remote split, skipped when the inviter is remote
member leaves/removed  → local → occupant presence 'unavailable'
                       → JID   → kicked from the room (status 307)
remote occupant joins  → muc.occupantJoined → upsert user + subscription (so they appear as a member)
remote occupant leaves → muc.occupantLeft ('left' only) → performUserRemoval, which runs no
                         callbacks and therefore cannot bounce back as a kick
```

For `remote-muc` (mirrored) rooms, where membership is a client session rather than a roster
entry:

```
invite received        → normalize room JID → upsert inviter → create shadow room
                         private group <room>_<muc domain>-<hash>, shown as <room>:<muc domain>
                         (role 'remote-muc')
                         with the invitee as member → joinRemoteMUC
member added/joins     → afterAddedToRoom → joinRemoteMUC (own session, nick = username)
member leaves/removed  → leaveRemoteMUC
message sent           → sendMessage joins first if the session is missing
inbound groupchat      → own nick skipped in the session; the service skips a message whose
                         replace id or stanza id is a stored Rocket.Chat message id (our own
                         relay coming back); then deduped on federation.eventId
```

**Incoming**:

```
remote server connects (or reuses a session) → InboundSession authenticates the domain
  → XMPPServer: remote-MUC session? invite? else StanzaRouter → typed event
  → service handler:
      1:1 message  → resolve local target → upsert remote user → find/create DM room
                     (stamped xmppFederation role 'dm') → dedupe → a correction updates the
                     message it replaces (Message.updateMessage), anything else is saved
                     under its derived _id (saveMessageFromFederation)
      MUC message  → resolve room by xmppFederation.muc → same save path
      occupants    → upsert user, create/remove subscription
      MUC invite   → see above
      presence     → map show/type → Users.updateOne + api.broadcast('presence.status')
      subscribe    → 'subscribed' + 'subscribe' when a DM is shared, else 'unsubscribed'
```

**Presence outgoing**: the service listens to the broker event `presence.status` and fans the
mapped presence out to the remote bare JIDs of the user's XMPP DM rooms.

## Client touch points

Deliberately minimal:

- `CreateChannelModal.tsx`: an `xmppFederated` toggle, gated like the Matrix one
  (`XMPP_Server_Enabled` + `federation` license module + `access-federation` permission),
  mutually exclusive with the Matrix toggle. Flows as `extraData.xmppFederated` and is
  converted server-side by a `beforeCreateRoomCallback` into the `xmppFederation` room field.
  `beforeCreateRoom` rather than `prepareCreateRoom` because only the former sees the final
  room name, which becomes the MUC localpart.
- `UserAutoCompleteMultiple.tsx`: fabricates a selectable chip for bare-JID input, enabled via
  the `xmpp` prop by the DM dialog, the create-channel members field and the Add-users panel
  of a hosted room.
- `channels.invite`/`groups.invite` pass raw usernames through for hosted MUCs, since the
  invited JID has no local user record yet.
- `xmppFederation` is published with the room (`publishFields.ts`, `adminFields.ts`) and
  copied onto client rooms and subscriptions, so the display rules Matrix rooms get also
  apply to every XMPP room: `roomName` shows `fname` (client and server room types, the
  parent-discussion header) and the room icon is the globe (`useRoomIcon`, `getIcon`).
  The checks are `isRoomFederated(room) || isRoomXMPPFederated(room)`; the Matrix-only
  restrictions behind `isRoomFederated` alone (blocked actions, the composer, room settings)
  do not apply.
- Everything else renders as ordinary rooms and users.

## Testing layout

- **Unit** (jest, `@rocket.chat/jest-presets/server`, colocated `*.spec.ts`): dialback key
  vectors, JID escaping, `StanzaParser` hardening, `MucRoom` and `RemoteMucSession` state
  machines, the router, disco, the mapping helpers.
- **Package integration** (`tests/integration/`): two in-memory `XMPPServer` instances on
  loopback with an injected DNS resolver and the certificates in `tests/fixtures/`: the full
  dialback dance in both directions, queue flush, spoof rejection, routing events,
  cross-server MUC, and the service's handler observer.
- **End-to-end** (`tests/end-to-end/`): real XMPP users on a real XMPP server talking to a
  running Rocket.Chat. Not part of CI. Each spec file maps to a capability spec; cases that
  fail today are `it.skip` and link to the `D` entry that describes them.

### End-to-end tests

```
                ┌─ @xmpp/client (C2S) ──▶ XMPP server (ejabberd) ──S2S──┐
node --test ────┤                                                        ▼
                └─ REST ──────────────▶ Rocket.Chat ──broker──▶ xmpp-server-service
```

- **Runner**: `node:test`, loading TypeScript through `tsx`, the loader the Meteor API suite
  uses. That lets the specs import the shared helpers: the REST helpers and test admin from
  `apps/meteor/tests/data`, `retry` from the API suite, and the `DDPListener` from the Matrix
  federation suite.
- **XMPP side**: `helper/xmpp-client.ts`. Each suite registers fresh accounts in-band
  (XEP-0077) and removes them when it finishes. Every inbound stanza is recorded, so a wait
  never misses one that arrived before it started.
- **Rocket.Chat side**: `helper/rocketchat.ts`, thin wrappers over the shared helpers, logged
  in as the repo's test admin. Test users keep an unverified email, because email 2FA would
  otherwise block their login. Presence tests also give the user a live DDP session, since a
  user with no session never shows a status.
- **Preflight** (`helper/suite.ts`): every suite checks the Rocket.Chat XMPP settings and the
  service's `/stats` (a decode-only service never forwards to Rocket.Chat), then sends an S2S
  ping from an XMPP user to Rocket.Chat's domain, which proves federation in both directions.

What the servers need, and the environment variables, are in
[operations.md](operations.md#running-the-end-to-end-suite).

### Load testing

`ee/apps/xmpp-server-service/loadtest/` is a load generator. It answers two questions:

- **`--mode ramp`** (the default): up to which constant rate does the service keep up?
- **`--mode max`**: how many events per second can it process at most?

Shared setup:

- Each fake remote domain `lt<i>.test` is a real `XMPPServer` on port `15269+i`. Each opens
  its own inbound S2S socket to the service.
- Scenarios: `dm` (1:1 messages), `presence` (online/away flips), `muc` (groupchat into a
  hosted room, whose reflections also give an XMPP-side echo latency), `mix` (weighted
  combinations).
- A warm-up runs before measuring, so first-contact costs (creating remote users, DM rooms
  and room joins) are excluded unless `--cold` is passed.

```sh
yarn workspace @rocket.chat/xmpp-server build
# the service must know how to dial back to the peers
XMPP_DNS_OVERRIDES=$(yarn workspace @rocket.chat/xmpp-server-service loadtest overrides --domains 4) \
  yarn workspace @rocket.chat/xmpp-server-service ms2
RC_USER=admin RC_PASSWORD=… yarn workspace @rocket.chat/xmpp-server-service loadtest run --scenario dm --mode max
```

The generator creates `lt-local-<n>` users and, for `muc`, a hosted channel `lt-muc` through
the REST API. `--configure <domain>` also enables the XMPP server settings. The peers connect
to the service on `XMPP_Server_Port` unless `--rc-port` says otherwise. They always offer
STARTTLS, because a service with a certificate configured refuses dialback over cleartext.

**Ramp mode** sends at a fixed arrival rate that never waits on the service, so a slow service
shows up as backlog instead of lowering the load. It raises the rate step by step and waits
for the backlog to drain after each step. A step does not count as kept up when: the service
processed less than 95% of what was sent; the backlog kept growing; handler p99 went above
1 s; the service's event-loop p99 went above 100 ms; the backlog did not drain; any handler
failed, any send failed, or `/stats` timed out. The run reports the last step that kept up.
Steps where the generator itself missed the target rate are flagged as generator-bound, and
steps cut short by Ctrl-C as interrupted. Neither counts as the ceiling.

**Max mode** keeps the service saturated without flooding it: it holds a queue of about
`--queue-seconds` (default 0.5 s) of the service's recent throughput ahead of what the service
has processed, re-sized as throughput changes. The rate the service processes at, measured
after a settle period, is its maximum throughput. Handler latency in this mode is mostly
queueing delay, not service time. The result is flagged as not trustworthy when handlers or
sends failed, the backlog did not drain, fewer than 5 s were measured, or the generator could
not keep the queue at least half full.

**Checking the results**: every run ends with an accounting of events. Every send must be
decoded exactly once and handled exactly once. For `dm` and `muc` the run also counts the
messages in Mongo by `federation.eventId`, which catches lost and duplicated messages.
Everything goes into `loadtest-<runId>.json`. Ctrl-C ends the current measurement early and
still drains, checks and writes the report; a second Ctrl-C exits at once.

The generator was calibrated against a fake service whose capacity was known from its own job
timings: ramp mode passed at 400/s and failed at 500/s against a capacity of 449/s; max mode
measured 454/s against 456/s; injected handler failures were reported; a service faster than
the generator (about 130k events/s on one core) was flagged as generator-bound.

Run each scenario twice: once with `XMPP_DECODE_ONLY=true` on the service (the parsing and
routing ceiling; `/stats` reports the mode and the generator adapts), once normally. A large
gap between the two puts the bottleneck on the Rocket.Chat side. Suspects are the Mongo pool
and the `Room`/`Message` broker calls, which run inside Meteor, so watch Meteor's CPU as well.
