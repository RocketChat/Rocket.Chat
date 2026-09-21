# 06 — Move `IpcSanitizer`

**PR 1** · **ADR decision 3** · **Depends on:** [01](01-protocol-project-skeleton.md)

## Goal

Move `packages/apps/src/lib/IpcSanitizer.ts` into `protocol/src/serialization/ipcSanitizer.ts`.
Repoint both send paths and the test. This deletes the second of the three value imports that
`base-runtime` makes of the host's compiled `dist`.

## Why it belongs in `protocol/`

`sanitizeForIpc` runs on every message before every send, on both sides. It replaces functions,
symbols and `App` instances with `undefined`, and it preserves `Buffer`, `Date`, `RegExp`, `Error`,
`Map`, `Set`, shared references and cycles. One implementation serves both halves, and a wire rule
that both halves have to obey is what `protocol/` is for.

The sanitizer is mandatory, not an optimization. `serialization: 'advanced'` throws
`DataCloneError` on a function, so a missed path fails the whole send.

## Scope

| File | Change |
| --- | --- |
| `packages/apps/src/lib/IpcSanitizer.ts` | deleted, moved to `protocol/src/serialization/ipcSanitizer.ts` |
| `packages/apps/src/server/runtime/base/ProcessMessenger.ts:4` | import path |
| `packages/apps/base-runtime/src/lib/messenger.ts:3` | import path, drops the `dist` import |
| `packages/apps/tests/lib/IpcSanitizer.test.ts` | import path, and move next to the module |

## Steps

1. Move the file. Keep `sanitizeForIpc` as the exported name.
2. Make it `strict: true` clean. The walk reads arbitrary `unknown` values, so expect the narrowing
   work here to be larger than in task 05.
3. Move the test into the protocol project, and add a `test:protocol` script if `protocol/` needs
   its own runner. Otherwise leave the test in the host suite and repoint its import.
4. Repoint both send paths.

## Done when

- [ ] `git grep "lib/IpcSanitizer"` matches nothing.
- [ ] `base-runtime/src/lib/messenger.ts` makes no `@rocket.chat/apps/dist` import.
- [ ] Every case of the existing sanitizer test passes: cycles, shared references, `Buffer`,
      `Date`, `RegExp`, `Error`, `Map`, `Set`, `App` instances, functions, symbols.
- [ ] `yarn typecheck:protocol` passes with `strict: true`.

## Size

~85 lines moved, ~145 lines of test moved. 3 import statements repointed.

## Note

After tasks 05 and 06, `base-runtime` makes one value import of the host's `dist` — `lib/jsonrpc.ts`
— and task 07 deletes it. Two type-only imports remain, in `roomFactory.ts` and
`handlers/app/construct.ts`. TypeScript erases those, so they cost nothing at run time and are out
of scope.
