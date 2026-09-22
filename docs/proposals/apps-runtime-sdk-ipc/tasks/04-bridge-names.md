# 04 — Bridge names

**PR 0** · **ADR decision 12** · **Depends on:** [01](01-protocol-project-skeleton.md)

## Goal

Move the closed set of bridge getter names into `protocol/src/contracts/bridges/names.ts`. The
module holds plain string constants and a union type. It imports nothing, so both halves can
value-import it.

## Scope

`base-runtime/src/lib/bridges/bridgeCall.ts` declares a `BridgeName` union of 22 members today. The
host declares 28 getters on `AppBridges`, plus `AppResourceBridge` off that surface. The two sets
disagree, and nothing checks them against each other.

Three getters expose no `do*` method: `getListenerBridge`, `getInternalFederationBridge` and
`getExperimentalBridge`. `ExperimentalBridge` is an empty abstract class; `IListenerBridge` and
`IInternalFederationBridge` declare no `do*`. Decide whether the union includes them. The
recommendation is to exclude all three, because no `bridges:*` request can reach a bridge with no
`do*`.

`bridgeCall.ts` lists `getExperimentalBridge` in its union today. Dropping it is a deliberate
removal, so record it with the delta in step 4.

## Steps

1. Enumerate the getters of `AppBridges`, add `getAppResourceBridge`, and drop the three with no
   `do*`.
2. Write `names.ts` with a `const` array and a `BridgeName` union derived from it.
3. Repoint `bridgeCall.ts` at the new union and delete its local copy.
4. Record the delta in the PR description. Any name the host declares that `bridgeCall` did not is
   newly reachable from the subprocess at the type level; confirm that each one is intended.

## Done when

- [ ] `names.ts` imports nothing.
- [ ] `bridgeCall.ts` declares no `BridgeName` of its own.
- [ ] The set in `names.ts` matches the getters of `AppBridges` plus `AppResourceBridge`, minus the
      three with no `do*`. That leaves 26 names. A comment states the rule.
- [ ] `yarn typecheck:base-runtime` passes with no new errors.

## Size

~40 lines added, ~25 deleted.

## Follow-on

Task 17 narrows `bridgeCall`'s `method` parameter against these names. Task 14 keys the invoker
table on them. Neither can start before this task lands.
