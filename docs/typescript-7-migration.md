# TypeScript 7 migration

The workspace default compiler is `typescript@~7.0.2` (the native `tsgo`
binary). This document tracks **what remains** — the packages still on TS5.9,
the constraints that keep them there, and the follow-ups to finish the move.

## Still pinned to `typescript@~5.9.3`

Their build/lint toolchain still links the TS compiler JS API, which
`typescript@7` no longer ships. Unpinning each is a version bump once its tool
supports TS7.

| Package | Blocker |
| --- | --- |
| `@rocket.chat/core-typings`, `@rocket.chat/ui-kit` | typia toolchain — they build with `ttsc`/`tsgo` but keep TS5.9 for the editor/`typecheck` path until typia settles on a released TS7 binary. |
| `@rocket.chat/lint-config` | the ESLint plugins oxlint loads as JS plugins (jest, storybook) import `@typescript-eslint/utils`, which links the JS compiler API. Typed linting itself runs on oxlint's TS7-based tsgolint. `installConfig.hoistingLimits: workspaces` nests the plugins beside the pinned TS. |
| `@rocket.chat/message-parser`, `@rocket.chat/livechat` | webpack configs load `webpack.config.ts` through ts-node. |
| `@rocket.chat/emitter`, `@rocket.chat/mp3-encoder`, `@rocket.chat/css-in-js`, `@rocket.chat/fuselage-hooks`, `@rocket.chat/styled` | `@rollup/plugin-typescript` links the JS compiler API. |
| `@rocket.chat/apps` | `node --test` suites load TS through ts-node (extensionless CJS relative imports rule out native type stripping). |

## Constraints to respect when migrating the rest

- **Runtime singletons across the TS boundary.** A dependency that declares
  `typescript` as a (even optional) peer gets a distinct Yarn virtual instance
  per TS version importing it. For a library that keeps runtime state in a
  module-level singleton that means two physical copies that don't share state.
  `react-i18next` is the case that bit us (`NO_I18NEXT_INSTANCE` → raw keys), so
  every package rendering its components in one tree must sit on the same side
  of the boundary. All react-i18next consumers are on TS7 except `livechat`,
  which keeps a TS5.9 copy shipped as an isolated bundle that never shares a
  tree with them.
- `typedoc` supports TS ≤ 6, so `apps-engine`'s `gen-doc` needs a local TS5.9
  until typedoc ships TS7 support (manual doc script, not in CI).
- `@rocket.chat/federation-sdk` (external) declares a `typescript ~5.9.2`
  peer — warning only.

## Follow-ups

- Drop each pin as its tool ships TS7 (or a TS6-bridge) support:
  `@typescript-eslint/utils` (in the oxlint JS plugins), `@rollup/plugin-typescript`, ts-node (→ Node native type
  stripping), typedoc.
- Move the typia toolchain to a released `typescript@7` binary instead of
  `@typescript/native-preview` once ttsc resolves it directly.
- Add a non-blocking TS7 typecheck job to track the remaining pinned packages,
  then promote it to a required check once they are all green.
