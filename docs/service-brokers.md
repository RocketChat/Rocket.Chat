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
| `MoleculerBroker` | `ee/packages/network-broker/src/MoleculerBroker.ts` | microservices                 | in process when local, over the transporter when remote |

The monolith installs `LocalBroker` at `apps/meteor/server/startup/localServices.ts`
unless it runs in microservices mode, in which case
`apps/meteor/ee/server/startup/index.ts` installs the network broker returned by
`startBroker()` (`ee/packages/network-broker/src/moleculer.ts`) instead. Standalone
services (`ee/apps/*`) call `startBroker()` directly.

## LocalBroker

The simpler of the two: a `Map` of services and an `EventEmitter`. It exists so
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

**Events.** `broadcast()` emits to this process's listeners and hands the event to
the cluster transport, if one is installed. `broadcastLocal()` and
`broadcastToServices()` never leave the process. See
[Events across instances](#events-across-instances).

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

## Events across instances

A broker event is the only way a real-time update crosses a process boundary. Client
updates ride on it too: a stream emit that must reach clients connected to other
processes is relayed as the event `stream`.

### What each call reaches

| deployment                         | `broadcast`                          | `broadcastLocal` | `broadcastToServices`                | carried by                        |
| ---------------------------------- | ------------------------------------ | ---------------- | ------------------------------------ | --------------------------------- |
| single monolith                    | this process                         | this process     | this process, every listener         | —                                 |
| enterprise multi-instance monolith | every instance                       | this process     | this process, every listener         | `InstanceService` (matrix broker) |
| microservices                      | every node, **including the sender** | this node        | every instance of the named services | the Moleculer transporter         |

### The cluster transport

`LocalBroker` knows nothing about other instances. `setClusterTransport()` installs
whatever carries `broadcast()` onwards. In an enterprise multi-instance monolith that is
`InstanceService` (`apps/meteor/ee/server/local-services/instance/service.ts`). It:

- installs itself only with the `scalability` license module, at start or when the
  license arrives. Without it, the instances of a multi-instance monolith do not see
  each other's events.
- sends each event on its own Moleculer broker as the `matrix` service's `event`
  event, `{ event, args }`, serialised with EJSON. Peers are found over TCP through the
  `InstanceStatus` collection, or over NATS with `TRANSPORTER=monolith+nats://…`.
- delivers what it receives with `broadcastLocal()`, ignoring its own node.
- sends nothing while the `Troubleshoot_Disable_Instance_Broadcast` setting is on.

In microservices mode the monolith runs `MoleculerBroker`, which reaches every node
already, and `InstanceService` is not registered.

### Stream relays

`Streamer.emit()` delivers to this process's subscribers, then relays the emit as the
broker event `stream`:

```ts
{ stream: 'notify-room', eventName: 'room1/user-activity', args: [...], origin: InstanceStatus.id() }
```

Every process that hosts a `NotificationsModule` receives it through `ListenersModule`, the
monolith and every ddp-streamer alike, and hands it to
`NotificationsModule.deliverRelayed()`. That delivers to its own subscribers, unless
`origin` is itself. The origin check is what keeps the sender from delivering twice:
Moleculer's broadcast reaches the sender too, and so does `LocalBroker`'s.

A client's write to a stream (the `stream-<name>` DDP method) is relayed the same way when
the stream retransmits.

### Emitting in reaction to a broker event

Every instance already receives a broker event. A listener that turns one into a client
update must deliver to this instance only, with `emitWithoutBroadcast()` or a
`notify…InThisInstance()` helper. Otherwise each instance relays it again and clients get
it once per instance. `ListenersModule` does this for every event it handles.

Code that is _not_ reacting to a broker event, such as a Meteor method, a REST handler or
a callback, uses `emit()`, so its update reaches clients connected anywhere. In
microservices mode that is every client: none connect to the monolith.

### Reacting to a client's write on the server

Some client writes need a server-side reaction, such as forwarding typing to federation.
These are typed hooks on `NotificationsModule` (`onUserActivity()`), registered in every
process that hosts client connections. The hook makes a **service call**, never a
broadcast: a broadcast reaches every instance of the consumer, and a call reaches one.
Never listen on the stream itself for this. A stream listener only fires in the process
that received the write.

### Delivery

At most once and fire and forget: no acknowledgement, retry or replay. Order is what the
transport gives between two nodes, the same for stream relays and other events because
they share it. A process that starts late misses what was sent before it joined.

The design and the alternatives that were rejected are recorded in
[ADR 0005](adr/0005-stream-fan-out-rides-the-service-broker.md).

## What crosses a process boundary

Every broker dispatches locally without serialising, so a call only meets a
serializer when the two ends are genuinely in different processes. That makes it
easy to write a call that works everywhere it is currently exercised and breaks the
day its service is extracted.

`MoleculerBroker` uses EJSON, which is quieter about failure than it looks:

| value                         | round-trips as                     |                                  |
| ----------------------------- | ---------------------------------- | -------------------------------- |
| mongo cursor                  | **throws** — circular structure    | fatal, loud                      |
| Node stream                   | out of band, only as `streamParam` | handled in that one shape        |
| `Map` / `Set`                 | `{}`                               | fatal, silent                    |
| function                      | `{}`                               | fatal, silent                    |
| class instance                | plain object, methods gone         | fatal, silent                    |
| `Buffer`                      | `Uint8Array`                       | degrades, loses `Buffer` methods |
| `Date`, `RegExp`, `undefined` | intact                             | fine                             |

The calls below pass or return something in that table.

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

| variable                 | default     | effect                                                           |
| ------------------------ | ----------- | ---------------------------------------------------------------- |
| `REQUEST_TIMEOUT`        | `60`        | seconds to wait for a reply                                      |
| `LICENSE_CHECK_INTERVAL` | `20`        | seconds between license checks                                   |
| `MAX_FAILS`              | `2`         | failed license checks before a service shuts itself down         |

`MoleculerBroker` only — see `ee/packages/network-broker/src/moleculer.ts` for the
full set:

| variable                                   | default          | effect                                                                                             |
| ------------------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------- |
| `TRANSPORTER`                              | —                | Moleculer transporter string                                                                       |
| `MS_NAMESPACE`                             | —                | Moleculer namespace                                                                                |
| `SERIALIZER`                               | `EJSON`          | anything else is passed to Moleculer by name                                                       |
| `BALANCE_STRATEGY`                         | `RoundRobin`     | registry strategy                                                                                  |
| `BALANCE_PREFER_LOCAL`                     | `true`           | `false` load balances even when a local instance exists                                            |
| `RETRY_ENABLED`                            | `false`          | Moleculer retry policy, tuned by `RETRY_RETRIES`, `RETRY_DELAY`, `RETRY_MAX_DELAY`, `RETRY_FACTOR` |
| `HEARTBEAT_INTERVAL` / `HEARTBEAT_TIMEOUT` | `10` / `30`      | seconds                                                                                            |
| `BULKHEAD_ENABLED`                         | `false`          | concurrency limiting, tuned by `BULKHEAD_CONCURRENCY` and `BULKHEAD_MAX_QUEUE_SIZE`                |
| `MS_METRICS` / `MS_METRICS_PORT`           | `false` / `9458` | Prometheus reporter                                                                                |
| `MOLECULER_LOG_LEVEL`                      | `warn`           | pino level                                                                                         |
