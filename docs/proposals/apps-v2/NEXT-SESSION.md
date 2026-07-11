# Steering notes — pick up here next session

Last session: grilling round 5 (2026-06-26). Defined the **walking skeleton** (`0005`) — the
concrete point to start coding so design stops looping. Pinned: boundary-first (prove worker-
thread isolation before thickening the contract); raw `node:worker_threads` now with **Watt as a
gated fast-follow** (spike validated Watt 3.57.0 — GO, with a thread-level-not-process-level
isolation caveat to reconcile into TENETS §5); **two packages** (`apps-sdk` / `apps-runtime`);
**JSON-RPC 2.0** host↔worker protocol with four ratified invariants; `.tgz` → `node:vm` eval →
brand check for loading; and an acceptance-tested slice-1 "done". v2 is a **full rewrite**, not
built on `packages/apps-engine` (v1); the server hosts both in parallel.

Round 4 set the six **guiding tenets** (`TENETS.md`) — added & scoped Isolation and Public-contract
stability; pinned the Observability/Auditing seam, re-scoped Permissioning's "static analysis" to
build-time tooling, committed Testability's test kit to the public contract; pinned
**Watt/Platformatic + worker-thread-per-app** as the isolation/orchestration direction. Round 3
designed the event-handler model (`0003`) and declarative filtering (`0004`); rounds 1–2 covered
entry (`0001`) and data-access reads (`0002`).

## NEXT ACTION: iteration 2 — the `ctx` round-trip

**Slice 1 is BUILT and green** (`0005` §6): `packages/apps-sdk` + `packages/apps-runtime`, 7
acceptance tests pass, dispatch round-trip measured at ~0.019 ms. The boundary is proven.

Per the iteration ladder (`0005` §7), **next is the `ctx` round-trip**: a minimal read-only
`ctx.rooms.findById` exposed to the handler, implemented as a **worker→host JSON-RPC request** over
the same channel — exercising the protocol's symmetry and the injected-`ctx` invariant
([0002]/[0003]). After that: the capability cage (patched `require` at the `node:vm` seam), Watt
adoption, the event catalogue + filtering, then the deferred pillars below.

The Watt spike lives on branch `spike/watt-discoverability` (`WATT-FINDINGS.md`) — reference, not a
dependency. The forks below (A–D) are deferred until the ladder reaches them.

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
