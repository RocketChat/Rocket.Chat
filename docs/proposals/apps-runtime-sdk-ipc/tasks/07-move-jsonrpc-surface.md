# 07 — Move the JSON-RPC surface

**PR 2** · **ADR decision 4** · **Depends on:** [01](01-protocol-project-skeleton.md)

## Goal

Move `packages/apps/src/lib/jsonrpc.ts` to `protocol/src/framing/jsonrpc.ts`. Delete
`packages/apps/base-runtime/src/lib/jsonrpc.ts`, the shim that re-exports the host's compiled
`dist`. Repoint the 23 importing modules. Change no behavior.

This is a pure move. ADR 0004 already built the surface — the envelope types, the four factories,
the type guards, `JsonRpcError` and the `meta` property. Review it by shape-diff.

## Why it matters

The shim is a **value** import of `@rocket.chat/apps/dist/lib/jsonrpc`. It makes `build:default` a
precondition of `typecheck:base-runtime`, and no subprocess can start until the host emits
`dist/lib/jsonrpc.js`. It is the last of the three value imports; tasks 05 and 06 deleted the other
two.

## Scope

| Side | Modules that import the surface |
| --- | --- |
| `base-runtime/src` | 19, including 8 test files |
| `src/server/runtime` | 2 — `BaseRuntimeSubprocessController.ts`, `ProcessMessenger.ts` |
| `tests/` | 2 |

`base-runtime` imports it as `./lib/jsonrpc` or `../../lib/jsonrpc`; the host imports it as
`../../../lib/jsonrpc`. Both become the protocol path.

## Steps

1. Move the file. Export the same names.
2. Make it `strict: true` clean. `SerializedJsonRpcError.data` and `JsonRpcError.data` are `any` on
   purpose — ADR 0004 records why — so keep them `any` and leave a comment that says `strict` does
   not force `unknown` here.
3. Delete `base-runtime/src/lib/jsonrpc.ts`.
4. Repoint every importer. Run `yarn typecheck` on all four projects to find the ones a grep misses.
5. Move `base-runtime/src/lib/tests/jsonrpc.test.ts` next to the module, or repoint its import.
6. Update ADR 0004's reference index, which points at `packages/apps/src/lib/jsonrpc.ts`. Change
   that entry and nothing else in ADR 0004.

## Done when

- [ ] `git grep "@rocket.chat/apps/dist/lib/jsonrpc"` matches nothing.
- [ ] `packages/apps/src/lib/jsonrpc.ts` and `packages/apps/base-runtime/src/lib/jsonrpc.ts` are
      both deleted.
- [ ] `yarn typecheck:base-runtime` passes on a tree where `dist/` does not exist.
- [ ] Every existing JSON-RPC test passes unchanged.
- [ ] ADR 0004's reference index points at the new path.

## Size

~270 lines moved. 23 import statements repointed. No behavior change.
