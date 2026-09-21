# 10 — Retire error code `1000`

**PR 3** · **ADR decision 6** · **Depends on:** [09](09-error-code-enum.md)

## Goal

Delete error code `1000` and split what it marks into `-32601` and `-32602`.

## Where `1000` lives

`BaseRuntimeSubprocessController.handleIncomingMessage:463` wraps anything `handleBridgeMessage`
throws as `new jsonrpc.JsonRpcError(e.message, 1000)`. That covers three distinct structural
failures:

| Failure | New code |
| --- | --- |
| Unknown bridge | `-32601` |
| Unknown `do*`, or a method with no `do` prefix | `-32601` |
| `params` is not an array | `-32602` |
| A schema violation, once task 14 adds AJV | `-32602` |

A real distinction from `-32000` — "the bridge method threw" — hides inside `1000` today. The split
keeps it and encodes it properly.

## Why the risk is zero

Inbound error codes are unobservable to apps. `mainLoop.handleResponse` reconstructs
`new Error(response.error.message)` and discards `code` and `data`. No app can read the code, so no
app can depend on `1000`. ADR 0006's follow-up 4 tracks the restoration of the code; it is not part
of this task.

## Scope

| File | Change |
| --- | --- |
| `src/server/runtime/base/BaseRuntimeSubprocessController.ts` | `handleBridgeMessage` throws typed errors; `handleIncomingMessage` stops wrapping as `1000` |

## Steps

1. Make `handleBridgeMessage` return a typed `JsonRpcError` for each structural failure rather than
   throw a bare `Error`.
2. Delete the `1000` literal from `handleIncomingMessage`.
3. Keep `-32000` for "the bridge method threw", which is what `handleBridgeMessage:447` already
   produces.

## Done when

- [ ] `git grep ", 1000)"` matches nothing in `packages/apps`.
- [ ] A test drives each of the four structural failures and asserts its code.
- [ ] The "bridge threw" path still answers `-32000`.

## Size

~30 lines. Behavior change, which is why the plan splits it from task 07.

## Related, out of scope

`ProxiedApp.call`'s range check reads `e.code >= -32999 || e.code <= -32000` — an `||` where `&&`
was meant, so it matches every number. ADR 0006's follow-up 6 records it. Fix it separately or
document it as deliberate; do not smuggle it into this task.
