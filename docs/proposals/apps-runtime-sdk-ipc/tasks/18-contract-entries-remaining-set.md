# 18 — Entries for the remaining set

**PR 6** · **ADR decisions 13, 14, 16** · **Depends on:** [16](16-contract-entries-emitted-set.md)

## Goal

Complete the invoker table. Flip its type from `Partial` to `Required`. Delete the legacy fallback
and the global `params.map(v => v === 'APP_ID' ? realId : v)`.

Review this task for **data**. The entries are near-identical and skimmable. The mechanism landed
in task 14, and the idiom landed in task 16.

## The remaining set

28 `(getter, do*)` pairs have no accessor traffic today, over 13 bridges. They send nothing, so no
sentinel has to be removed with them.

| Bridge | Entries | Methods |
| --- | --- | --- |
| `getCommandBridge` | 6 | `doRegisterCommand`, `doUnregisterCommand`, `doEnableCommand`, `doDisableCommand`, `doModifyCommand`, `doDoesCommandExist` |
| `getAppActivationBridge` | 5 | `doAppAdded`, `doAppRemoved`, `doAppUpdated`, `doAppStatusChanged`, `doActionsChanged` |
| `getOutboundMessageBridge` | 3 | `doRegisterPhoneProvider`, `doRegisterEmailProvider`, `doUnRegisterProvider` |
| `getApiBridge` | 2 | `doRegisterApi`, `doUnregisterApis` |
| `getInternalBridge` | 2 | `doGetUsernamesOfRoomByIdSync`, `doGetWorkspacePublicKey` |
| `getLivechatBridge` | 2 | `doGetMessageById`, `doUpdateMessage` |
| `getVideoConferenceBridge` | 2 | `doRegisterProvider`, `doUnRegisterProvider` |
| `getAppDetailChangesBridge` | 1 | `doOnAppSettingsChange` |
| `getOAuthAppsBridge` | 1 | `doPurge` |
| `getPersistenceBridge` | 1 | `doPurge` |
| `getSchedulerBridge` | 1 | `doRegisterProcessors` |
| `getServerSettingBridge` | 1 | `doGetAll` |
| `getUserBridge` | 1 | `doRemove` |

Five getters have no traffic at all — `getApiBridge`, `getAppActivationBridge`,
`getAppDetailChangesBridge`, `getCommandBridge`, `getOutboundMessageBridge`. Their entries are
schema-only: declared and typechecked, never validated against real traffic. Task 15's coverage
report names them on every run.

`getRoomBridge`, `getRoleBridge`, `getThreadBridge` and `getUiInteractionBridge` are **not** here.
Accessors emit every `do*` those four declare, so task 16 covers them in full.

## Why `Required` comes last

The compile-time exhaustiveness check cannot exist until the table is complete. That staging is the
only reason tasks 16 and 18 are separable; without it they are one 149-entry change.

## Steps

1. Write the 28 entries. Follow the idiom task 16 established.
2. Flip the table type from `Partial<Record<BridgeMethodKey, Entry>>` to
   `Record<BridgeMethodKey, Entry>`.
3. Delete the fallback branch in `handleBridgeMessage`.
4. Delete the `params.map(v => v === 'APP_ID' ? realId : v)` line, and the two comment lines above
   it that ask whether the protocol should expect the placeholder.
5. Confirm that `BridgeMethodKey` covers `AppResourceBridge`, which is not on the `AppBridges`
   surface.

## Done when

- [ ] The table has 149 entries, and the type is `Required`.
- [ ] A new `public do*` on any bridge fails `typecheck:default` until it gets an entry. A probe
      proves it; delete the probe before the PR lands.
- [ ] `git grep "APP_ID"` matches nothing in `packages/apps`, docs excepted.
- [ ] `handleBridgeMessage` has no fallback path, and an unknown key yields `-32601`.
- [ ] Task 15's coverage report still lists 28 un-exercised names, which is now the expected state
      rather than a gap to close.

## Size

28 entries, ~170 lines. ~20 lines deleted.
