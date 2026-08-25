# NATS broker for microservices

## Goal

Replace Moleculer with NATS as the transport between Rocket.Chat services, so the
microservice deployment stops depending on Moleculer's registry, discovery and
transporter stack.

The broker is selected at startup by the `BROKER` environment variable
(`ee/packages/network-broker/src/startBroker.ts`); anything other than `nats`
keeps the Moleculer implementation. Both brokers implement `IBroker`, so nothing
above `@rocket.chat/core-services` knows which one is running.

There are three broker implementations in the codebase:

| broker                                           | used by                       | dispatch                                      |
| ------------------------------------------------ | ----------------------------- | --------------------------------------------- |
| `LocalBroker` (`packages/core-services`)         | monolith, no transporter      | in process only                               |
| `MoleculerBroker` (`ee/packages/network-broker`) | microservices, `BROKER` unset | local in process, remote over the transporter |
| `NatsBroker` (`ee/packages/network-broker`)      | microservices, `BROKER=nats`  | local in process, remote over NATS            |

## How it works

**Subjects.** Events and methods must not share a subject space, because several
event names are identical to a `<service>.<method>` pair (`accounts.login`).
Without distinct prefixes a broadcast would invoke the method and a call would be
delivered to the event listeners:

- `rpc.<service>.<method>` — calls, load balanced across every node running the service
- `node.<nodeID>.<service>.<method>` — calls pinned to one instance, backing `CallingOptions.nodeID`
- `event.<name>` — broadcasts

A node id is reduced to a single NATS subject token (`.`, `*`, `>` and whitespace
become `_`) and that reduced form is what `nodeList()` reports, so an id handed
back to `call()` always addresses the same subject.

**Payloads** are EJSON. See [Calls that depend on local routing](#calls-that-depend-on-local-routing)
for what that does and does not survive.

**Discovery** uses the NATS services protocol (`$SRV.PING`) rather than a
registry. Each service registers with a `rocketchat-node-id` metadata entry, and
`$node.list` / `$node.services` are answered from a ping with a short TTL so back
to back lookups collapse into one round trip.

**License enforcement** is shared with the Moleculer broker
(`ee/packages/network-broker/src/licenseEnforcement.ts`) so the policy lives in
one place regardless of transport.

## Differences from the Moleculer broker

Moleculer provides several behaviours that call sites depend on without saying so.
Each had to be rebuilt or deliberately dropped.

#### 1. Local calls are dispatched in process

Moleculer resolves a call against its registry and, when the target service is
registered in the same process, invokes the handler directly without touching the
serializer. Call sites rely on this: `apps/meteor/ee/server/configuration/abac.ts`
hands `LDAPEnterprise` a mongo cursor, which only works because the argument
arrives by reference.

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

`MoleculerBroker` gives every service an implicit dependency on `settings` and
`license`, and Moleculer's `waitForServices` blocks `started()` until they are
reachable. That is a distributed boot barrier: it couples every service's startup
to the monolith's, and the `name === 'settings' ? [] : …` special case exists
because the dependency graph is not actually acyclic.

`NatsBroker` does not implement it. Instead:

- A service that fails `created()` or `started()` is logged and left running.
  Endpoints are registered before any hook runs, so the service still answers with
  whatever defaults it holds. Previously the rejection propagated out of
  `api.start()`, and the unhandled rejection killed the container silently, taking
  every other service hosted in the same process with it.
- Services that read configuration at boot now do it on first use instead, through
  `primeOnce` (`packages/tools/src/primeOnce.ts`), which memoises the result but
  not a failure — so a service that came up before the settings service configures
  itself on first use rather than staying on defaults. This applies to
  `Account`, `OmnichannelTranscript` and `AbacService`.

`AbacService` keeps its `started()` as an eager attempt, because selecting the PDP
is real initialisation rather than cache priming, and primes again on the decision
paths if that attempt failed. Its priming only fills in values that are still
unknown and leaves an already chosen PDP alone: settings events arrive
independently of the read, so whatever they delivered is newer.

#### 4. Streaming is not implemented

**This is an open gap.** `MoleculerBroker.call` special cases a first argument
carrying a `streamParam`: it sends the stream itself as `ctx.params`, which is the
only shape Moleculer's stream detection recognises, and moves the rest into `meta`.
The action handler reassembles it on the far side.

`NatsBroker` has no equivalent, so `Upload.uploadFileFromStream` fails with
`streamParam.pipe is not a function`. Buffering the payload instead is not viable:
NATS caps a message at 1MB by default and transcripts exceed that. The likely
shape is pull based chunking over a dedicated subject — the sender subscribes
before issuing the call, and the receiver's `Readable` requests the next chunk —
which gives backpressure and avoids a subscribe/publish race.

Note that [the apps-engine migration](./apps-engine-migration.md) is separately
restructuring the upload flow so that file contents do not have to cross NATS at
all.

#### 5. No tracing or async context propagation

`LocalBroker` and `MoleculerBroker` both wrap handlers in `asyncLocalStorage.run`
and a tracer span. `NatsBroker` does neither, on either the local or the remote
path. Nothing currently reads `ServiceClass.context`, so this is latent, but it
should be added to both paths together.

## Calls that depend on local routing

EJSON is what a call has to survive once it crosses a process boundary, and it is
quieter about failure than it looks:

| value                         | round-trips as                  |                                  |
| ----------------------------- | ------------------------------- | -------------------------------- |
| mongo cursor                  | **throws** — circular structure | fatal, loud                      |
| Node stream                   | `{}`                            | fatal, silent                    |
| `Map` / `Set`                 | `{}`                            | fatal, silent                    |
| function                      | `{}`                            | fatal, silent                    |
| class instance                | plain object, methods gone      | fatal, silent                    |
| `Buffer`                      | `Uint8Array`                    | degrades, loses `Buffer` methods |
| `Date`, `RegExp`, `undefined` | intact                          | fine                             |

The calls below pass or return something in that table. They work today only
because both ends happen to be in the same process, so local routing dispatches
them by reference. Each one has to be fixed before the service on either end can
be extracted.

### Broken now — the caller already runs in its own container

| call                                                     | site                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `Upload.uploadFileFromStream({ streamParam: Readable })` | `ee/packages/omnichannel-services/src/OmnichannelTranscript.ts:475` |
| `Upload.streamUploadedFile() → Promise<Readable>`        | `ee/packages/omnichannel-services/src/OmnichannelTranscript.ts:304` |

Both cross omnichannel-transcript → monolith. These are gap 4 above.

### Latent — masked by local routing, break on extraction

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

| variable                 | default                                                   | effect                                                                    |
| ------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `BROKER`                 | `moleculer`                                               | `nats` selects `NatsBroker`                                               |
| `NATS_URL`               | falls back to `TRANSPORTER`, then `nats://localhost:4222` | server list                                                               |
| `BROKER_LOCAL_ROUTING`   | enabled                                                   | `false` sends every call over NATS, including to services in this process |
| `REQUEST_TIMEOUT`        | `60`                                                      | seconds to wait for a reply                                               |
| `LICENSE_CHECK_INTERVAL` | `20`                                                      | seconds between license checks                                            |
| `MAX_FAILS`              | `2`                                                       | failed license checks before a service shuts itself down                  |
