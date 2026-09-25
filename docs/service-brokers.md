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
