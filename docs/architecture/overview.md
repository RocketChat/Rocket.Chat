# Architecture overview

**Who this is for:** any developer who wants a mental model of how Rocket.Chat
fits together before diving into a specific area. **After reading:** you can
place a feature in the right layer and know which doc to open next.

> One page. Each box links to a deeper doc.

---

## The shape

Rocket.Chat is a **Meteor monolith** (`apps/meteor`) surrounded by a set of
**optional Node microservices** (`ee/apps/*`), sharing typed logic through
**workspace packages** (`packages/*`, `ee/packages/*`). Data lives in
**MongoDB**, accessed through a proxied models layer.

```
                        ┌─────────────────────────────┐
        Browser / ─────▶│      Meteor monolith         │
        Mobile / Desktop│        (apps/meteor)         │
                        │                              │
   REST  /api/v1/... ───┼─▶ API layer (typed routes)   │
   WebSocket /websocket │   Real-time streamer (events)│
   (events, not DDP     │   Meteor methods (legacy)    │
    mergebox)           │                              │
                        │   Business logic:            │
                        │   callbacks · settings · apps│
                        │                              │
                        │   Models (proxified) ────────┼──▶ MongoDB
                        └───────────┬──────────────────┘
                                    │ core-services (proxified)
                                    │ transport: NATS / TCP
                        ┌───────────▼──────────────────┐
                        │   Microservices (ee/apps/*)   │
                        │   presence · authorization ·  │
                        │   account · ddp-streamer ·    │
                        │   stream-hub · queue-worker · │
                        │   federation · omni-transcript│
                        └───────────────────────────────┘
```

## The layers

| Layer | Where | What it is | Deeper doc |
|-------|-------|-----------|-----------|
| **Clients** | browser, desktop, mobile | Connect via REST + a WebSocket event stream | [realtime-and-ddp](./realtime-and-ddp.md) |
| **Monolith** | `apps/meteor` | The main app: API, real-time, business logic, UI | [meteor-and-microservices](./meteor-and-microservices.md) |
| **Shared packages** | `packages/*`, `ee/packages/*` | Typed contracts & reusable logic (core-typings, rest-typings, models, ui-*) | [monorepo-layout](./monorepo-layout.md) |
| **Models / data** | `@rocket.chat/models` → MongoDB | Lazy **proxified** model access | [glossary: proxify](../reference/glossary.md) |
| **Microservices** | `ee/apps/*` | Optional services reached via `core-services` over NATS/TCP | [meteor-and-microservices](./meteor-and-microservices.md) |

## Three ways the client talks to the server

1. **REST** (`/api/v1/...`) — the **preferred** path for new client-server
   calls. Typed, validated, versioned. See [critical-flows](./critical-flows.md).
2. **Real-time streamer** (WebSocket) — server pushes **events**; the client
   updates its own state. Not a DDP collection mirror. See
   [realtime-and-ddp](./realtime-and-ddp.md).
3. **Meteor methods** (DDP RPC) — **legacy**. Being migrated to REST. Don't add
   new ones.

## Where business logic hooks in

Inside the monolith, features extend the system through a few well-defined
mechanisms rather than ad-hoc edits:

- **Callbacks** — `before*/after*` hooks (e.g. `afterSaveMessage`).
- **Settings registry** — admin-configurable settings.
- **Apps-Engine** — marketplace apps react to events (`IPreMessageSent*`, …).
- **Slash commands / integrations / webhooks**.

These are the planned subject of the `extending/*` docs (Phase 3).

## Tech stack at a glance

TypeScript everywhere · Meteor 3.4.1 · React + Fuselage (UI) · MongoDB (replica
set) · Moleculer + NATS (services) · Yarn 4 workspaces + Turborepo (monorepo) ·
Jest/Mocha/Playwright (tests).

---

**Next:** [monorepo-layout](./monorepo-layout.md) ·
[meteor-and-microservices](./meteor-and-microservices.md) ·
[critical-flows](./critical-flows.md) · [glossary](../reference/glossary.md)
