# Proposal: replace typia with Zod for runtime schemas

Status: proposed, not implemented. Open for comments.

## Context

typia is a compile-time transform: it reads TypeScript types and emits validators or JSON Schema. Two packages use it.

- **`@rocket.chat/core-typings`**: `src/Ajv.ts` calls `typia.json.schemas<[…]>('3.1')` over 37 entity types
  (`IMessage`, `IUser`, `IRoom`, `ISubscription`, …). The result is 222 components, about 166 KB of JSON. The REST
  layer registers them in Ajv (`apps/meteor/server/api/validation/ajv.ts`) and in the OpenAPI document
  (`apps/meteor/server/api/default/openApi.ts`). Response schemas point at them through 124 `$ref`s;
  `IMessage` alone has 30.
- **`@rocket.chat/ui-kit`**: 20 `typia.createIs<…>()` guards (`isView`, `isModalView`,
  `isOpenModalServerInteraction`, …). Nothing in the monorepo calls them.

`apps/meteor` also depends on a patched `typia@9.7.2`, only because the built `ui-kit` requires `typia` at runtime.

## Problem

- **Toolchain lock.** Both packages build through `ttsc` with the typia transform plugin, and keep TypeScript 5.9 for
  their editor and `typecheck` path. They are the packages listed as blocked in
  [typescript-7-migration.md](../typescript-7-migration.md).
- **Post-processing that must follow typia.** `Ajv.ts` carries `normalizeForAjv2020`, about 70 lines that rewrite
  typia's output into what `ajv/dist/2020` accepts: it reopens closed objects, turns nullable `oneOf`s into type
  arrays, rewrites `additionalItems` and drops `discriminator.mapping`. The 9.x → 13 upgrade changed that output and
  400-ed REST responses in `TEST_MODE` until the normalizer caught up. Every typia upgrade carries that risk.
- **A patch to maintain.** `.yarn/patches/typia-npm-9.7.2-*.patch` fixes the ESM default export for Meteor.
- **Two schema systems.** `core-typings` already depends on Zod (`~4.3.6`). `IBanner`, `IRocketChatRecord` and the
  `cloud/*` payloads are Zod-first (`interface X extends z.infer<typeof XSchema>`), and the apps converters use Zod
  codecs ([apps-converters-zod](apps-converters-zod/README.md)). Those Zod-first types still feed typia through the
  inferred type, so the same shape is described twice.

## What Zod gives us

`z.toJSONSchema(schema, { io: 'input', target: 'draft-2020-12' })` emits the dialect our Ajv instance uses. A test
run over `IBannerSchema` showed:

- Objects come out open, with no `additionalProperties: false`, which is what the REST response schemas need when
  they combine a component `$ref` with `success` through `allOf`. That part of the normalizer goes away.
- `TimestampSchema` (an ISO string ↔ `Date` codec) emits `type: string, format: date-time`, the same as typia. The
  pattern also requires the `Z` suffix, which `Date.prototype.toISOString` always produces.
- Only the build changes. Zod schemas are plain runtime values, so `core-typings` and `ui-kit` can build with `tsgo`
  and drop `ttsc`.

## The trap: `z.custom`

`IBannerSchema.view` is `z.custom<UiKit.BannerView>()`. `z.toJSONSchema` throws on it ("Custom types cannot be
represented in JSON Schema"), or with `unrepresentable: 'any'` emits `{}`. Today typia expands the full UiKit tree in
that spot. Converting a type whose fields use `z.custom`, or `z.any()`, silently weakens response validation.
**A type moves to Zod only when every field it reaches has a real Zod schema.**

The 222 components pull in three large trees that would need real schemas:

1. **Entities**: `IMessage`, `IUser`, `IRoom` and `ISubscription` are about 1,400 lines of interfaces, plus the
   `Pick<>`/`Omit<>` projections typia names (`PickIUser_idusername`, …) and the discriminated unions (message
   attachments, video conferences, integrations).
2. **UiKit**: about 60 components (blocks, elements, surfaces), reached from `IBanner.view` and `IMessage.blocks`.
3. **Message parser AST**: about 40 recursive components, reached from `IMessage.md`.

## Proposal

Migrate incrementally. typia and Zod coexist until the last type moves.

1. **Remove typia from `ui-kit`.** Delete the 20 unused guards, or rewrite them in Zod if we would rather not break
   the published package's API. Drop the typia dependency from `ui-kit` and `apps/meteor`, along with the yarn patch.
   `ui-kit` then builds with `tsgo`.
2. **Bridge Zod into the Ajv components.** `Ajv.ts` merges `z.toJSONSchema` output for a registry of Zod schemas
   (`{ IBanner: IBannerSchema, … }`) with typia's output for the rest. Types already in Zod, like `IBanner`, leave the
   typia union.
3. **Move one entity per pull request, leaves first.** Start with `IRole`, `IPermission`, `ICustomSound`,
   `IEmojiCustom` and `IInvite`. Before `IBanner` and `IMessage` can move, the UiKit and parser AST trees need Zod
   schemas. Leave `IMessage` for last.
   - Keep the TypeScript `interface` and tie the schema to it with `const XSchema: z.ZodType<X> = …`. A schema that
     drifts from the type then fails to compile, and the hundreds of consumers keep the same types and the same
     published `.d.ts`.
   - Each pull request removes its type from the typia union. The API suite, which validates responses in
     `TEST_MODE`, guards each move.
4. **Remove typia.** Delete `normalizeForAjv2020`, the typia dependency, `ttsc` and the TypeScript 5.9 pin from
   `core-typings`.

## Not proposed

- **Switching every interface to `z.infer` in one go.** It touches every consumer of `core-typings`, changes the
  published declarations and risks typecheck performance, for no validation gain over `z.ZodType<X>`.
- **`z.custom` or `z.any()` as a placeholder for a tree not yet converted.** It turns a validated response into an
  unvalidated one with no visible failure.

## Open questions

- **The `ui-kit` guards.** Delete them (a breaking change in a published package, so a major changeset) or rewrite
  them in Zod?
- **Who owns the UiKit and parser AST schemas?** The UiKit schema could also validate what apps send, which typia
  never did. The parser AST schema has to follow `@rocket.chat/message-parser`, including the Rust/WASM parser.
- **The stricter `date-time` pattern.** Is any client or integration sending dates with an offset other than `Z` in
  request bodies that would reuse these components?
- **Bundle weight.** `core-typings` schemas are part of the logged-in client bundle today. Does a Zod registry built
  at import time cost more or less than the static JSON typia emits?

## Risks

Each moved type can change what a REST response accepts. The API suite catches a stricter schema rejecting real data,
but not a looser one accepting bad data; for that, each pull request should compare the emitted component against
typia's before removing it from the union.
