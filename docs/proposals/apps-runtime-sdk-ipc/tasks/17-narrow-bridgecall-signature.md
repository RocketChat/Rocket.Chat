# 17 — Narrow the `bridgeCall` signature

**PR 5** · **ADR decision 16** · **Depends on:** [04](04-bridge-names.md)

## Goal

Narrow `bridgeCall`'s `method` parameter from `` `do${string}` `` to the closed per-bridge union.
An accessor that calls a nonexistent bridge method then fails `typecheck:base-runtime` at compile
time.

## Why this subsumes the reflection test

The proposal originally asked for a drift test built on `Object.getOwnPropertyNames` and
`Function.prototype.length`. That test is strictly weaker: `Function.prototype.length` under-counts
optional params, and reports `doGetAppUser(appId?)` as arity 0. Two compile-time checks replace it:

- This task — an accessor cannot name a method that does not exist.
- Task 18 — a `do*` with no table entry is a compile error in `typecheck:default`.

## The constraint

`bridgeCall` lives in `base-runtime`, which must not import `AppBridges`. So the per-bridge method
union has to come from `protocol/src/contracts/bridges/names.ts`, not from the host's types. Extend
`names.ts` from a flat bridge-name union to a map of bridge name to its method names.

That map is a second source of truth against the host's classes. Task 18's `Required` table is what
closes the loop: a host method with no entry fails to compile, and an entry with no host method
fails to compile.

## Scope

| File | Change |
| --- | --- |
| `protocol/src/contracts/bridges/names.ts` | grows from 22 names to a bridge→methods map, 149 pairs |
| `base-runtime/src/lib/bridges/bridgeCall.ts` | `method` narrows; the function becomes generic over `BridgeName` |
| 39 accessor files | no change expected; any that fails typecheck names a method the host does not have |

## Steps

1. Extend `names.ts` with a `const` map of bridge name to a readonly tuple of method names.
2. Make `bridgeCall` generic over the bridge, and type `method` as that bridge's member union.
3. Run `yarn typecheck:base-runtime`. Every error names a real mismatch; do not cast past one.
4. Record each mismatch in the PR description.

## Done when

- [ ] `bridgeCall`'s signature has no `` `do${string}` ``.
- [ ] An accessor that calls `'doNotAThing'` fails `typecheck:base-runtime`.
- [ ] An accessor that calls a method on the wrong bridge fails `typecheck:base-runtime`.
- [ ] `names.ts` imports nothing.
- [ ] All 151 existing `bridgeCall` sites typecheck, or every exception is recorded.

## Size

~150 lines of names. ~20 lines of signature. Type-level only.
