# Stream fan-out rides the service broker

- **Status:** accepted
- **Date:** 2026-09
- **Scope:** `packages/streamer`, `packages/core-services` (`LocalBroker`), `apps/meteor` (`InstanceService`, notifications, federation startup), `ee/apps/ddp-streamer`

## Decision

Every delivery that crosses a process boundary is a service broker event. There is no second channel.

- A stream fan-out — `Streamer.emit()` reaching the subscribers of other processes — is the broker event
  `stream`, carrying `{ stream, eventName, args, origin }`. `origin` identifies the process that emitted it.
  Every process that hosts a `NotificationsModule` receives it through `ListenersModule` and delivers it to its own
  subscribers, unless `origin` is its own.
- `LocalBroker` reaches other instances only through an explicit cluster-transport port. In an enterprise
  multi-instance monolith, `InstanceService` implements that port over its existing Moleculer broker ("matrix"),
  keeping the scalability license gate and the `Troubleshoot_Disable_Instance_Broadcast` switch.
- A server-side reaction to a client's stream write is a domain event that `NotificationsModule` publishes with
  `emitToOne`, which reaches **one instance of each listening service**. The consumer subscribes to it like to any
  other event, so no process that hosts client connections wires anything for it. Typing is `room.user-activity`,
  consumed by `FederationMatrix`.
- `StreamerCentral` is removed. `NotificationsModule` owns the registry of its streams.

## Why

`StreamerCentral` was a process-global `EventEmitter` doing three jobs: a registry of streams, a `'broadcast'` hook
fired on every broadcasting emit, and a `'publish'` hook fired on every client write. Whether anything listened
depended on the deployment, and each deployment wired it differently:

| deployment                      | `'broadcast'` listener                          | transport                    |
| ------------------------------- | ----------------------------------------------- | ---------------------------- |
| enterprise multi-instance       | `InstanceService`, with the scalability license | matrix Moleculer broker      |
| microservices, monolith process | none                                            | none                         |
| microservices, ddp-streamer     | `service.ts`                                    | `api.broadcast('stream', …)` |

In the enterprise multi-instance monolith the same channel also carried the service event bus itself:
`LocalBroker` wrapped every `api.broadcast` as a fake emit on a `local` stream, and `Notifications.ts` unwrapped it
on the other side.

That wiring produced defects no single file shows:

- **Microservices, monolith to clients.** Nothing forwarded the monolith's broadcasting emits, and every
  websocket lives in ddp-streamer. Canned responses, importer progress, integration history, the apps bridge's
  typing and the Slack bridge import never reached a client. Only events that went through `api.broadcast` and
  `ListenersModule` worked.
- **Microservices, federation typing.** `'publish'` fired inside ddp-streamer, where nothing listened. Local users'
  typing never reached Matrix.
- **ddp-streamer echo.** Moleculer's `broadcast` also delivers to the sender's own services, and nothing filtered
  by origin. A client write reached the other sockets on the same pod twice and came back to the writer.
- **Double fan-out.** `ListenersModule` used the broadcasting emit for video conference events that every instance
  had already received from the broker.

Making the broker the only channel removes the per-deployment wiring, which is where every one of these came from.

### Alternatives rejected

- **Forward `StreamerCentral` in the monolith too.** Fixes the first defect, keeps the global emitter, and adds a
  fourth wiring on top of the other three.
- **Retire matrix; run `MoleculerBroker` in a multi-instance monolith.** One broker implementation everywhere, but
  it changes licensing enforcement, node discovery (TCP plus the `InstanceStatus` change stream) and operations.
  Out of proportion with the problem. The port keeps that door open.
- **Broadcast client-write reactions as broker events.** A broadcast reaches every instance of the consumer, so a
  multi-instance deployment would send the same Matrix typing notification once per instance.
- **A hook in each process that hosts clients, making a service call.** A call reaches one instance, but every such
  process has to register the hook and know who consumes it: ddp-streamer would name `FederationMatrix`. Routing
  the hook through the monolith instead only moves that knowledge into a relay method whose job is to be a hop.
- **Reuse the `stream` relay.** It is a broadcast, so it has the duplication problem, and it does not say which
  user wrote.

## Consequences

- Delivery stays at-most-once and fire-and-forget. Ordering is whatever the broker's transport gives, the same for
  stream relays and for other events because they share it.
- Code that reacts to a broker event and then emits to clients uses the in-this-instance emit
  (`emitWithoutBroadcast`, `notify…InThisInstance`). Every instance already received the event.
- In microservices mode the monolith receives every stream relay, such as typing, and delivers it to its own DDP
  sessions, of which there are normally none.
- `IBroker` gains `emitToOne`. Moleculer implements it as a balanced `emit`, grouped by service name; `LocalBroker`
  delivers in process, because service names are unique there and the client write happens on one instance. A NATS
  broker implements it with a queue group per service, on a subject prefix apart from the broadcast one.
- The `stream` event and matrix payloads change shape. During the first rolling upgrade, instances on different
  versions do not exchange real-time events until all of them are upgraded. No compatibility layer is kept for it.
- How events travel in each deployment is documented in `docs/service-brokers.md`, "Events across instances".
