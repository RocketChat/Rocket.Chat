# 0005 — Walking skeleton: the first buildable slice & iteration ladder

Status: **accepted** (grilling round 5, 2026-06-26)
Scope: the concrete point from which v2 implementation starts, so design converges into code
instead of more design. Defines slice 1 (a boundary-first walking skeleton), its acceptance
criteria, the named deferral gates, and the ordered iteration ladder after it.
Builds on [0001](0001-app-entry-and-transport-split.md) (`defineApp`/brand, transport-agnostic
definition), [0003](0003-event-handler-model.md) (event/`Decision`, fail-closed error model),
and [TENETS.md](TENETS.md) §5 (isolation). Greenfield: this does **not** build on the existing
`packages/apps-engine` (v1) — v2 is a full rewrite, incompatible with v1, and the server hosts
both in parallel.

## Why this decision exists

`0001`–`0004` are all **authoring-contract** decisions; every open fork in `NEXT-SESSION.md` is
*more contract design*. None exercises the load-bearing **runtime** constraint (worker-thread-
per-app isolation). To stop "talking forever," we commit to a thin end-to-end slice through the
real boundary and grow it.

## 1. Spine: prove the isolation boundary first, not the contract

Slice 1 is a **walking skeleton through a real worker thread** — the thinnest thing that *runs*:
`defineApp` → load the app in a worker → fire one event across the boundary → handler returns a
`Decision` → host observes it. `ctx` repositories, filtering, contributions, writes, permissions,
audit are stubbed or absent.

Rationale: the isolation boundary is the **least-reversible** constraint and the one no accepted
decision has pressure-tested. Retrofitting thread-boundary serialization onto an in-process API
is how you discover too late that the API doesn't survive the boundary. The contract (`0001`–
`0004`) is already well-specified on paper and is the safer half to grow incrementally afterward.

Rejected: **contract-first, in-process** (build `defineApp`/`AppBuilder`/types/test-kit with a
fake in-process runtime, defer the worker). Lower-risk to start, but defers the exact thing the
slice exists to de-risk.

## 2. Worker host: raw `node:worker_threads` now, Watt as a gated fast-follow

Slice 1 spawns a bare `node:worker_threads` worker and defines **our own** host↔app message
protocol over it. **Watt/Platformatic is the pinned orchestrator** (TENETS §5) but is *not* the
first bite.

- **Guardrail:** the host↔app protocol knows nothing about Watt — the runtime-side application of
  `0001` §4 ("the definition carries no transport"). Watt-vs-raw is then a host-plumbing swap, not
  a contract change.
- **Watt viability — validated (spike, branch `spike/watt-discoverability`, `WATT-FINDINGS.md`):**
  `@platformatic/runtime` 3.57.0 confirms programmatic boot (`create()`), worker-thread-per-app
  (`workers:1`), per-worker V8 `resourceLimits` (via `health.maxHeapTotal`…), individual
  stop/start/terminate with auto-restart, and config-only Prometheus/OTel/pino. **GO.**
- **Caveat that feeds back into TENETS §5:** Watt isolation is **thread-level, one shared OS
  process**. V8-heap overruns and clean JS crashes are contained and auto-recovered, but a
  **native crash or true process-level OOM in any app downs the whole host**. TENETS §5's claim
  that misbehavior of *"any kind … memory exhaustion"* is bounded per-app is therefore too strong;
  reconcile by softening that wording and pointing at the already-deferred OS-level sandboxing as
  the mitigation. (Does not affect the raw-worker skeleton.)

Rejected: **Watt as the literal first bite** — bigger first slice, front-loads framework-learning
ahead of the boundary risk the slice exists to attack.

## 3. Package topology: two packages

- **`packages/apps-sdk`** *(name placeholder)* — app-facing: `defineApp`, `AppBuilder`, event/
  payload types, decision verbs, `ctx` interfaces, later the test kit. **Zero host dependencies.**
- **`packages/apps-runtime`** *(name placeholder)* — host-facing: worker spawn, host side of the
  protocol, and the worker-bootstrap entry that runs *inside* the thread. Depends on `apps-sdk`
  (to validate the brand and drive the factory in the worker).

The SDK-vs-host split is `0001` §4 expressed as a **module-graph rule**: the app-facing package
*cannot* import host plumbing, enforced by the boundary rather than discipline; it is also what
later lets `connect`/remote reuse the SDK untouched. The host↔worker **protocol types live inside
`apps-runtime`** for now; extract a third `apps-protocol` package only when remote `connect` needs
the wire contract without the worker host (a real trigger, not speculative).

## 4. Protocol: JSON-RPC 2.0 over the worker channel

The host↔worker contract is **JSON-RPC 2.0**, carried over `postMessage`/structured-clone.

| Direction | JSON-RPC | Purpose |
|---|---|---|
| host → worker | request `load` | eval the bundle, run the factory, collect registrations |
| worker → host | result of `load` | `{ registrations: [{ event }] }` — the registration manifest |
| host → worker | request `dispatch` (`params: { event: { name, payload } }`) | fire one event; `id` correlates the reply |
| worker → host | result of `dispatch` | `decision = { kind:'continue' } \| { kind:'patch', patch } \| { kind:'prevent', reason }` |
| worker → host | **error** response to `dispatch` | a handler throw — our `error.code` space, `data` carries the stack |
| worker → host | notification `fault` (no `id`) | out-of-band failure with no in-flight request (plus raw worker `exit`/`error` underneath) |

**Four ratified invariants** — the things the slice actually proves, not just crosses:

1. **Correlated request/response** (JSON-RPC `id`). The `pre` veto needs the decision back; this is
   the round-trip latency the boundary-first spine exists to measure.
2. **The `event` object is assembled *inside* the worker; verbs produce plain data.** The host
   ships only `{ name, payload }`; the worker bootstrap wraps it with `0003`'s verbs
   (`continue`/`patch`/`prevent`) as *local* functions; the handler's return is **serializable
   `Decision` data**, the only thing that crosses back. This proves `0003`'s "verbs on `event`"
   survives a thread boundary *because* verbs are constructed worker-side and return data.
3. **Registration manifest crosses on `load`.** The list of subscribed events is what the host
   router, reconciler, and `0003` §5 transport-derivation need. Filters (`0004`) are out of scope
   for slice 1; the bare event list is in.
4. **A throw → JSON-RPC error response → host fail-closed.** Matches `0003` §2: any throw is a
   crash; for a `pre` event the host treats a crash as an implicit veto. The slice exercises this
   path, not only the happy path.

**Symmetry bonus (why JSON-RPC over an ad-hoc envelope):** the protocol is bidirectional. When
`ctx` lands (next iteration), a worker-side `ctx.rooms.findById(...)` becomes a **worker→host
JSON-RPC request** over the same channel. One protocol carries event dispatch (host→worker) and
capability calls (worker→host).

## 5. App loading: `.tgz` → `node:vm` eval → brand check

- Bundling/transpiling is **wholly out of scope** — a **separate tool** produces a single-file
  bundle packaged as a **`.tgz`**.
- The worker uses `fs` to read the `.tgz` → extract → read the entry bundle's contents → **`eval`
  via `node:vm`** (not `import()`). The bundler targets **CommonJS**; the worker evals via
  `vm.runInContext` with an injected `module`/`exports`/`require` and brand-checks
  `module.exports.default`. (CJS avoids `vm.SourceTextModule`'s experimental ESM path; we own the
  bundler's output target.)
- **`node:vm` is the seam** where the capability cage later attaches. Slice 1's vm context is
  **permissive** (real `require`/globals); we execute through the mechanism we will later tighten,
  instead of through `import()` we would have to rip out.
- **Brand validation stays in** — the `0001` enforcement that `defineApp` was used at all; trivial,
  and the worker is exactly where it runs.

## 6. Acceptance criteria (the literal "done" for slice 1)

Driven by an **in-package automated test** in `apps-runtime` (the acceptance gate), plus a tiny
standalone driver script for a manual latency sniff. **Not** wired into the Rocket.Chat server
(the reconciler / server integration is a later pillar). This runtime harness is **not** the
tenet-1 test kit (that is in-process, in-memory doubles for app authors; this drives a real
worker over the real protocol).

> **Slice 1 is done** when: `apps-sdk` exports a brand-checked `defineApp`; `apps-runtime` spawns
> a `node:vm`-eval worker from a `.tgz`, runs the factory, and over JSON-RPC 2.0 — returns the
> registration manifest on `load`, round-trips a `prevent` on `dispatch`, and fail-closes (error
> response) on a handler throw — all green in an automated test, with a standalone driver script
> for a manual latency read.

**Status: BUILT (2026-06-26).** `packages/apps-sdk` + `packages/apps-runtime` implement the above;
7 acceptance tests pass (`yarn workspace @rocket.chat/apps-runtime test`). Measured on the driver
(`yarn … driver`): one-time `load` ≈ 45 ms; **dispatch round-trip ≈ 0.019 ms/call** (1000 calls in
18.7 ms) across the worker-thread ITC — confirming the `pre` veto latency budget (0003 §5 / TENETS
§5) empirically, not just by assumption.

## 7. Iteration ladder (proposed order after slice 1)

Two axes thickened in interleave: **isolation hardening** and **contract thickening**.

1. **Slice 1 — boundary skeleton** (this doc). Boundary proven; everything else stubbed.
2. **`ctx` round-trip** — minimal read-only `ctx.rooms.findById` as a **worker→host JSON-RPC
   request**, proving the symmetric protocol and the injected-`ctx` invariant ([0002]/[0003]).
3. **Capability cage** *(named isolation gate)* — tighten the vm context: controlled module graph
   / patched `require`, deny ambient Node builtins, inject runtime-controlled SDK objects ([0001]).
4. **Watt adoption** *(named Watt gate)* — swap raw-worker host plumbing for Watt under the same
   protocol; gain `resourceLimits`, terminate/restart, and observability.
5. **Event catalogue + declarative filtering** — flesh out the `EventName` union, payload shapes,
   and host-side filtering ([0004]); route by the registration manifest.
6. **Then the deferred pillars** (per `NEXT-SESSION.md`): writes ([0002] §5 / [0003] path 2),
   contributions (pillar 2), reconciler + server integration, the public test kit, permissions,
   audit.

## Open / deferred

- Final package names (`apps-sdk` / `apps-runtime` are placeholders).
- The `apps-protocol` extraction trigger (remote `connect` needing the wire contract).
- Reconcile TENETS §5 wording with the thread-level-isolation finding (§2 caveat). **Deferred to
  the non-distant future.** Likely resolution sketched: run Watt inside a dedicated **host
  subprocess** (process-level fault boundary the host process otherwise lacks), with each app a
  worker thread *inside* that subprocess (Watt's per-app thread isolation + `resourceLimits`
  unchanged). Not decided; recorded so the discussion has a starting point.
- Everything in steps 2–6 of the ladder remains its own decision when reached.
