# Rocket.Chat — Contributor Architecture Overview

> **Purpose:** A concise, contributor-focused architecture overview that maps repo layout to runtime behavior, explains real-time data flow, and gives a clear decision tree for where to make changes. This is an orientation document — not an implementation guide.

---

## At-a-glance summary

- **Who this is for:** new contributors, first-time maintainers, and reviewers who need a single-entry mental model of Rocket.Chat’s runtime architecture.
- **What it covers:** system architecture, monorepo → runtime mapping, real-time message data flow, where to change code, EE vs. OSS split, and quick onboarding checkpoints.
- **Scope:** high-level only. No deep API docs, no deployment playbooks.

---

## System architecture (high-level)

Clients (web / desktop / mobile) connect to the Rocket.Chat backend using WebSocket (DDP/real-time) and REST APIs. The core options at runtime are:

- **Monolith:** the Meteor process (apps/meteor) handles connections, business logic, and broadcasting.
- **Microservices (EE):** Meteor focuses on business logic & persistence; stream-hub and other ee/apps/ microservices offload real-time broadcasting and presence via **NATS**.

```
┌─────────────┐
│   Clients   │  (Web/Desktop/Mobile)
└──────┬──────┘
       │ WebSocket + REST API
       ▼
┌─────────────────────────────┐
│  Rocket.Chat Server         │
│  ┌──────────────────────┐   │
│  │  Meteor Core         │   │  <-- apps/meteor/ (monolith)
│  └──────────────────────┘   │
│           │                  │
│           │ uses             │
│           ▼                  │
│  ┌──────────────────────┐   │
│  │ Shared Packages      │   │  <-- packages/
│  └──────────────────────┘   │
│                              │
│  ┌──────────────────────┐   │
│  │ Enterprise Features  │   │  <-- apps/meteor/ee/ (conditional)
│  └──────────────────────┘   │
└──────────┬───────────────────┘
           │
           ▼
     ┌──────────┐         ┌──────────┐
     │ MongoDB  │         │  NATS    │  (microservices mode)
     └──────────┘         └──────────┘
```

---

## Monorepo → Runtime mapping

| Directory | What it contains | Runtime context / where it runs |
|---|---:|---|
| `apps/meteor/` | Main Meteor app (server, client, methods) | Runs as the primary Meteor process — handles WebSocket (DDP), REST, and serves the web client |
| `apps/meteor/ee/` | EE-only features that extend the Meteor app | Loaded into Meteor **only** when an EE license/workspace enables them |
| `ee/apps/` | Standalone enterprise microservices (stream-hub, presence, etc.) | Runs as separate Node.js processes or containers; communicate via **NATS** |
| `packages/` | Shared TypeScript types, UI components, utilities | Imported by apps/meteor and ee/apps at build time — not standalone services |
| `apps/meteor/packages/` | Meteor-specific packages / Atmosphere variants | Bundled into the Meteor build — used by Meteor app only |

**Key takeaway:** `packages/` = shared libraries; `apps/` = runnable applications; `ee/` = enterprise-only split between in-process extensions and standalone microservices.

---

## Real-time messaging data flow (simplified)

1. Client sends message via WebSocket/DDP to Meteor.
2. Meteor validates the message and writes to **MongoDB**.
3. Meteor publishes an event (e.g., `message.sent`).
   - In **monolith** mode: Meteor pushes updates directly to connected clients.
   - In **microservices** mode: Meteor publishes to **NATS**.
4. `stream-hub` (an EE microservice) listens on NATS and broadcasts to clients on behalf of Meteor.
5. Clients receive updates and update their UI in real-time.

**Simplified flow:**

```
Client → WebSocket → Meteor → MongoDB
                       ↓
                     NATS ← Stream-hub → Other Clients
```

**Why NATS?** Lightweight pub/sub for inter-service events; decouples Meteor from broadcasting responsibilities so the main process can scale.

---

## Key technologies & roles

- **Meteor** — full-stack framework providing DDP (WebSocket), reactive data layer, and build tooling. Core of `apps/meteor/`.
- **MongoDB** — primary datastore for messages, users, rooms, and settings.
- **NATS** — lightweight message bus used in microservices mode for inter-service pub/sub.
- **Apps-Engine** — sandboxed runtime for third-party apps/integrations; runs inside Meteor or externally depending on configuration.
- **React** — UI library for web/desktop clients (`apps/meteor/client/`).
- **Prisma (future)** — planned ORM for new microservices during migration; not yet the default.

---

## Where to make changes — decision tree (practical)

Ask: *What are you building?* → choose target directory:

- New UI component/page → `apps/meteor/client/`
- New REST API endpoint → `apps/meteor/server/`
- New Meteor method (DDP) → `apps/meteor/server/methods/`
- Shared TypeScript types → `packages/core-typings/` (or relevant package)
- EE-only feature that needs tight Meteor integration → `apps/meteor/ee/`
- Scalable standalone service (streaming/presence) for EE → `ee/apps/<service-name>/`
- Custom app or integration → use **Apps-Engine** (separate repo / package)
- Bug fix in shared utility → `packages/<relevant-package>/`

**Rule of thumb:** if it requires tight, in-process access to Meteor internals or reactivity, prefer `apps/meteor/` (or `apps/meteor/ee/` for EE-only). If it’s horizontally scalable and independently deployable, prefer `ee/apps/`.

---

## Enterprise Edition (EE) split — where code lives and when it runs

- `apps/meteor/ee/` — EE features that extend the Meteor monolith (audit logs, advanced permissions). These only execute inside Meteor when an EE license is active.

- `ee/apps/` — standalone enterprise microservices (stream-hub, presence). These run as separate processes/containers and communicate with Meteor via **NATS**.

**If unsure:**
- *Tight integration with Meteor UI/state?* → `apps/meteor/ee/`.
- *Need independent scaling, separate lifecycle, or resource isolation?* → `ee/apps/`.

---

## Monolith vs Microservices — short comparison

| Mode | When to use | What runs where |
|---|---|---|
| Monolith | Small to medium deployments, development | Single `apps/meteor/` process handles everything (DDP, broadcasting, storage access) |
| Microservices | Large-scale production (10k+ users, multi-region) | Meteor handles core logic & persistence; `ee/apps/` microservices handle broadcast/presence via NATS |

**Key difference:** moving broadcast responsibilities out of Meteor reduces CPU and memory pressure on the main process and allows independent scaling.

---

## Practical onboarding checklist (for a new contributor)

1. Clone repo and run the Meteor app locally (`apps/meteor/`).
2. Read this overview first — aim to build a simple mental model: clients → Meteor → DB → (NATS → stream-hub).
3. Search for the area of change: `apps/meteor/`, `packages/`, or `ee/apps/`.
4. Run tests for the target package; add unit tests for logic in `packages/` and integration tests for Meteor methods.
5. If it’s EE-only, confirm license gating behavior by toggling EE flags locally.
6. Open a small PR that updates `README.md` with a link to this file and a 2–3 line summary.

---

## Where to add this file in the repo

Suggested path for the new doc: **`docs/ARCHITECTURE_OVERVIEW.md`** or top-level **`ARCHITECTURE_OVERVIEW.md`**.

**Suggested README snippet to link this doc** (add to main `README.md`):

> See **Architecture Overview** — `docs/ARCHITECTURE_OVERVIEW.md` — for a concise contributor-oriented system map and decision tree.

---

## Further reading (placeholders)

- Repository Structure (detailed folder breakdown)
- Server Architecture — component deep-dive
- Microservices Scaling — deployment guide
- Apps-Engine Contribution Guide

(Each of the above should link to the existing, more detailed docs; keep this overview as the first-stop orientation.)

---

## Feedback / next steps

If this looks good, suggest the file path you prefer (`docs/` vs top-level) and I can prepare a PR-ready commit message and a tiny README patch snippet.

---

*End of document.*

