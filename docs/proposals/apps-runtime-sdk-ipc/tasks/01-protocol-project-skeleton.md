# 01 — Protocol project skeleton

**PR 0** · **ADR decision 2** · **Depends on:** nothing · **Unblocks:** every other task

## Goal

Add `packages/apps/protocol/` as a fourth tsc project inside `@rocket.chat/apps`. Build it before
the other three. Compile it `strict: true`. The directory holds only a README today, so this task
adds the project wiring and nothing else.

## Why this is first

The host, `base-runtime` and `node-runtime` all resolve sibling projects through the
`@rocket.chat/apps/*` → `../*` path mapping, which points at a compiled `dist`. A fourth project
therefore changes the build order for all three. Prove that with an empty project, before any
module moves into it.

## Scope

| File | Change |
| --- | --- |
| `packages/apps/protocol/tsconfig.json` | new |
| `packages/apps/protocol/src/index.ts` | new, re-export barrel |
| `packages/apps/package.json` | `files`, `build`, `build:clean`, `typecheck` |
| `packages/apps/turbo.json` | `protocol/**` in `outputs` |
| `packages/apps/protocol/README.md` | drop the "holds only this README" note |

## Steps

1. Write `protocol/tsconfig.json`. Extend `@rocket.chat/tsconfig/server.json` directly, not
   `../tsconfig.json`, because the parent sets `strict: false`. Set `rootDir: ./src`,
   `outDir: ./dist`, `module`/`moduleResolution` `nodenext`, `declaration: true`, `strict: true`.
2. Add `build:protocol` and `typecheck:protocol` scripts.
3. Put `build:protocol` ahead of `build:default` in `build`. Leave `build:clean` first, because it
   deletes `protocol/dist`. Put `typecheck:protocol` first in `typecheck`.
4. Add `protocol/dist` to `build:clean`.
5. Add `protocol/` to the `files` array of `package.json`.
6. Add `protocol/**` to the `outputs` array of `turbo.json`.
7. Confirm that the `@rocket.chat/apps/*` path mapping in `base-runtime/tsconfig.json` and
   `node-runtime/tsconfig.json` resolves `@rocket.chat/apps/protocol/dist/...`. Do not add a second
   mapping if the existing one already covers it.

## Done when

- [ ] `yarn build` in `packages/apps` emits `protocol/dist/index.js` and `protocol/dist/index.d.ts`.
- [ ] `yarn typecheck` runs 5 steps, and `typecheck:protocol` is the first.
- [ ] `yarn build:clean` removes `protocol/dist`.
- [ ] A test file in `base-runtime` that imports from `@rocket.chat/apps/protocol/dist/index`
      typechecks. Delete that probe before the PR lands.
- [ ] `apps/meteor` builds unchanged.
- [ ] The packed tarball (`yarn pack`) contains `protocol/dist/`.

## Size

~50 lines of config. No behavior change.
