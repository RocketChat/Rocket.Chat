# 02 — Control frames

**PR 0** · **ADR decision 8** · **Depends on:** [01](01-protocol-project-skeleton.md)

## Goal

Move `_zPING` and `_zPONG` into `protocol/src/framing/control.ts`, with an `isControlFrame()`
discriminator. Collapse four independent literal definitions into one import. Delete the dead
JSON-RPC `ping` method at the same time.

The two frames stay bare strings. ADR decision 8 keeps them out of JSON-RPC to avoid an object
encode per heartbeat.

## Scope

The four literal definitions today:

| File | Line | Constant |
| --- | --- | --- |
| `packages/apps/src/server/runtime/base/LivenessManager.ts` | 7 | `COMMAND_PING` (exported) |
| `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts` | 24 | `COMMAND_PONG` |
| `packages/apps/base-runtime/src/mainLoop.ts` | 26 | `COMMAND_PING` |
| `packages/apps/base-runtime/src/lib/messenger.ts` | 33 | `COMMAND_PONG` |

The dead `ping` method sits in the `Handlers` type and the `methodHandlers` map of
`mainLoop.ts:requestRouter`. Nothing sends `{ method: 'ping' }`, and only the host can write to the
subprocess, so no app can reach it.

## Steps

1. Write `protocol/src/framing/control.ts` with `COMMAND_PING`, `COMMAND_PONG` and
   `isControlFrame(value: unknown): value is ControlFrame`.
2. Repoint the four files at the new module. Keep `LivenessManager`'s re-export only if a consumer
   outside `packages/apps` reads it; otherwise delete it.
3. Delete the `ping` entry from the `Handlers` type and from the `methodHandlers` object literal in
   `mainLoop.ts`.
4. Use `isControlFrame()` in `mainLoop.handleIncomingMessage` in place of the `message ===
   COMMAND_PING` comparison.

## Done when

- [ ] `git grep "'_zPING'\|'_zPONG'"` in `packages/apps` matches only `control.ts` and the docs.
- [ ] `git grep "ping:"` matches nothing in `base-runtime/src/mainLoop.ts`.
- [ ] `control.ts` imports nothing.
- [ ] The existing liveness tests pass unchanged.

## Size

~20 lines added, ~8 deleted, 4 files repointed.
