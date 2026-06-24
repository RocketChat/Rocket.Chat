# Steering notes — pick up here next session

Last session: grilling round 2 (2026-06-24). Designed the **target authoring SDK shape**,
stepping back from the runtime/execution questions in `../apps-v2-sdk-design.md`.

## How to resume

1. Read, in order: `README.md` (index) → `0001` → `0002`. They are self-contained.
2. For full background, the current-state analysis is in `../apps-current-architecture/`
   (01 app-facing SDK, 02 engine/state, 03 runtime/bridges) and the running design context is
   `../apps-v2-sdk-design.md`.
3. Resume the grilling skill (`/grilling`) on the next open pillar below.

## The four-pillar map (this is the spine of the SDK design)

- [x] **Pillar 1 — Startup / entry** → decided in `0001`.
- [ ] **Pillar 2 — Contributions** (the `extendConfiguration` replacement). *Not started.*
- [ ] **Pillar 3 — Data access** → decided in `0002` (reads). **Writes still open.**
- [ ] **Pillar 4 — Event handlers**. *Not started.*

## Recommended next order & the specific forks waiting

### A. Pillar 4 — Event handlers (do this next)
Most of the model is already pre-decided in `../apps-v2-sdk-design.md` §"Event model"
(pre/post timing, order-agnostic pipeline, first-`prevent` short-circuits, no middleware/
`next`). What's left is the **API surface**, and it depends on `ctx` from `0002`:
- **`Decision` constructors** — exact shape of `ctx.continue` / `ctx.prevent({message}|{i18n})`
  / `ctx.patch(subject)`. Are they ctx methods, returned sentinels, or thrown?
- **Two write paths** (design-doc open Q3): patch-the-subject (`return ctx.patch(message)`,
  rides the action into core persistence, failure aborts the action) **vs** side-effect writes
  on other entities (`ctx.rooms.update(...)`, separate atomicity/permission, failure does not
  abort). Confirm the seam is modeled separately and how it surfaces in the handler signature.
- **`pre` vs `post` syntax** — `app.on('message:pre', …)` string namespace (locked in
  design doc) — pin the full event-name catalogue mapping to v1's families
  (messages/rooms/users/livechat/uploads/uikit; see `../apps-current-architecture/01` §3.3).
- **Permission edges** (design-doc open Q7): does subscribing to `message:pre` require
  `read:messages`? Is `prevent` itself a declared capability an admin must consent to?

### B. Pillar 2 — Contributions
- Declarative descriptor vs imperative registration for slashcommands / endpoints / settings /
  scheduler / UI buttons (v1 list in `../apps-current-architecture/01` §4).
- Everything hangs off `app` per the locked decision (design-doc §"App authoring surface").
  Confirm no contribution genuinely needs the `Engine`/host control plane (design-doc open Q1).
- Does the manifest carry a contribution + permission summary for the **admin install screen**,
  derived/validated against the factory? (Tension: avoid v1's `implements`-array split-brain.)
- Settings: reuse v1's `SettingType` set? Where setting *values* are read (we put `settings` on
  `AppSetupContext` in `0001`).

### C. Finish Pillar 3 — Write semantics (deferred in `0002` §5)
- Batched/unit-of-work `update`; flush timing (implicit at handler end vs `await ctx.commit()`).
- Read-your-writes overlay vs "deferred writes, don't read them back".
- Optimistic concurrency on `update` (`_updatedAt`/version → `ConflictError`) vs last-write-wins.
- **Writable-projection owner/location** (shared governance with the queryable projection from
  `0002` §2) — design-doc open Q4.
- **Reference resolution API** — how an app resolves `message.u` → full user on demand.

### D. Cross-cutting, after the pillars
- `PermissionDeniedError` type across the boundary (typed, carries missing scope).
- Reconciler state machine (single-instance): states/transitions/persistence (design-doc).
- Reconcile `../apps-v2-sdk-design.md` "Open questions" list against `0001`/`0002` (Q4 partial,
  Q6 keyset are now decided) — currently left untouched by request.

## Conventions established
- One decision per file, `NNNN-kebab-title.md`, status line + scope + "Builds on" links.
- Keep `README.md` table in sync when adding a decision.
- Record decisions in `docs/proposals/apps-v2/`; the running design doc stays as-is unless asked.
