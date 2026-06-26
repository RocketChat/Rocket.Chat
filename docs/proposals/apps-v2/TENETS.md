# Apps v2 — Guiding tenets

Status: **accepted** (grilling round 4, 2026-06-26)
Scope: the cross-cutting principles that govern *every* v2 decision. Read this before any
design session — it is the lens for `0001`+. Where a tenet conflicts with a draft decision,
the tenet wins (or the conflict is surfaced and resolved explicitly, as several were below).

These are not a single decision; they are standing constraints. Six tenets: four carried in
from the project's framing (Testability, Observability, Auditing, Permissioning) and two added
and scoped in this round (Isolation & fault containment, Public-contract stability). Two
candidates were **declined as standalone tenets**: *host responsiveness* (folded into Isolation)
and *authoring ergonomics* (kept as the overall goal, not a peer tenet).

---

## 1. Testability

App developers must have no friction testing their app, and the engine internals must be easy
to test.

- **Internal testability is already bought** by locked architecture — the host-internal IoC
  container wires fakeable bridges, the bridge abstraction is swappable in engine tests, and the
  reconciler is a pure state machine. No further decision is owed here; it is a consequence of
  decisions already made.
- **The app-facing test kit is part of the version-stable public contract.** The SDK ships the
  doubles: an **in-memory `ctx`** (fake repositories), an **event-simulation harness** (fire
  `message:send:pre` at a handler, assert the returned `Decision`), and a way to **drive the
  `defineApp` factory under test**. Because it is public surface, it is bound by tenet 6
  (additive-only within a major). A best-effort kit on a separate cadence is rejected: a green
  test against a stale mock is false confidence, worse than no test.
- **Fidelity is enforced, not hoped.** A single conformance suite runs against *both* the real
  bridge-backed `ctx` and the in-memory `ctx`, so a mock repository cannot silently accept a
  write the real permission layer would reject.
- This is *why* [0003](0003-event-handler-model.md) §1 requires every `ctx` member to be
  independently bound (no `this`-coupling): it is what lets a developer pass a partial mock `ctx`
  into a handler.

Cost accepted: the kit is surface we cannot break within a major, and the fidelity suite is
ongoing maintenance.

## 2. Observability

Operational telemetry for **us / operators** — distinct in purpose, store, and SLA from Auditing
(tenet 3).

- Captures **metrics, distributed traces, and structured logs**. **May sample and drop** under
  load — that is acceptable for telemetry.
- Trace spans **may originate inside the app's worker**; tracing the host↔app boundary is an
  explicit goal.
- The **Watt** orchestration choice (worker-thread-per-app; see tenet 5) supplies Prometheus
  metrics, OpenTelemetry tracing, and pino structured logging largely as configuration rather
  than build-from-scratch, and its **inter-thread channel (ITC) is exactly the host↔app boundary**
  to instrument.
- **Never shares a sink with Auditing.**

## 3. Auditing

Whenever apps mutate Rocket.Chat data, the change is recorded — for **admins / compliance**.

- A **distinct subsystem** from Observability. They share *instrumentation points* (the same
  write / domain-op call site) but differ in **store, retention, integrity SLA, and trust origin**.
- The audit record is **durable, complete, and append-only / tamper-evident**. A dropped audit
  record is a compliance failure — auditing must never sample or drop the way telemetry may.
- **Captured host-side, at the bridge** that actually executes the mutation — **never inside the
  app's worker.** This couples to Isolation (tenet 5): the worker is both untrusted (it could
  forge or suppress its own record) and terminable (the reconciler can `worker.terminate()` it
  mid-operation, so a record living there is not durable). Capturing at the bridge makes the
  record simultaneously tamper-resistant and crash-durable.

## 4. Permissioning

Functionality is gated behind declared scopes, similar to OAuth scopes.

- **Coarse granularity:** scope ≈ `read` / `write` × entity type (design-doc §Reads/writes).
  Finer protection for sensitive fields is handled by exposing them only as **domain operations**
  excluded from generic patch.
- **Scopes are *declared* in the manifest.** The admin consents to the declared set *before* the
  app is eval'd; the runtime enforces calls against that declaration.
- **"Static analysis" means *build-time tooling*, never runtime introspection.** This was always
  the intent. A build-time tool (in the scaffold's typecheck/bundle step) **derives and validates**
  the declared scope list against the app's actual `ctx` / event usage, so the declaration cannot
  silently drift from behavior. The runtime never inspects code — consistent with
  [0001](0001-app-entry-and-transport-split.md), where the app is eval'd whole and code always
  executes.
- Eliminates v1's `implements`-array split-brain: one declaration, validated against the code.

## 5. Isolation & fault containment  *(added this round)*

**An app's misbehavior — of *any* kind: crash, uncaught exception, CPU / memory / event-loop
exhaustion, or merely being slow — is bounded to that app.**

- **Bidirectional:** the boundary protects the host *from* an app and apps *from each other*
  (separate heaps → no shared mutable state by default).
- **Resource and latency governance are part of this tenet, not a separate one.** Host
  responsiveness is this same boundary viewed from the latency side; that is why it was not
  adopted as a standalone tenet. A busy-loop in a `message:send:pre` handler must not stall the
  host.
- **Zero-trust / uniform.** Every app is untrusted code; the runtime enforces the same boundary
  regardless of provenance. Marketplace-vetted vs. privately-uploaded affects **admin consent UX
  and review only — never runtime enforcement.** There is no "trusted" fast path (that is exactly
  where security boundaries rot, and it keeps the tenet a single testable invariant).
- **Threat model is scoped to untrusted *JavaScript*.** Apps are pure-JS bundles with no ambient
  Node builtins and **no native addons** (a `.node` binary in the bundle is detectable and
  rejected at inspection; capability isolation is enforced by [0001](0001-app-entry-and-transport-split.md)'s
  controlled module graph). **OS-level sandboxing (constrained process / seccomp / container) is
  deferred** as deployment hardening that needs *no* app-facing contract change.
- **Implementation direction (kept in frame, not yet fully specified):** **Watt / Platformatic**
  as orchestrator, **each app in its own worker thread** — separate event loop (host stays
  responsive), own V8 heap with per-worker `resourceLimits` (bounded memory), worker-scoped
  uncaught-exception handling, and `worker.terminate()` as the reconciler's crash-loop kill switch.
- **Revises [0003](0003-event-handler-model.md) §5 wording:** `pre` is *local-transport-only*
  (worker-thread ITC, cheaper than subprocess IPC — the synchronous-veto latency budget is *more*
  comfortable). The transport excluded for `pre` is the **network** transport.

Residual risk stated honestly: a malicious **native / process-level** exploit is **not**
runtime-prevented in v2; that risk is mitigated by marketplace review and the no-native-addons
rule, not by enforcement.

## 6. Public-contract stability  *(added this round)*

The SDK is a third-party contract shipped through the marketplace; a silent break breaks every
installed app.

- **Backward compatibility within a major is *guaranteed*** — an app built against engine major
  `N` keeps running when the admin upgrades Rocket.Chat. Achieved by **additive-only evolution
  within a major**: never remove or repurpose an event, field, scope, or method; never tighten a
  signature. Deprecation is allowed (mark it) but the deprecated thing keeps working until the
  next major. Breaking changes accumulate for the next major.
- **Forward compatibility is *negotiated*, never promised.** An app declares its engine major
  plus the specific capabilities it requires (events, `ctx` services, scopes). The host advertises
  what it supports. A missing capability → the app **refuses to enable and tells the admin why**,
  and **never runs silently degraded** (same "loud failure, not silent disablement" principle as
  [0003](0003-event-handler-model.md) §5).
- **Entity types stay `@rocket.chat/core-typings`** (no bespoke types, no conversion layer —
  [0002](0002-data-access-and-read-queries.md) §4 holds) **but are re-exported through the apps
  package as the sole import surface.** Apps never import `core-typings` directly; their entire
  declared dependency surface is the apps package. The re-export is a type-level chokepoint (zero
  runtime cost) that lets the SDK narrow/alias a core type — or **absorb a `core-typings` breaking
  change within an engine major** — without apps changing an import.
- **`core-typings` is held to the same additive-only discipline** (fair game — it is a sister
  package under our org), and the apps package **pins the baseline `core-typings` version per
  engine major.**
- Scope of the guarantee: engine stability covers **SDK-owned surfaces** (authoring API, event
  names, decision verbs, operator vocabularies, projection field sets, scope vocabulary, manifest,
  and — per tenet 1 — the test kit). **Entity-shape stability is delegated** to `core-typings`'
  (now-disciplined) policy. The honest dent: the engine's within-major promise is only as strong
  as `core-typings`' own stability for the read surface — surfaced rather than pretended away.

---

## Tenet interactions worth remembering

- **Auditing ⟷ Isolation:** audit capture lives host-side at the bridge *because* the worker is
  untrusted and terminable (3 ↔ 5).
- **Observability ⟷ Isolation:** Watt/worker-threads is chosen for isolation *and* hands us
  metrics/traces/logs; the ITC is the boundary to trace (2 ↔ 5).
- **Testability ⟷ Stability:** the test kit is public surface, so it is bound by the
  backward-compat guarantee, and a conformance suite keeps the doubles faithful (1 ↔ 6).
- **Permissioning ⟷ entry model:** "static analysis" is build-time tooling precisely because
  [0001](0001-app-entry-and-transport-split.md) evals app code whole — no runtime introspection
  (4 ↔ 0001).
- **Stability ⟷ data access:** the re-export chokepoint and the SDK-owned projections are the
  mechanisms that keep the contract stable while still using core's types (6 ↔ 0002).
