# Service brokers

Rocket.Chat's server code is split into services. A service is a class extending
`ServiceClass` that is handed to `api.registerService(...)`, and callers reach it
through a proxy rather than by importing it:

```ts
// packages/core-services/src/index.ts
export const Authorization = proxify<IAuthorization>('authorization');

// anywhere on the server
await Authorization.hasPermission(uid, 'view-c-room');
```

`proxify` turns every property access into
`api.call('<service>.<method>', [...args])`, and `Api.call` forwards that to
whichever **broker** is installed. The broker is the only thing that knows whether
the service is an object in this process or a container on the other side of the
network, which is what lets the same call site work in both deployments.

Everything above `@rocket.chat/core-services` is written against `IBroker`
(`packages/core-services/src/types/IBroker.ts`) and never learns which
implementation it got.

## Choosing a broker

| broker            | where                                               | used when                     | dispatch                                                |
| ----------------- | --------------------------------------------------- | ----------------------------- | ------------------------------------------------------- |
| `LocalBroker`     | `packages/core-services/src/LocalBroker.ts`         | monolith                      | in process only                                         |
| `MoleculerBroker` | `ee/packages/network-broker/src/MoleculerBroker.ts` | microservices, `BROKER` unset | in process when local, over the transporter when remote |
| `NatsBroker`      | `ee/packages/network-broker/src/NatsBroker.ts`      | microservices, `BROKER=nats`  | in process when local, over NATS when remote            |

The monolith installs `LocalBroker` unconditionally at
`apps/meteor/server/startup/localServices.ts`. In microservices mode
`apps/meteor/ee/server/startup/index.ts` replaces it with a network broker, and
`startBroker()` picks between the two implementations:

```ts
// ee/packages/network-broker/src/startBroker.ts
const { BROKER = 'moleculer' } = process.env;
```

Standalone services (`ee/apps/*`) always call `startBroker()` directly, so they
follow the same switch.

## LocalBroker

The simplest of the three: a `Map` of services and an `EventEmitter`. It exists so
that the monolith pays nothing for an abstraction it does not need — a call is a
method call, an event is an emit.

**Dispatch.** `call()` resolves `<service>.<method>` against the registry and
invokes it, wrapped in a tracer span and an `asyncLocalStorage` context. Arguments
and results are passed by reference; nothing is serialised. A call to a service it
does not run resolves to `undefined` rather than throwing, and `CallingOptions`
are not supported (it logs a warning and ignores them).

**Startup ordering.** Services declare dependencies, and every service implicitly
depends on `settings`. `start()` polls once a second, starting any service whose
dependencies have started, and rejects after ten seconds with the names still
pending. This is why a service can safely read settings in `started()` in the
monolith.

**Events.** `broadcast()` emits locally and then re-emits on a `broadcast` channel.
The monolith subscribes to that channel with `onBroadcast` and forwards it to
`StreamerCentral`, which is how an event reaches other instances.

## MoleculerBroker

Wraps a Moleculer `ServiceBroker`. Moleculer supplies the registry, discovery,
heartbeats, load balancing and transport; `MoleculerBroker` adapts Rocket.Chat's
service classes onto Moleculer's schema format.

**Dispatch.** Moleculer resolves the call against its registry. If the target is
registered in the same process it invokes the handler directly, without touching
the serializer — `preferLocal` is on by default, and remote instances are load
balanced round robin. This local shortcut matters more than it sounds; see
[What crosses a process boundary](#what-crosses-a-process-boundary).

**Serialisation** is EJSON, via a custom serializer in `moleculer.ts`. A custom
`Errors.Regenerator` carries `MeteorError` across the wire with its `errorType`,
`reason`, `details` and `isClientSafe` intact, so a client-safe error thrown in a
service still reaches the client as one.

**Dependencies.** Every service gets an implicit dependency on `settings` and
`license` (`settings` itself is excluded to break the cycle). Moleculer's
`waitForServices` blocks `started()` until they are reachable anywhere in the
cluster, which is what lets a standalone service fetch settings during boot.

**License enforcement** is attached as a Moleculer mixin (`EnterpriseCheck`) to
every non-internal service.

**Streaming.** `call()` special cases a first argument carrying a `streamParam`: it
sends the stream itself as `ctx.params` — the only shape Moleculer's stream
detection recognises — and moves the remaining fields into `meta`. The action
handler reassembles `{ streamParam, details }` on the far side. This exists for
`Upload.uploadFileFromStream` and nothing else.

> One sharp edge: when a call is made outside an existing Moleculer context and the
> target service is not in `$node.services`, `call()` **returns** an `Error`
> instead of throwing it. Callers that only `await` the result get an `Error`
> object as their value.

## NatsBroker

The newer implementation, selected with `BROKER=nats`. It talks to NATS directly
using the [services protocol](https://docs.nats.io/using-nats/developer/services)
rather than reproducing Moleculer's registry.

### Subjects

Events and methods must not share a subject space, because several event names are
identical to a `<service>.<method>` pair (`accounts.login`). Without distinct
prefixes a broadcast would invoke the method and a call would be delivered to the
event listeners:

- `rpc.<service>.<method>` — calls, load balanced by NATS across every node running the service
- `node.<nodeID>.<service>.<method>` — calls pinned to one instance, backing `CallingOptions.nodeID`
- `event.<name>` — broadcasts

A node id is reduced to a single NATS subject token (`.`, `*`, `>` and whitespace
become `_`), and that reduced form is what `nodeList()` reports, so an id handed
back to `call()` always addresses the same subject.

### Discovery

There is no registry. `$node.list` and `$node.services` are answered from a
`$SRV.PING` request-many round trip, with each service carrying a
`rocketchat-node-id` metadata entry. A short TTL collapses back to back lookups
into a single ping.

### What had to be rebuilt

Moleculer provides several behaviours that call sites depend on without saying so.

#### 1. Local calls are dispatched in process

Moleculer invokes a locally registered service directly, and call sites rely on it:
`apps/meteor/ee/server/configuration/abac.ts` hands `LDAPEnterprise` a mongo
cursor, which only works because the argument arrives by reference.

`NatsBroker` originally sent everything over the wire, so EJSON met the cursor and
threw `Converting circular structure to JSON`. It now routes through a
`LocalServiceRegistry` that indexes the services running in this process by
`<service>.<method>`.

The registry lives in `packages/core-services/src/lib/LocalServiceRegistry.ts`
rather than in the broker package, because `LocalBroker` had grown its own copy of
the same mechanism. All three brokers now share it, and `getCallableMethods`
defines what a service answers to in exactly one place, so the local and remote
paths cannot expose different method sets.

Set `BROKER_LOCAL_ROUTING=false` to disable it and send every call over NATS.

#### 2. A call that reaches no responder is retried

Moleculer holds a registry and can wait for a service to appear. NATS has no such
thing: a request to a subject nobody is listening on fails immediately with `503`.
That is the normal state of affairs while a peer boots or is being rolled.

`call()` backs off and retries for a few seconds. Only `503` is retried — it means
nothing received the request, so a second attempt cannot duplicate a side effect.
Any other failure, a timeout above all, may well have been delivered and is
surfaced to the caller unchanged.

> `isNatsError` is declared by the nats typings but is not exported at runtime, so
> the check uses `NatsError` itself.

#### 3. Service dependencies are not honoured, lifecycle failures are not fatal

The implicit `settings` + `license` dependency is a distributed boot barrier: it
couples every service's startup to the monolith's, and the
`name === 'settings' ? [] : …` special case exists because the dependency graph is
not actually acyclic. `NatsBroker` does not implement it. Instead:

- A service that fails `created()` or `started()` is logged and left running.
  Endpoints are registered before any hook runs, so it still answers with whatever
  defaults it holds. Previously the rejection propagated out of `api.start()`, and
  the unhandled rejection killed the container silently, taking every other service
  hosted in the same process with it.
- Services that read configuration at boot now do it on first use, through
  `primeOnce` (`packages/tools/src/primeOnce.ts`), which memoises the result but
  not a failure — so a service that came up before the settings service configures
  itself on first use rather than staying on defaults. This applies to `Account`,
  `OmnichannelTranscript` and `AbacService`.

`AbacService` keeps its `started()` as an eager attempt, because selecting the PDP
is real initialisation rather than cache priming, and primes again on the decision
paths if that attempt failed. Its priming only fills in values that are still
unknown and leaves an already chosen PDP alone: settings events arrive
independently of the read, so whatever they delivered is newer.

#### 4. Streaming is not implemented

**This is an open gap.** There is no equivalent of Moleculer's `streamParam`
convention, so `Upload.uploadFileFromStream` fails with
`streamParam.pipe is not a function`. Buffering the payload instead is not viable:
NATS caps a message at 1MB by default and transcripts exceed that. The likely shape
is pull based chunking over a dedicated subject — the sender subscribes before
issuing the call, and the receiver's `Readable` requests the next chunk — which
gives backpressure and avoids a subscribe/publish race.

Note that [the apps-engine migration](./apps-engine-migration.md) is separately
restructuring the upload flow so that file contents do not have to cross NATS at
all.

#### 5. No tracing or async context propagation

`LocalBroker` and `MoleculerBroker` both wrap handlers in `asyncLocalStorage.run`
and a tracer span. `NatsBroker` does neither, on either the local or the remote
path. Nothing currently reads `ServiceClass.context`, so this is latent, but it
should be added to both paths together.

## What crosses a process boundary

Every broker dispatches locally without serialising, so a call only meets a
serializer when the two ends are genuinely in different processes. That makes it
easy to write a call that works everywhere it is currently exercised and breaks the
day its service is extracted.

Both network brokers use EJSON, which is quieter about failure than it looks:

| value                         | round-trips as                  |                                  |
| ----------------------------- | ------------------------------- | -------------------------------- |
| mongo cursor                  | **throws** — circular structure | fatal, loud                      |
| Node stream                   | `{}`                            | fatal, silent                    |
| `Map` / `Set`                 | `{}`                            | fatal, silent                    |
| function                      | `{}`                            | fatal, silent                    |
| class instance                | plain object, methods gone      | fatal, silent                    |
| `Buffer`                      | `Uint8Array`                    | degrades, loses `Buffer` methods |
| `Date`, `RegExp`, `undefined` | intact                          | fine                             |

The calls below pass or return something in that table.

### Broken now — the caller already runs in its own container

| call                                                     | site                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `Upload.uploadFileFromStream({ streamParam: Readable })` | `ee/packages/omnichannel-services/src/OmnichannelTranscript.ts:475` |
| `Upload.streamUploadedFile() → Promise<Readable>`        | `ee/packages/omnichannel-services/src/OmnichannelTranscript.ts:304` |

Both cross omnichannel-transcript → monolith, and are the streaming gap above.

### Latent — masked by local dispatch, break on extraction

| call                                                        | site                                                                      | problem                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------- |
| `LDAPEnterprise.syncUsersAbacAttributes(FindCursor<IUser>)` | `apps/meteor/ee/server/configuration/abac.ts:28`                          | cursor                  |
| `Upload.uploadFile({ buffer: Buffer })`                     | `ee/packages/federation-matrix/src/services/MatrixMediaService.ts:93,142` | Buffer                  |
| `Upload.getFileBuffer() → Promise<Buffer>`                  | `ee/packages/federation-matrix/src/services/MatrixMediaService.ts:166`    | Buffer, returned onward |
| `Upload.setUserAvatar(user, Buffer, …)`                     | `ee/packages/federation-matrix/src/events/member.ts:71`                   | Buffer                  |
| `Media.resizeFromBuffer(Buffer) → { data: Buffer }`         | `apps/meteor/server/lib/media/emoji-custom/lib/uploadEmojiCustom.ts:61`   | Buffer both ways        |
| `Media.isImage(Buffer)`                                     | `apps/meteor/server/api/v1/emoji-custom.ts:200,270`                       | Buffer                  |

The cursor case has a fix already sitting next to it:
`syncUsersAbacAttributesByIds(userIds: string[])`
(`apps/meteor/ee/server/local-services/ldap/service.ts:35`) is used by
`ee/packages/abac/src/pdp/LocalPDP.ts:86`. Routing `abac.ts:28` through the ids
variant takes the cursor off the boundary.

### Declared but never called through a proxy

Exposure without a caller — delete from the interface or retype:

- `Media.resizeFromStream(Readable) → Readable` — only ever called as `this.resizeFromStream(...)`
- `Media.stripExifFromImageStream(Stream): Readable` — same, and not `Promise` returning, which no broker call can satisfy
- `Media.stripExifFromBuffer(Buffer)` — no callers
- `Federation.verifyMatrixIds() → Promise<Map<string, string>>` on `IFederationService` / `IFederationServiceEE` — a stale type rather than a bug: the implementation and `IFederationMatrixService` both return `{ [key: string]: string }`, and the only call site uses the `FederationMatrix` proxy

> How this list was produced: a signature sweep of `packages/core-services/src/types/`
> for streams, cursors, `Buffer`, `Map`/`Set` and function-typed parameters, with each
> hit traced to real proxy call sites. It cannot catch a plain-looking type that
> carries a class instance at runtime, though only four signatures in that directory
> use `any` and none belong to a proxified service.

## Configuration

Shared:

| variable                 | default     | effect                                                           |
| ------------------------ | ----------- | ---------------------------------------------------------------- |
| `BROKER`                 | `moleculer` | `nats` selects `NatsBroker`                                      |
| `TRANSPORTER`            | —           | Moleculer transporter string; also the fallback NATS server list |
| `REQUEST_TIMEOUT`        | `60`        | seconds to wait for a reply                                      |
| `LICENSE_CHECK_INTERVAL` | `20`        | seconds between license checks                                   |
| `MAX_FAILS`              | `2`         | failed license checks before a service shuts itself down         |

`NatsBroker` only:

| variable               | default                                     | effect                                                                    |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `NATS_URL`             | `TRANSPORTER`, then `nats://localhost:4222` | server list                                                               |
| `BROKER_LOCAL_ROUTING` | enabled                                     | `false` sends every call over NATS, including to services in this process |

`MoleculerBroker` only — see `ee/packages/network-broker/src/moleculer.ts` for the
full set:

| variable                                   | default          | effect                                                                                             |
| ------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------- |
| `MS_NAMESPACE`                             | —                | Moleculer namespace                                                                                |
| `SERIALIZER`                               | `EJSON`          | anything else is passed to Moleculer by name                                                       |
| `BALANCE_STRATEGY`                         | `RoundRobin`     | registry strategy                                                                                  |
| `BALANCE_PREFER_LOCAL`                     | `true`           | `false` load balances even when a local instance exists                                            |
| `RETRY_ENABLED`                            | `false`          | Moleculer retry policy, tuned by `RETRY_RETRIES`, `RETRY_DELAY`, `RETRY_MAX_DELAY`, `RETRY_FACTOR` |
| `HEARTBEAT_INTERVAL` / `HEARTBEAT_TIMEOUT` | `10` / `30`      | seconds                                                                                            |
| `BULKHEAD_ENABLED`                         | `false`          | concurrency limiting, tuned by `BULKHEAD_CONCURRENCY` and `BULKHEAD_MAX_QUEUE_SIZE`                |
| `MS_METRICS` / `MS_METRICS_PORT`           | `false` / `9458` | Prometheus reporter                                                                                |
| `MOLECULER_LOG_LEVEL`                      | `warn`           | pino level                                                                                         |
