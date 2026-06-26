# Steering notes — pick up here next session

Last session: grilling round 4 (2026-06-26). Set the six **guiding tenets** (`TENETS.md`) —
added & scoped Isolation and Public-contract stability; pinned the Observability/Auditing seam,
re-scoped Permissioning's "static analysis" to build-time tooling, and committed Testability's
test kit to the public contract. Pinned **Watt/Platformatic + worker-thread-per-app** as the
isolation/orchestration direction. Round 3 designed the event-handler model (`0003`) and
declarative filtering (`0004`); rounds 1–2 covered entry (`0001`) and data-access reads (`0002`).

## How to resume

1. Read `TENETS.md` first — the six guiding tenets are the lens for every decision below.
   Then read, in order: `README.md` (index) → `0001` → `0002` → `0003` → `0004`. Self-contained.
2. For full background, the current-state analysis is in `../apps-current-architecture/`
   (01 app-facing SDK, 02 engine/state, 03 runtime/bridges) and the running design context is
   `../apps-v2-sdk-design.md`.
3. Resume the grilling skill (`/grilling`) on the next open fork below.

## The four-pillar map (this is the spine of the SDK design)

- [x] **Pillar 1 — Startup / entry** → decided in `0001`.
- [ ] **Pillar 2 — Contributions** (the `extendConfiguration` replacement). *Not started.*
- [~] **Pillar 3 — Data access** → reads decided in `0002`. **Writes still open** (see C below).
- [~] **Pillar 4 — Event handlers** → model in `0003`, filtering in `0004`.
      **Open forks remain** (see A below).

## Recommended next order & the specific forks waiting

### A. Finish Pillar 4 — close the open forks left by `0003`/`0004` (do this next)
Smallest, most-in-context work; finishes a pillar we're already deep in.
- **`post` handler shape** — ratify: `void` return, the *full* `ctx`, no decision verbs.
  Assumed throughout `0003` but never separately confirmed.
- **Permission edges** (design-doc Q7): does subscribing to `message:send:pre` require
  `read:messages` (receiving the payload *is* reading)? Is **`prevent` itself a declared
  capability** an admin must consent to, separate from `read:messages`?
- **Full `EventName` catalogue** — map v1's families (`../apps-current-architecture/01` §3.3:
  messages/rooms/users/livechat/uploads/uikit + lifecycle) into the `entity:verb:timing` union,
  and define **each event's payload shape** + its **filterable projection** (`0004` §3) —
  multi-subject events (`room:userJoin`) need bespoke projections.
- **Enumerate the event-filter operator superset** (`0004` §4) — which substring/`contains`-style
  operators reads don't get, and whether any field is filter-excluded.

### B. Finish Pillar 3 — write semantics (deferred in `0002` §5)
`0003` already pinned two pieces: the **single shared writable projection per entity** (used by
both `event.patch` and `ctx.x.update`), and the **two write paths' failure/atomicity**. Still open:
- Batched/unit-of-work `update`; flush timing (implicit at handler end vs `await ctx.commit()`).
- Read-your-writes overlay vs "deferred writes, don't read them back".
- Optimistic concurrency on `update` (`_updatedAt`/version → `ConflictError`) vs last-write-wins.
- **Writable-projection owner/location** (shared governance with `0002` §2 / `0004` §3) — design-doc Q4.
- **Reference-resolution API** — how an app resolves `message.u` → full user on demand.

### C. Pillar 2 — Contributions
- Declarative descriptor vs imperative registration for slashcommands / endpoints / settings /
  scheduler / UI buttons (v1 list in `../apps-current-architecture/01` §4).
- Everything hangs off `app` (design-doc §"App authoring surface"); confirm no contribution
  needs the `Engine`/host control plane (design-doc Q1).
- Does the manifest carry a contribution + permission summary for the **admin install screen**,
  derived/validated against the factory? (Avoid v1's `implements`-array split-brain.)
- Settings: reuse v1's `SettingType` set? Setting *values* are read off `AppSetupContext` (`0001`).

### D. Cross-cutting, after the pillars
- `PermissionDeniedError` type across the boundary (typed, carries missing scope).
- **Transport requirement derivation** (`0003` §5): `connect` rejecting apps with `pre` handlers;
  deriving subprocess-vs-network requirement from registrations.
- Reconciler state machine (single-instance): states/transitions/persistence (design-doc).
- Reconcile `../apps-v2-sdk-design.md` "Open questions" against `0001`–`0004` (Q3 two-write-paths
  and Q6 keyset are now decided; Q4 writable-projection partially; Q7 permission edges still open).

## Conventions established
- One decision per file, `NNNN-kebab-title.md`, status line + scope + "Builds on" links.
- Keep `README.md` table in sync when adding a decision.
- Record decisions in `docs/proposals/apps-v2/`; the running design doc stays as-is unless asked.
