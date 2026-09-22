# 16 — Entries for the emitted set

**PR 5** · **ADR decisions 13, 14** · **Depends on:** [14](14-invoker-table-mechanism.md), [15](15-contract-round-trip-test.md)

## Goal

Write a contract entry — schema plus invoker thunk — for every `(getter, do*)` pair that an
accessor emits today. Delete the `'APP_ID'` sentinel at each of those call sites in the same
change.

## Why the sentinel removal rides along

Identity removal must be simultaneous per method. If a thunk injects `appId` while the accessor
still sends `'APP_ID'`, the arity breaks. So the sentinel-sending set defines this task's scope,
and the set with no traffic goes to task 18.

## The measurement, and a correction to the plan

The plan first said "the ~30 methods accessors actually emit" against "the remaining ~120". The
measurement inverts the ratio, and [../README.md](../README.md) now carries the corrected
figures.

| Quantity | Count |
| --- | --- |
| Reachable `(getter, do*)` pairs | 149 |
| Pairs an accessor emits | **121** |
| Emitted pairs that send `'APP_ID'` | **115** |
| Emitted pairs that send no sentinel | 6 |
| Pairs with no traffic | 28 |

The split criterion in the plan still holds. Its arithmetic does not. This task carries 121
entries, not 30.

## Sub-batches

121 entries in one PR is not reviewable. The `Partial` table type makes any prefix independently
green, so split at bridge boundaries. Suggested batches, largest first:

| Batch | Bridges | Entries |
| --- | --- | --- |
| a | `getLivechatBridge` | 21 |
| b | `getRoomBridge` | 18 |
| c | `getAppResourceBridge` | 15 |
| d | `getUserBridge` | 12 |
| e | `getMessageBridge`, `getPersistenceBridge` | 17 |
| f | `getServerSettingBridge`, `getOAuthAppsBridge`, `getEnvironmentalVariableBridge` | 14 |
| g | the remaining 12 bridges, 1 to 4 entries each | 24 |

Batch g covers `getSchedulerBridge` (4), `getUploadBridge`, `getModerationBridge`,
`getContactBridge`, `getVideoConferenceBridge` (3 each), `getRoleBridge` (2), and
`getThreadBridge`, `getInternalBridge`, `getHttpBridge`, `getEmailBridge`,
`getCloudWorkspaceBridge`, `getUiInteractionBridge` (1 each).

Take batch g first. It covers the three identity buckets and the widest variety of param shapes, so
it settles the entry idiom before the bulk batches copy it.

## Steps, per batch

1. Write the TypeBox schema per method. Keep it shallow: arity and scalar types.
2. Write the invoker thunk. Decide the identity bucket per method and state it in a comment when it
   is not caller identity.
3. Delete the `'APP_ID'` argument from every `bridgeCall` at that bridge's accessor sites.
4. Update the accessor tests that assert the emitted params. `base-runtime/src` holds 78 `'APP_ID'`
   occurrences under `tests/`, including 5 in `accessors/environment/tests/environment.test.ts`.
5. Confirm that the round-trip test from task 15 now exercises those keys.

## Identity buckets to get right

| Method | Bucket |
| --- | --- |
| `getHttpBridge:doCall` | nested — the thunk spreads `appId` into the payload, and the schema forbids the key |
| `getModerationBridge:doReport`, `doDismissReportsBy*` | app-supplied argument — forward from the wire |
| `getUserBridge:doDeleteUsersCreatedByApp` | app-supplied argument — forward from the wire |
| `getUserBridge:doGetAppUser` | caller identity, optional param |
| everything else in this set | caller identity |

`accessors/http.ts` already carries a comment that says the sentinel cannot reach a nested param.
Delete that comment with the entry that fixes the cause.

## Done when

- [ ] Every one of the 121 emitted pairs has a table entry.
- [ ] `git grep "'APP_ID'"` matches nothing in `base-runtime/src`, tests included.
- [ ] The three app-supplied-appId methods still forward the wire value, and a test proves an app
      can still report a message that belongs to another app.
- [ ] Task 15's coverage report lists 28 un-exercised names, and no fewer.
- [ ] The table is still typed `Partial`. The fallback still exists.

## Size

121 entries. ~750 lines, mostly near-identical. Plus 149 sentinel-argument deletions across 37
accessor files, and 78 more in their tests.
