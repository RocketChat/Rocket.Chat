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

The plan says "the ~30 methods accessors actually emit" against "the remaining ~120". The
measurement inverts the ratio.

| Quantity | Count |
| --- | --- |
| Reachable `(getter, do*)` pairs | 149 |
| Pairs an accessor emits | **114** |
| Emitted pairs that send `'APP_ID'` | **108** |
| Emitted pairs that send no sentinel | 6 |
| Pairs with no traffic | 35 |

The split criterion in the plan still holds. Its arithmetic does not. This task carries 114
entries, not 30.

## Sub-batches

114 entries in one PR is not reviewable. The `Partial` table type makes any prefix independently
green, so split at bridge boundaries. Suggested batches, largest first:

| Batch | Bridges | Entries |
| --- | --- | --- |
| a | `getLivechatBridge` | 20 |
| b | `getRoomBridge` | 16 |
| c | `getAppResourceBridge` | 15 |
| d | `getUserBridge` | 12 |
| e | `getMessageBridge`, `getPersistenceBridge` | 17 |
| f | `getServerSettingBridge`, `getOAuthAppsBridge`, `getEnvironmentalVariableBridge` | 14 |
| g | the remaining 11 bridges, 1 to 3 entries each | 20 |

Batch g covers `getUploadBridge`, `getModerationBridge`, `getContactBridge`,
`getVideoConferenceBridge`, `getSchedulerBridge`, `getRoleBridge`, `getThreadBridge`,
`getInternalBridge`, `getHttpBridge`, `getEmailBridge`, `getCloudWorkspaceBridge`.

Take batch g first. It covers the three identity buckets and the widest variety of param shapes, so
it settles the entry idiom before the bulk batches copy it.

## Steps, per batch

1. Write the TypeBox schema per method. Keep it shallow: arity and scalar types.
2. Write the invoker thunk. Decide the identity bucket per method and state it in a comment when it
   is not caller identity.
3. Delete the `'APP_ID'` argument from every `bridgeCall` at that bridge's accessor sites.
4. Update the accessor tests that assert the emitted params. At least
   `accessors/environment/tests/environment.test.ts` asserts `'APP_ID'` in 6 cases.
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

- [ ] Every one of the 114 emitted pairs has a table entry.
- [ ] `git grep "'APP_ID'"` matches nothing in `base-runtime/src`, tests included.
- [ ] The three app-supplied-appId methods still forward the wire value, and a test proves an app
      can still report a message that belongs to another app.
- [ ] Task 15's coverage report lists 35 un-exercised names, and no fewer.
- [ ] The table is still typed `Partial`. The fallback still exists.

## Size

114 entries. ~700 lines, mostly near-identical. Plus ~108 call-site edits in `base-runtime`.
