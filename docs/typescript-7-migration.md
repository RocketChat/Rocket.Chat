# TypeScript 7 migration

Status: **in progress** (draft). The workspace default compiler is now
`typescript@~7.0.2` — the native (Go) compiler. A small set of packages stays
pinned to `~5.9.3` because their toolchain still links the old JS compiler
API, which `typescript@7` no longer ships (its main export only exposes the
version; the compiler is a native binary plus the `unstable/*` APIs).

## What changed

- `typescript` devDependency bumped to `~7.0.2` in every workspace except the
  pinned ones below.
- `@rocket.chat/tsconfig` base config migrated to TS7-valid options:
  - `target`: `es5` → `es2022` (ES3/ES5 targets were removed in TS6/7).
  - `moduleResolution`: `node` (node10, removed) → `bundler`. TS7 allows
    `module: commonjs` + `moduleResolution: bundler`; TS5.9 did not, which is
    why the spike (`chore/ts7-spike`) had to keep the base config on `node`
    and inject overrides via CLI flags.
  - `types: ["node", "jest"]`: TS7 no longer auto-includes every `@types/*`
    package it can see, so global ambient types must be named. Module-scoped
    `@types/*` (e.g. `@types/express`) still resolve through imports and need
    no listing.
- Explicit `rootDir` added to every tsconfig that sets `outDir` (TS7 requires
  it — error TS5011 — instead of inferring the common source directory).
  Services that compile meteor sources directly (`authorization-service`,
  `ddp-streamer`) root at the repo root, preserving the monorepo-mirrored
  dist layout the `ee/apps/Dockerfile` overlay expects.
- `baseUrl` was removed in TS7 (TS5102); `paths` entries now resolve relative
  to the tsconfig, and every mapping value must be relative (TS5090).
- Packages pinned to TS5.9 that inherit the base but emit through a bundler
  (`livechat`, `emitter`) set `module: "preserve"`: TS5.9 rejects
  `commonjs` + `bundler`, `preserve` satisfies both compilers.
- typia packages (`core-typings`, `ui-kit`) build with `ttsc` driving the
  `tsgo` binary from `@typescript/native-preview`, with the typia transform
  as a Go source plugin (see `chore/ts7-spike`); typia bumped 9.7.2 → 13.0.2
  and the 9.7.2 patch was dropped. The typia Go plugin compiles on first run
  (ttsc vendors its own Go toolchain via `@ttsc/*`; the TS7 canary workflow
  additionally sets up Go and caches the plugin build to keep cold runs fast).
  Two typia-13 emit changes had runtime consequences for REST response
  validation (TEST_MODE) and are normalized back to the 9.x behavior the
  runtime was built against:
  - typia 13 closes every object schema with `additionalProperties: false`;
    the 9.x emit left components open, and the response schemas that compose
    a component `$ref` with the `success` flag via
    `allOf` + `unevaluatedProperties: false` (e.g. `GET /v1/me`) can never
    validate against a closed subschema — the sibling `success` is
    "additional" inside the ref'd branch. `normalizeForAjv2020`
    (core-typings `Ajv.ts`) now strips `additionalProperties: false`
    (schema-valued `additionalProperties` for Records is preserved); route
    schemas keep their own closedness via `unevaluatedProperties`.
  - typia 13 emits single-literal types as `const: 'file'` where 9.x emitted
    `enum: ['file']`; the attachment-branch patch in
    `apps/meteor/server/api/validation/ajv.ts` (which closes the catch-all
    plain-file branches so the `MessageAttachment` `oneOf` stays
    unambiguous) matched only the `enum` shape and silently stopped
    applying. It now accepts both shapes.
- `apps/meteor`'s `typia` dependency aligned to 13.0.2 so a single typia
  runtime/schema dialect exists in the tree (its usages are type-level and
  schema-consuming only).
- Vestigial `ts-jest` devDependencies removed (all jest suites run on
  `@swc/jest` via `@rocket.chat/jest-presets`). Jest 30 loads
  `jest.config.ts` without ts-node under Node 22 in typeless packages
  (Node re-parses the config as ESM by syntax detection). `apps/meteor`
  declares `"type": "commonjs"`, which disables that fallback — its config
  is now `jest.config.mjs` (plain ESM; jest's `.mts` loader also drops the
  `projects` array, so `.mjs` is the reliable shape). `server-fetch` moved
  from jest 29 (which required ts-node for TS configs) to the workspace's
  jest 30. Meteor's mocha suites run on `tsx`, which has no TS API
  dependency.
- The repo-root `eslint.config.mjs` imports `globals` directly, so `globals`
  is now a root devDependency — previously it resolved by hoisting accident,
  and the eslint-config `hoistingLimits` change let an ancient transitive
  copy win the root spot, crashing every lint run that used the root
  config.
- `scripts/ts7-typecheck.sh` + the `TS7 Canary` workflow (ported from the
  spike) now run the workspace compiler with no CLI overrides; the canary
  stays non-blocking and tracks the remaining red packages.

## Packages pinned to `typescript@~5.9.3` (and why)

| Package | Reason |
| --- | --- |
| `@rocket.chat/core-typings`, `@rocket.chat/ui-kit` | typia toolchain; they compile with `ttsc`/`tsgo` (TS7-native) but keep TS5.9 for the editor/`typecheck` path until typia's toolchain settles. |
| `@rocket.chat/eslint-config` | `typescript-eslint` peer range is `<6.1.0`; typed linting needs the JS compiler API. `installConfig.hoistingLimits: workspaces` keeps the whole lint toolchain nested beside the pinned TS so every workspace lints through it. |
| `@rocket.chat/message-parser`, `@rocket.chat/livechat` | webpack builds load `webpack.config.ts` through ts-node, which crashes on the TS7 API. |
| `@rocket.chat/emitter`, `@rocket.chat/mp3-encoder` | `@rollup/plugin-typescript` links the JS compiler API. |
| `@rocket.chat/apps` | `node --test` suites load TS through ts-node (extensionless CJS-style relative imports rule out Node's native type stripping); its scripts pass `TS_NODE_COMPILER_OPTIONS` to keep ts-node off the base's `bundler` resolution. |

Unpinning any of these is just a version bump once its tool supports TS7.

## Known caveats (not gating CI)

- `typedoc` (`packages/apps-engine` `gen-doc`, `packages/mp3-encoder`
  `docs`) supports TS ≤ 6; those scripts need the pinned TS until typedoc
  catches up (mp3-encoder is pinned anyway; apps-engine's is a manual
  script, not in CI).
- ts-node-based dev scripts (`yarn fossify` at the root, the `ms` scripts in
  `ee/apps/*`, `bench` in message-parser) require the JS compiler API. Where
  the package is not pinned, run them with Node 22's native type stripping
  (`node file.ts`) or a non-TS-API runner instead.
- `@rocket.chat/federation-sdk` (external) declares a `typescript ~5.9.2`
  peer — warning only.

## Canary status

The canary (`scripts/ts7-typecheck.sh`) is green for all 73 workspace
tsconfigs. TS7 rejects the `Endpoints` interface simultaneously extending a
legacy hand-written family type from `@rocket.chat/rest-typings` and the
`ExtractRoutesFromAPI` augmentation the migrated implementation declares
(error TS2320) when the two declarations differ; TS5.9 tolerated it. The
dedup resolved this by making each route's stronger declaration the only
one:

- Routes whose extracted types are complete now live only in the
  augmentation — their hand-written declarations were deleted from
  rest-typings (chat, dm/im, e2e, emoji-custom, invites, push, roles,
  rooms, teams families).
- Routes still registered via the legacy `API.v1.addRoute` (e.g. most
  `/v1/rooms.*`, `/v1/chat.getMessageReadReceipts`, `/v1/im.kick`) keep
  their rest-typings declarations until they are migrated.
- Routes whose extracted emit is weaker than the hand-written type
  (`params: never`/`undefined`, `object`-typed `$ref` responses), or that
  standalone packages consume without seeing the meteor augmentation, stay
  canonical in rest-typings and are `Omit`ted from the corresponding
  augmentation, each with a comment naming the reason. Deleting such a
  route from rest-typings (after strengthening its extraction or migrating
  its consumers) automatically promotes the extracted type — the Omit list
  is the remaining ratchet.

## Follow-ups

- Watch typescript-eslint / typedoc / rollup-plugin-typescript for TS7 (or
  TS6-bridge) support and drop the pins.
- Move the typia toolchain to a released `typescript@7` binary instead of
  `@typescript/native-preview` once ttsc resolves it directly.
- The canary is fully green — consider making it a blocking check.
- Burn down the Omit ratchet: strengthen the weak extractions (typed response
  schemas, query validators) and migrate the remaining legacy addRoute
  routes, deleting each rest-typings declaration as its extraction becomes
  authoritative.
