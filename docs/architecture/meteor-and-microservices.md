# The monolith and the microservices

**Who this is for:** a developer who needs to understand how the Meteor monolith
relates to the standalone services, and how to run/develop in each mode.
**After reading:** you know what runs where, how they talk, and when you need
microservices mode at all.

---

## Default: it's a monolith

For most development you run **only the monolith** (`apps/meteor`) with
`yarn dev`. In this mode the functionality that *can* be a separate service runs
**in-process** instead. You do not need NATS or any `ee/apps/*` service to build
features.

## The microservices

When deployed at scale (or run with `yarn ms`), parts of the system can run as
separate Node processes. They live in `ee/apps/*`:

| Service | Responsibility |
|---------|----------------|
| `presence-service` | User online/away/offline presence |
| `authorization-service` | Permission/role checks (RBAC) |
| `account-service` | Account/user operations |
| `ddp-streamer` | Holds client WebSocket connections; serves `/websocket` & `/sockjs` |
| `stream-hub-service` | Fan-out hub for real-time streams |
| `queue-worker` | Background job processing |
| `federation-service` | Matrix federation |
| `omnichannel-transcript` | Omnichannel transcript generation |

Each is built on **Moleculer**. They are **optional**: the monolith provides the
same capabilities in-process when a service isn't running.

## How they communicate: `core-services` + transporter

The monolith doesn't import a service directly — it calls an **interface** from
`@rocket.chat/core-services`, which is **proxified**: the call is routed to
whichever implementation is available (in-process, or a remote service over the
transporter). See `packages/core-services/src/index.ts`.

- **Transporter:** `TRANSPORTER` env var. Defaults to **TCP**; production and the
  local docker stack use **NATS**.
- Same proxify idea as the models layer — see
  [glossary: proxify](../reference/glossary.md). A consequence: a proxified call
  **waits** for its service to come online, so a misconfigured/missing service
  can make calls hang rather than error loudly.

```
apps/meteor ──calls──▶ core-services interface (proxify)
                          │
            ┌─────────────┴──────────────┐
   in-process impl              remote impl over NATS/TCP
   (monolith mode)              (ee/apps/* microservice)
```

## Running each mode

| Command | Mode | Notes |
|---------|------|-------|
| `yarn dev` (root or `apps/meteor`) | Monolith | **default** for feature work |
| `yarn ms` (`apps/meteor`) | Microservices | uses `TRANSPORTER` (default TCP); needs the services + broker up |
| `docker compose -f docker-compose-local.yml up` | Full stack from prebuilt images | Mongo replica set + NATS + Traefik + services; see [getting-started §6](../getting-started.md#6-run-modes) |

The docker stack puts **Traefik** in front: it routes `/websocket` & `/sockjs`
to `ddp-streamer` and everything else to the main app — mirroring how requests
are split in production.

## When do you actually need microservices mode?

- Editing a service in `ee/apps/*`.
- Reproducing a presence / streamer / federation / queue behavior that only
  manifests when that service runs out-of-process.
- Otherwise: stay on `yarn dev`. It's simpler and faster.

---

**Next:** [critical-flows](./critical-flows.md) ·
[realtime-and-ddp](./realtime-and-ddp.md)
