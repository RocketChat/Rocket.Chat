# 08 — Asymmetric result envelope

**PR 2** · **ADR decision 5** · **Depends on:** [07](07-move-jsonrpc-surface.md)

## Goal

Type the success envelope by direction. App→host responses carry `result: { value, logs? }`.
Host→app responses carry the raw value. One `SuccessObject` type serves both today, and the
asymmetry lives only in the call sites.

## Why the asymmetry stays

Only the subprocess produces app logs, so `logs` can never be populated on the host→app direction.
`bridges:*` responses are the hot direction; a wrapper there costs an allocation and a map entry
per accessor call for a field that is always absent. The **envelope** is invariant on app→host; the
**`logs` field** stays conditional on `logger.hasEntries()`.

## Scope

| File | Change |
| --- | --- |
| `protocol/src/framing/jsonrpc.ts` | split `SuccessObject` into two parameterized forms |
| `base-runtime/src/lib/messenger.ts` | `successResponse` produces the wrapped form |
| `src/server/runtime/base/BaseRuntimeSubprocessController.ts` | `handleBridgeMessage` produces the raw form; `handleResultMessage` reads the wrapped form |
| `base-runtime/src/lib/bridges/bridgeCall.ts` | already unwraps `response.result`; confirm the type now says so |

## Steps

1. Parameterize the success envelope over its result type.
2. Declare `AppToHostResult<T> = { value: T; logs?: ... }` and use it in the app→host alias.
3. Repoint `bridgeCall`'s `response.result as T` cast. If the type now carries the shape, delete
   the cast.
4. Repoint `handleResultMessage`, which reads `result.value` and `result.logs` today.

## Done when

- [ ] The two directions have distinct types, and no call site casts between them.
- [ ] `bridgeCall` has no `as T` on the result path, or the PR states why it must keep one.
- [ ] `logs` stays absent when `logger.hasEntries()` is false. A test asserts the key is absent,
      not `undefined`.
- [ ] No wire change. Existing round-trip tests pass unchanged.

## Size

~40 lines. Type-level only, unless a cast hid a real mismatch.
