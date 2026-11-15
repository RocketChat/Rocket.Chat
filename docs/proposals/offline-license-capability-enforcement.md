# Proposal: License Capability Enforcement via Branded Proofs

## Status

Draft — v2. Supersedes the earlier `CloudConnection`-only draft: the single-purpose connection capability is generalized into one proof mechanism that can guard any license-controlled capability, with the specific entitlement captured in the type.

## Problem

License enforcement today is a runtime side-condition the compiler knows nothing about, in two distinct places:

1. **Module entitlements.** `License.hasModule('auditing')` returns a `boolean`. Nothing ties that boolean to the code it guards: a feature entry point can be called without any check, a check for the *wrong* module still typechecks, and a refactor that moves code out from under its `if` block breaks enforcement silently.
2. **Offline (air-gapped) licenses.** When `license.information.offline` is true, the workspace must never initiate outbound connections to Rocket.Chat-owned endpoints. This is enforced by ~15 scattered `hasOfflineLicense()` checks (sync, marketplace, telemetry, push gateway, Gravatar). Any new feature can `import { serverFetch }` and ship a compliance violation no type error catches — and two real bugs of exactly this class were found during QA (a startup race in the usage report, and a stale verdict held by the push retry chain).

Both are the same underlying flaw: **the license check produces no evidence**. Nothing forces the check to happen, to happen for the right entitlement, or to happen at the right time.

## Proposed Solution

Make every license check return an unforgeable **proof value**, and make guarded code demand that proof in its signature. The pattern has three parts.

### 1. The lock — branded proof types

One brand mechanism, parameterized by what it proves. The generic parameter captures the exact literal passed to the checker, so proofs for different modules are not interchangeable:

```ts
// packages/core-typings/src/license/LicenseModule.ts (already exists)
export type InternalModuleName = (typeof CoreModules)[number];
export type ExternalModuleName = `${string}.${string}`;
export type LicenseModule = InternalModuleName | ExternalModuleName;

// ee/packages/license/src/proofs.ts (new)
declare const LicenseAuthorized: unique symbol; // NOT exported — unforgeable outside the package

/** Proof that the current license grants module M. */
export type ModuleProof<M extends LicenseModule> = {
	readonly [LicenseAuthorized]: M;
};

/** Proof that the current license permits outbound calls to Rocket.Chat-owned
 *  endpoints (absent when the license carries the offline flag). */
export type CloudEgressProof = {
	readonly [LicenseAuthorized]: 'cloud:egress';
};
```

The brand property is phantom — no such field exists at runtime. Proofs are frozen empty objects: zero allocation cost (a shared singleton per kind), zero serialization surface.

### 2. The keymaker — the license package owns construction

The only casts live inside `ee/packages/license`, next to the state they attest to:

```ts
// on LicenseManager — additive API; the existing boolean hasModule() stays
public proveModule<M extends LicenseModule>(module: M): ModuleProof<M> | undefined {
	return this.hasModule(module) ? (PROOF as ModuleProof<M>) : undefined;
}

public proveCloudEgress(): CloudEgressProof | undefined {
	return this.hasOfflineLicense() ? undefined : (PROOF as CloudEgressProof);
}
```

Design decisions:

- **Additive, not a signature change.** `hasModule(): boolean` has hundreds of call sites, including display logic and the REST surface the client consumes. Those keep the boolean. `proveModule()` is what *server-side entry points* migrate to.
- **Synchronous.** License state is in memory; proofs are free to acquire, which matters for the per-attempt rule below.
- **The offline gate is a proof family, not a module.** The offline flag has inverted semantics — it *revokes* a permission rather than granting a feature — but the same brand expresses it: `proveCloudEgress()` returns `undefined` exactly when the offline license forbids egress. A `proveCloudEgressOrThrow(message?)` variant throws the existing `CloudOfflineLicenseError` for interactive flows (registration, cloud login, billing), preserving today's error contract.

### 3. The guard — signatures demand proofs

```ts
// Module-gated feature entry point:
function initAuditing(proof: ModuleProof<'auditing'>) { ... }

initAuditing();          // ❌ compile error: expected 1 argument
const token = License.proveModule('auditing');
initAuditing(token);     // ❌ compile error: possibly undefined
if (token) {
	initAuditing(token); // ✅ narrowed to ModuleProof<'auditing'>
}

// Cloud I/O — the single fetch wrapper in apps/meteor/server/lib/cloud/cloudClient.ts:
export function cloudFetch(proof: CloudEgressProof, input: string, options?: ExtendedFetchOptions): Promise<Response>;
```

The developer experience does the enforcement: to call the function you need the token; the only way to get the token is the checker whose name and JSDoc explain the rule; the `| undefined` return forces an explicit decision about the denied case (skip silently vs. throw); and truthiness narrowing makes the happy path read naturally.

The proof is compile-time evidence, not the runtime gate itself: `cloudFetch` **re-validates `hasOfflineLicense()` immediately before dispatching** and drops the request if the license changed while the operation was in flight. The proof parameter guarantees the check can't be forgotten; the dispatch-time re-check guarantees it can't go stale.

Inner helpers that are only reachable from a guarded entry point take the proof as a parameter rather than re-checking — the signature documents "this function performs cloud I/O / module-X work", and the compiler walks the requirement up the call graph to wherever the proof is legitimately acquired.

## The staleness rule: acquire per attempt, never cache

Licenses change at runtime — swapped, upgraded, invalidated, or an offline license applied mid-flight. A proof is a **point-in-time verdict**, and both QA-discovered bugs in the offline work were staleness bugs:

- the usage report evaluated its gate at function entry, then spent seconds generating statistics before fetching (the verdict predated license application);
- the push gateway retry chain captured its decision in `setTimeout` closures that outlived a license change.

Rules, to be stated in the proofs' JSDoc and enforced in review:

1. Acquire the proof at the top of each operation *attempt*; retry closures re-acquire on every attempt (the factories are sync — this costs nothing).
2. Never store a proof on a class field, module scope, or queue payload.
3. A proof is not a subscription. Long-lived module features (services started when a module is granted) must still use the existing lifecycle events — `License.onValidFeature` / `onInvalidFeature` / `onToggledFeature` — for startup and teardown. Proofs guard entry points; events manage lifetimes.
4. Proofs are server-only and must never cross the API boundary; the client keeps boolean checks driven by `licenses.info`.

## Migration

1. **Cloud egress first** (the offline license feature, already enforced at runtime in ~27 files): introduce `proveCloudEgress()` and `cloudFetch(proof, ...)`, then convert the four established patterns — interactive flows (`OrThrow`), background jobs (`undefined` → keep side effects, skip), the marketplace client (proof acquired per `fetch()` call, never stored on the instance), and retry closures (per-attempt). The existing `hasOfflineLicense()` helpers remain for behavior gates that don't perform I/O themselves (`shouldUseGateway()`, cron-body skips, Gravatar suggestion filtering).
2. **Module proofs opportunistically**: as EE features are touched, their server entry points gain `ModuleProof<'...'>` parameters, starting with features whose checks have historically drifted from their code. No big-bang rewrite; the boolean API keeps working throughout.

## Limitations

TypeScript cannot forbid an import: a new file can still `import { serverFetch }` directly and hardcode an endpoint, and `{} as ModuleProof<'auditing'>` defeats the brand (both are greppable and glaring in review — the cast requires importing a type whose only documented constructor is the license manager). What the type system guarantees is narrower but real: **code routed through proof-demanding signatures cannot skip the check, cannot check the wrong module, and must handle the denied case explicitly** — and violations shrink to two obvious review signals: a raw `serverFetch` near a Rocket.Chat domain, or a forged cast.

A directory-scoped lint rule (`no-restricted-imports` on `@rocket.chat/server-fetch` with `cloudClient.ts` exempt) or a CI grep could close the import hole; both were considered and deliberately left out in favor of a types-only approach.
