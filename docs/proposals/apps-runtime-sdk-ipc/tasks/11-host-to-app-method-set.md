# 11 — Host→app method set

**PR 4** · **ADR decisions 7, 9** · **Depends on:** [01](01-protocol-project-skeleton.md), [07](07-move-jsonrpc-surface.md)

## Goal

Declare the closed host→app method set in `protocol/src/contracts/methods.ts`. Each entry carries a
`kind` (`request` or `notification`) and an arity. Declare the set only; task 13 rewrites the
dispatch that consumes it.

## Why `kind` is per entry

Request-versus-notification is a property of the method, not of the direction. No host→app
notification exists today, so every entry is `request` and today's behavior is unchanged. Dispatch
looks the method up first: an unknown method yields `-32601`, and a known method used with the
wrong `kind` yields `-32600`.

## The set

| Family | Members | Params |
| --- | --- | --- |
| Lifecycle | 11 — `construct`, `initialize`, `setStatus`, `getStatus`, `onEnable`, `onDisable`, `onInstall`, `onUninstall`, `onUpdate`, `onSettingUpdated`, `onPreSettingUpdate` | varies |
| Listeners | 74 `check*` / `execute*` names, over 51 `AppInterface` members | `[context]`, except the `*PostMessageDeleted` pair, which is `[message, context]` |
| UIKit | 5 — `executeBlockAction`, `executeViewSubmit`, `executeViewClosed`, `executeActionButton`, `executeLivechatBlockAction` handlers | `[context]` |
| Upload | 1 — `executePreFileUpload` | `[{ file, path }]` |
| Keyed families | 5 — `api`, `slashcommand`, `scheduler`, `videoconference`, `outboundCommunication` | flattened in task 12 |
| Control | `_zPING` — not JSON-RPC, so not in this set | bare string |

Take the listener names from `AppMethod` in `packages/apps-engine`, not from a hand-written list.
Task 19 owns the listener arity declaration; this task can declare the names and defer the arity to
it, or declare both. Say which in the PR.

## Steps

1. Enumerate every method name the host emits. `git grep -nE "method: \`?'?(app|api|slashcommand|videoconference|scheduler|outboundCommunication):"` finds 11 lines: the five keyed families in `src/server/managers/`, the `app:${method}` template at `ProxiedApp.ts:68`, and five literal `app:*` sites in `BaseRuntimeSubprocessController.ts`.
2. Write `methods.ts` as a `const` object keyed by method name, with `{ kind, arity }` per entry.
3. Derive a `HostToAppMethod` union from the keys.
4. Add the five keyed families as placeholders. Task 12 fixes their member names.
5. Add no import. This module has to stay zero-dependency, like `names.ts`.

## Done when

- [ ] Every method name that the host emits has an entry.
- [ ] A test enumerates `AppMethod`'s `check*` / `execute*` members and asserts that each has an
      entry. The test fails when `apps-engine` adds a listener.
- [ ] `methods.ts` imports nothing at run time.
- [ ] Nothing consumes the set yet. This task adds declaration only.

## Size

~120 entries, mostly one line each. No behavior change.
