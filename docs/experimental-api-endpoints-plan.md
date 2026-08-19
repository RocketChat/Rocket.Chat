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
/ `response` validators). The deprecated `.addRoute()` is **not exposed** on
`API.experimental` (its type omits the method) — new surface area should not be born on
the legacy registration path.

## Why this design (key findings from the current code)

- `createApi({ version })` turns the `version` string into the URL path segment, so a
  new instance with `version: 'experimental'` mounts at `/api/experimental/<name>`
  with zero router changes. See `apps/meteor/app/api/server/api.ts:33-77` and
  `ApiClass.ts:199`.
- The typed route methods `.get()/.post()/.put()/.delete()` are generic over
  `TSubPathPattern extends string` (`ApiClass.ts:669`) — they are **not** gated on
  `keyof Endpoints`. Routes accumulate *outward* into the instance's `TOperations`,
  read back by `ExtractApiClassEndpoints` (`ApiClass.ts:125-126`). So a separate
  experimental instance works *with* the type system.
- `PathPattern`, `Method`, `Path`, and the typed client are all derived from the
  `Endpoints` interface (`packages/rest-typings/src/index.ts:48-120`). Keeping
  experimental paths **out** of that interface keeps the stable client surface clean
  and forces explicit opt-in for experimental ones.
- The deprecation framework already writes `x-deprecation-*` response headers
  (`apps/meteor/app/lib/server/lib/deprecationWarningLogger.ts:13-19`). We mirror that
  pattern for an `x-experimental` / `Warning` signal.
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

**File:** `apps/meteor/app/api/server/api.ts`

1. In the `API` object literal (around line 69-77), add:
   ```ts
   experimental: createApi({ version: 'experimental', useDefaultAuth: true }),
   ```
   Place it between `v1` and `default`.
2. Add `experimental: APIClass<'/experimental'>;` to the `API` type annotation
   (around line 42-68) so it is typed.
3. If any `settings.watch(...)` callbacks need to refresh experimental routes the way
   they refresh `API.v1` (rate limiter reloads at lines 92-100, custom fields at
   79-90), add the matching `API.experimental?.…` calls. Optional for v1 of this work.

**Acceptance:** `API.experimental.get('ping', { ... }, handler)` compiles and serves at
`GET /api/experimental/ping`.

**Commit (1 of 5):** `feat(api): add experimental API instance`

### Step 2 — Mount it in the request pipeline

**File:** `apps/meteor/app/api/server/api.ts`, `startRestAPI` (lines 102-123)

1. Insert `.use(API.experimental.router)` into the chain, **before**
   `.use(API.default.router)` (line 121). Order matters: `default` is the catch-all.
2. Add a second `metricsMiddleware` block pointed at `API.experimental` so experimental
   traffic is measured. Metrics are the canary used later to decide whether an endpoint is
   ready for promotion to `/v1`. Because every block shares the same `/api` mount, each one
   needs a guard or a request is sampled more than once: the versioned blocks opt in via
   `basePathRegex`, and a catch-all block for `API.default` (`/api/info`, `/api/docs/json`,
   unmatched `/api/*`) opts out via `excludePathRegex`. Without that catch-all block the
   guards silently drop default-router traffic that used to be sampled.

**Acceptance:** experimental requests appear in the REST API Prometheus metrics with a
distinguishable path/label.

**Commit (2 of 5):** `feat(api): mount experimental router and metrics`

### Step 3 — Runtime "unstable" signal (mirror deprecation headers)

**New file:** `apps/meteor/app/api/server/middlewares/experimental.ts` (or colocate with
existing middlewares under `apps/meteor/app/api/server/middlewares/`).

1. Write a middleware that sets, on every response from the experimental instance:
   ```
   Warning: 299 - "experimental: endpoint is unstable and may change without notice"
   x-experimental: true
   ```
   `Warning: 299` is the RFC 7234 "miscellaneous persistent warning" code; `x-experimental`
   is the easy programmatic check. Model the header-writing on
   `writeDeprecationHeader` in `deprecationWarningLogger.ts:13-19`.
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
   `interface Endpoints extends ...` union (`index.ts:48-93`). This keeps `PathPattern`,
   `Method`, `Path`, and the stable typed client free of experimental paths.
3. Consumers who want typed experimental calls import `ExperimentalEndpoints`
   explicitly.

**Acceptance:** `import type { Endpoints } from '@rocket.chat/rest-typings'` does NOT
include experimental paths; `import type { ExperimentalEndpoints }` does.

**Commit (4 of 5):** `feat(rest-typings): add opt-in ExperimentalEndpoints`

### Step 5 — Guardrails (because it is a general mechanism)

1. **CI/lint guard:** add a check (script or eslint rule) asserting no path key present
   in `ExperimentalEndpoints` is also present in `Endpoints`. This catches accidental
   "promotion by copy-paste" that would silently create a semver obligation.
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
- [ ] CI guard fails if a path appears in both unions.
- [ ] Experimental requests show up in REST API metrics.

## Files touched (summary)

| File | Change |
| ---- | ------ |
| `apps/meteor/app/api/server/api.ts` | Add `experimental` instance, type entry, mount in `startRestAPI`, metrics regex |
| `apps/meteor/app/api/server/middlewares/experimental.ts` (new) | `x-experimental` / `Warning` header middleware |
| `packages/rest-typings/src/experimental/index.ts` (new) | `ExperimentalEndpoints` type, NOT merged into `Endpoints` |
| `packages/rest-typings/src/index.ts` | Export `ExperimentalEndpoints` |
| CI/lint config | Guard: no path in both `Endpoints` and `ExperimentalEndpoints` |
| docs / CONTRIBUTING | Document the contract + promotion path |
