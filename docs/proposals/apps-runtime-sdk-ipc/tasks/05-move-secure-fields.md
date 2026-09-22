# 05 — Move `SecureFields`

**PR 1** · **ADR decision 3** · **Depends on:** [01](01-protocol-project-skeleton.md)

## Goal

Move `packages/apps/src/lib/SecureFields.ts` into `protocol/src/serialization/secureFields.ts`.
Update the one `apps/meteor` call site and the `base-runtime` importer. Add no re-export shim. This
deletes one of the three value imports that `base-runtime` makes of the host's compiled `dist`.

## What does not move

The **walk** — `applySecureFieldsDeep` in `base-runtime/src/lib/secureFields.ts` — stays in
`base-runtime`, because it needs the app permissions. What moves is the marker, the descriptor and
the mapper: the plain string key `'@@SecureFields'` that the walk looks for, and the code that
resolves it.

## Scope

| File | Change |
| --- | --- |
| `packages/apps/src/lib/SecureFields.ts` | deleted, moved to `protocol/src/serialization/secureFields.ts` |
| `apps/meteor/app/apps/server/converters/codecs/rooms.ts:2` | import path |
| `packages/apps/base-runtime/src/lib/secureFields.ts:1,2,7` | import path, three statements |
| `packages/apps/tests/server/runtime/SecureFieldsIpcCompatibility.test.ts:9` | import path |

The moved module exports `kSecureFields`, `WithSecureFields`, `secureFieldsMapper` and
`hasSecureFields`.

## Steps

1. Move the file. Keep the exported names.
2. Make it `strict: true` clean. `hasSecureFields` indexes `object?.[kSecureFields]` on an
   `unknown`, which `strict` rejects; narrow it explicitly.
3. Repoint `rooms.ts` from `@rocket.chat/apps/dist/lib/SecureFields` to the protocol path.
4. Repoint the three statements in `base-runtime/src/lib/secureFields.ts`.
5. Repoint `SecureFieldsIpcCompatibility.test.ts`, which imports the module by relative path.
6. Delete nothing else. The walk, the tests and `applySecureFields` stay where they are.

## Done when

- [ ] `git grep "lib/SecureFields"` matches nothing.
- [ ] `base-runtime/src/lib/secureFields.ts` makes no `@rocket.chat/apps/dist` import.
- [ ] `secureFields.test.ts` passes unchanged. `SecureFieldsIpcCompatibility.test.ts` passes with
      its import path repointed and nothing else changed.
- [ ] `apps/meteor` typechecks.
- [ ] `yarn typecheck:protocol` passes with `strict: true`.

## Size

~20 lines moved. 5 import statements repointed. The `strict` pass is the only real work.
