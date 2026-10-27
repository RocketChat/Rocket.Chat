# Plan: Experimental REST API endpoints

## Goal

Allow REST endpoints to ship to production but **change or be removed in any release
without a major-version bump**. The mechanism must be general-purpose (any team can
use it), not specific to one feature.

## The contract

> Endpoints under `/api/experimental/...` are unstable. They may change shape or be
> removed in any release, without notice and without a deprecation cycle. No semver
> promise attaches to this namespace.

The namespace **is** the contract. A caller hitting `/api/experimental/*` has opted
into instability by the URL alone. `/v1` keeps its implicit semver-stability promise,
untouched.

**Only the new typed API is allowed on experimental routes.** Endpoints must be
registered with `.get()` / `.post()` / `.put()` / `.delete()` (with AJV `body` / `query`
/ `response` validators). The deprecated `.addRoute()` must not be used — new surface
area should not be born on the legacy registration path. This is a documented rule, not a
compiler-enforced one: `API.experimental` is a plain `APIClass`, and `.addRoute()` already
carries `@deprecated` everywhere it is reachable.

## Why this design (key findings from the current code)

- `createApi({ version })` turns the `version` string into the URL path segment, so a
  new instance with `version: 'experimental'` mounts at `/api/experimental/<name>`
  without changing any router internals — the new router still has to be mounted in
  `startRestAPI` (see Step 2). See `apps/meteor/server/api/api.ts` (the `API` object and
  `createApi`) and `apps/meteor/server/api/ApiClass.ts` (`apiPath` composition in the
  `APIClass` constructor).
- The typed route methods `.get()/.post()/.put()/.delete()` are generic over
  `TSubPathPattern extends string` (`ApiClass.ts`, `APIClass.method()` and its
  per-verb wrappers) — they are **not** gated on `keyof Endpoints`. Routes accumulate
  *outward* into the instance's `TOperations`, read back by `ExtractApiClassEndpoints`
  (`apps/meteor/server/api/api.ts`). So a separate experimental instance works *with*
  the type system.
- `PathPattern`, `Method`, `Path`, and the typed client are all derived from the
  `Endpoints` interface (`packages/rest-typings/src/index.ts`). Keeping
  experimental paths **out** of that interface keeps the stable client surface clean
  and forces explicit opt-in for experimental ones.
- The deprecation framework already writes `x-deprecation-*` response headers
  (`writeDeprecationHeader` in `apps/meteor/server/lib/deprecationWarningLogger.ts`). We
  mirror that pattern for an `x-experimental` / `Warning` signal.
- Auth, permissions, rate limiting, CORS, AJV validation, and metrics all come from
  `createApi` + the middleware chain in `startRestAPI` — experimental endpoints get
  them for free.

---

## Commit constraint

**Each implementation step below ships as exactly one commit.** No step is split across
multiple commits, and no commit spans more than one step. This keeps the history
bisectable, makes each phase independently reviewable and revertable, and maps the PR
review 1:1 onto the plan.

- A step's commit must leave the tree in a compiling, lint-clean state (`yarn lint
  --quiet` passes) — partial work is squashed before committing.
- Commit message subject names the step, e.g. `feat(api): add experimental API instance
  (step 1)`.
- If a step turns out to require a prerequisite not in the plan, add it to that step's
  single commit rather than introducing an out-of-band commit.

## Implementation steps

### Step 1 — Add the `experimental` API instance

**File:** `apps/meteor/server/api/api.ts`

1. In the `API` object literal, add:
   ```ts
   experimental: createApi({ version: 'experimental', useDefaultAuth: true }),
   ```
   Place it between `v1` and `default`.
2. Add an `experimental` entry to the `API` type annotation so it is typed:
   `APIClass<'/experimental'>`. Hiding `addRoute()` from that type was considered and
   dropped: the typed methods return `this`, so a restricted surface only holds until the
   first chained registration, and closing that hole means duplicating every typed
   signature and widening the route-extraction types that pattern-match `APIClass`. Not
   worth it for a rule `@deprecated` already signals.
3. Refreshing experimental routes when settings change is a **required** parity
   condition, not an optional extra — the contract above promises experimental
   endpoints get rate limiting "for free", which only holds if the refresh callbacks
   cover them. The `settings.watch(...)` callbacks in this file that must also update
   `API.experimental`:
   - `API_Enable_Rate_Limiter_Limit_Time_Default` → `reloadRoutesToRefreshRateLimiter()`
   - `API_Enable_Rate_Limiter_Limit_Calls_Default` → `reloadRoutesToRefreshRateLimiter()`
   - `Accounts_CustomFields` → `setLimitedCustomFields()`

   **Known gap:** the rate-limiter watchers are at parity; the `Accounts_CustomFields`
   watcher still updates `API.v1` only. That is currently harmless — no experimental
   endpoint returns user objects — but it must be closed before one does.

**Acceptance:** `API.experimental.get('ping', { ... }, handler)` compiles and serves at
`GET /api/experimental/ping`.

**Commit (1 of 5):** `feat(api): add experimental API instance`

### Step 2 — Mount it in the request pipeline

**File:** `apps/meteor/server/api/api.ts`, `startRestAPI`

1. Insert `.use(API.experimental.router)` into the chain, **before**
   `.use(API.default.router)`. Order matters: `default` is the catch-all.
2. Add a second `metricsMiddleware` block pointed at `API.experimental` so experimental
   traffic is measured. Metrics are the canary used later to decide whether an endpoint is
   ready for promotion to `/v1`. Because every block shares the same `/api` mount, each one
   needs a guard or a request is sampled more than once: the versioned blocks opt in via
   `basePathRegex`, and a catch-all block for `API.default` (`/api/info`, `/api/docs/json`,
   unmatched `/api/*`) opts out via `excludePathRegex`. Without that catch-all block the
   guards silently drop default-router traffic that used to be sampled.

**Acceptance:** experimental requests appear in the REST API Prometheus metrics labelled
`version=experimental` — specifically that label, not merely a distinguishable one. A
change that only adjusted the path regex while leaving experimental traffic under the
`v1` version label does not satisfy this. `/api/v1/*` and default-router traffic each
still record exactly one sample under their own label.

**Commit (2 of 5):** `feat(api): mount experimental router and metrics`

### Step 3 — Runtime "unstable" signal (mirror deprecation headers)

**New file:** `apps/meteor/server/api/v1/middlewares/experimental.ts`, colocated with the
existing middlewares.

1. Write a middleware that sets, on every response from the experimental instance:
   ```
   Warning: 299 - "experimental: endpoint is unstable and may change without notice"
   x-experimental: true
   ```
   `x-experimental: true` is the **supported programmatic signal** — clients should detect
   experimental responses with it. `Warning: 299` is a legacy compatibility signal only:
   warn code 299 came from RFC 7234, which RFC 9111 has since obsoleted along with the
   `Warning` header itself, so modern clients are not expected to generate or interpret
   it. It is emitted for the benefit of tooling that still surfaces it, and may be dropped
   without it being a breaking change. Model the header-writing on `writeDeprecationHeader`
   in `apps/meteor/server/lib/deprecationWarningLogger.ts`.
2. Register the middleware on the shared `/api` mount in `startRestAPI`, **ahead of**
   `cors`, scoped to `/api/experimental` by a `basePathRegex` (same shape as the metrics
   middleware guard). It cannot live on `API.experimental.router`: `cors` answers rejected
   preflights with 403/405 without calling `next()`, so a router-scoped middleware would
   never run for those responses.

**Acceptance:** every `/api/experimental/*` response carries both headers — including 404s
and CORS preflight rejections; `/api/v1/*` responses do not.

**Commit (3 of 5):** `feat(api): add experimental unstable-signal middleware`

### Step 4 — Separate, opt-in SDK typings

**File:** `packages/rest-typings/src/index.ts` (+ a new file for the declarations)

1. Create `packages/rest-typings/src/experimental/index.ts` (new folder) and declare:
   ```ts
   export type ExperimentalEndpoints = {
     '/experimental/<name>': {
       GET: (params: ...) => ...;
     };
     // ...
   };
   ```
   Follow the existing per-resource endpoint style (e.g.
   `packages/rest-typings/src/v1/channels/channels.ts`).
2. Export `ExperimentalEndpoints` from the package root, but **do NOT** add it to the
   `interface Endpoints extends ...` union. This keeps `PathPattern`,
   `Method`, `Path`, and the stable typed client free of experimental paths.
3. Consumers who want typed experimental calls import `ExperimentalEndpoints`
   explicitly.

**Acceptance:** `import type { Endpoints } from '@rocket.chat/rest-typings'` does NOT
include experimental paths; `import type { ExperimentalEndpoints }` does.

**Commit (4 of 5):** `feat(rest-typings): add opt-in ExperimentalEndpoints`

### Step 5 — Guardrails (because it is a general mechanism)

1. **No path in both unions.** A type-level CI guard for this was considered and dropped:
   union keys are full paths, so `/experimental/x` and `/v1/x` never collide, and the
   transition window described below does not produce a collision either. Keep the rule in
   the docs instead — promotion means *moving* the declaration to a stable `*Endpoints`
   type, not leaving a copy behind.
2. **Promotion path:** document that stabilizing an endpoint means copying it to `/v1`
   (optionally keeping the experimental path forwarding for a transition window).
   Removal needs no deprecation cycle — but log removals for courtesy.
3. **Docs/CONTRIBUTING note:** state the no-semver guarantee and how to add an
   experimental endpoint, so the mechanism is discoverable.
4. **OpenAPI/doc generation:** decide deliberately whether generated API docs scan only
   `Endpoints` (experimental endpoints hidden — probably desirable) or also
   `ExperimentalEndpoints`.

**Commit (5 of 5):** `chore(api): add experimental guardrails and docs`

---

## Test checklist

- [ ] `GET /api/experimental/<name>` resolves and returns the `x-experimental` + `Warning` headers.
- [ ] `/api/v1/*` responses are unchanged (no experimental headers).
- [ ] Auth / permissions / rate limiting enforced on an experimental route exactly as on `/v1`.
- [ ] `Endpoints` type does not include experimental paths; `ExperimentalEndpoints` does.
- [ ] Experimental requests show up in REST API metrics.

## Files touched (summary)

| File | Change |
| ---- | ------ |
| `apps/meteor/server/api/api.ts` | Add `experimental` instance, type entry, mount in `startRestAPI`, metrics blocks |
| `apps/meteor/server/api/v1/middlewares/experimental.ts` (new) | `x-experimental` / `Warning` header middleware |
| `apps/meteor/server/api/v1/middlewares/metrics.ts` | `basePathRegex` / `excludePathRegex` sampling guards |
| `packages/rest-typings/src/experimental/index.ts` (new) | `ExperimentalEndpoints` type, NOT merged into `Endpoints` |
| `packages/rest-typings/src/index.ts` | Export `ExperimentalEndpoints` |
| docs / CONTRIBUTING | Document the contract + promotion path |
