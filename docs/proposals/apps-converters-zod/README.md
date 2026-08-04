# Proposal: Migrate the Apps-Engine converters to Zod codecs

## Status

In progress (PR #41205). Phases 0–5 landed; `transformMappedData` removed. See the per-phase
notes below, including the messages/threads deviation in Phase 4.

## Problem

`apps/meteor/app/apps/server/converters/` translates data between two models in both
directions:

- **Rocket.Chat → Apps-Engine** ("to app"): Mongo documents (`IUser`, `IRoom`, `IMessage`, …)
  become Apps-Engine objects (`IAppsUser`, `IAppsRoom`, `IAppsMessage`, …). Methods such as
  `convertToApp` / `convertRoom` / `convertMessage`.
- **Apps-Engine → Rocket.Chat** ("from app"): the reverse. Methods such as `convertToRocketChat` /
  `convertApp*`.

Today the two directions are implemented by two unrelated mechanisms:

- The **to-app** direction is driven by `transformMappedData`, a declarative field remapper
  (`{ to: 'from' | fn | { from, map, list } }`) that also collects everything it did not map into an
  `_unmappedProperties_` bucket.
- The **from-app** direction is hand-written object construction with long chains of
  `...(cond && { … })` spreads, re-merging `_unmappedProperties_` at the end.

This split has real costs:

1. **Two sources of truth per entity.** The field mapping is expressed once in a `map` and again,
   inverted, in a hand-written builder. They drift.
2. **No runtime validation at the boundary.** The from-app path trusts whatever an app sends and
   spreads it onto a Mongo document.
3. **Weak typing.** Several converters were untyped `.js`; the mapping is stringly-typed and the
   relationship between the two directions is invisible to the compiler.

### Inventory

| Converter          | Was       | To-app | From-app | Async / DB | Notable hazards |
|--------------------|-----------|:------:|:--------:|:----------:|-----------------|
| `settings`         | js → ts   | ✅ | —  | sync  | `SettingType` enum |
| `roles`            | ts        | ✅ | —  | sync  | trivial |
| `videoConferences` | ts        | ✅ | ✅ | sync  | pass-through clone |
| `visitors`         | js → ts   | ✅ | ✅ | sync  | `_unmappedProperties_` bucket |
| `departments`      | js → ts   | ✅ | ✅ | sync  | `_unmappedProperties_` bucket |
| `users`            | js → ts   | ✅ | ✅ | sync  | `UserType` / `UserStatusConnection` enums, contextual `console.warn` |
| `uploads`          | js → ts   | ✅ | ✅ | **async** | cross-converter (rooms/users/visitors) |
| `rooms`            | js → ts   | ✅ | ✅ | **async** | cross-converter fan-out, `isPartial`, `secureFieldsMapper`, `RoomType` enum |
| `messages`         | js → ts   | ✅ | ✅ | **async** | `WeakMap` + `cachedFunction` memoization, `isPartial`, attachment sub-map, visitor-sender fallback |
| `threads`          | ts        | ✅ | —  | **async** | duplicates the messages attachment map |
| `contacts`         | ts        | ✅ | ✅ | sync  | deep nested `list` reverse map |

Infrastructure: `transformMappedData.ts`, `cachedFunction.ts`, `convertMessageFiles.ts`.

## Proposed Solution

Model each entity as a **Zod codec** — a single bidirectional artifact that replaces the split
"map + hand-written inverse" pair and adds runtime validation.

Zod 4.3 (`~4.3.6`) is already a dependency, and the repo already ships a codec —
`TimestampSchema` in `packages/core-typings/src/utils.ts`:

```ts
export const TimestampSchema = z.codec(z.iso.datetime(), z.date(), {
	encode: (date) => date.toISOString(),
	decode: (str) => new Date(str),
});
```

`z.codec(RcSchema, AppSchema, { decode, encode })` maps directly onto our two directions:

- `decode` : Rocket.Chat → Apps-Engine  (today's `convertToApp` / `convertRoom` / …)
- `encode` : Apps-Engine → Rocket.Chat  (today's `convertToRocketChat` / `convertApp*`)

`z.decode(codec, x)` / `z.encode(codec, x)` run them synchronously; `z.decodeAsync` / `z.encodeAsync`
run them when the transforms are async.

The converter **classes stay** as the public façade (they implement the `IAppXConverter` interfaces
and are reached via `orch.getConverters().get('x')`, used in ~25 files). Codecs are an internal
implementation detail those methods delegate to.

## Key design decisions

1. **Async transforms → `z.decodeAsync` / `z.encodeAsync`.** rooms/messages/uploads/threads perform
   DB lookups inside the mapping. Their codec transforms are async and must be driven with the async
   entry points; the sync `z.decode` throws `$ZodAsyncError` on an async codec. Sync converters
   (settings, roles, users, visitors, departments, contacts, videoConferences) use plain
   `z.decode` / `z.encode`. *Validated against the installed Zod build during Phase 0.*

2. **Orchestrator dependency → codec factories.** Cross-converter converters cannot be static
   singletons — they need `orch`. Expose `createRoomCodec(orch)`, `createUploadsCodec(orch)`, etc.,
   returning a closure-bound codec. DB-free converters export a static codec constant.

3. **Preserve the `_unmappedProperties_` contract — do not drop it.** It is load-bearing: the reverse
   converters merge it back, the EE redactor (`ee/server/apps/lib/redactor.ts`) references the path,
   and `RoomBridge` reads it. A plain `z.object` strips unknown keys; `z.looseObject` keeps them
   inline but *without* the bucket. We will build a small reusable helper (working name
   `mappedCodec`) that reproduces `transformMappedData`'s bucket semantics exactly, so output is
   byte-identical. This keeps the migration behaviour-preserving rather than a behaviour change.
   The helper is intentionally **not** built up-front — it will be co-designed with the first
   bidirectional converter (Phase 2) to avoid guessing the abstraction.

4. **`isPartial` (rooms/messages from-app) stays in the class method, not the codec.** Partial mode
   skips required-field generation, skips the unmapped merge, and strips `undefined`. Model it as the
   class calling either `z.encode` (full) or a partial path; do not encode the flag into the schema.

5. **Enum conversions → shared codec constants.** `UserType`, `UserStatusConnection`, `RoomType`,
   `SettingType` become small codecs (like `TimestampSchema`) in `converters/codecs/enums.ts`,
   reproducing the current `switch` logic including the pass-through/upper-case fallbacks.
   Contextual `console.warn` calls that need data unavailable to a pure enum mapping (e.g. the
   affected user's id/username in the status-connection warning) stay in the converter layer.

6. **Memoization (messages/threads) stays.** The `WeakMap` + `cachedFunction` dedup of user/room
   lookups within a single conversion is preserved by constructing the message codec per-conversion
   through the factory, passing in the memoized lookups.

7. **Loose validation on the from-app path.** Apps send arbitrary data today; strict schemas would
   reject payloads that currently pass. Use `.loose()` / `.optional()` generously on the app-side
   schemas so the migration introduces no rejections. Tightening is a deliberate, separate follow-up.

8. **Preserve the public surface.** The `IAppXConverter` interfaces and the
   `orch.getConverters().get('x')` usage must not change.

### Direction convention (illustrative)

```ts
const UserCodec = z.codec(UserRocketChatSchema, AppsUserSchema, {
	decode: (user) => ({ id: user._id, /* … */ }),           // convertToApp
	encode: (appUser) => removeEmpty({ _id: appUser.id, /* … */ }), // convertToRocketChat
});

// RC -> App:  z.decode(UserCodec, user)
// App -> RC:  z.encode(UserCodec, appUser)
```

## Migration phases

Each phase is independently shippable, keeps the class façade, and is gated by the golden tests.

### Phase 0 — Scaffolding & de-risk (done, PR #41205)

- Converted the 7 remaining `.js` converters to `.ts`, behaviour-preserving. `rooms`/`messages` keep
  loose typing on their transform maps for now; that tightens when each is codec-ified.
- Fixed three pre-existing latent bugs that surfaced once the converters were typed (see
  [Incidental fixes](#incidental-fixes)). These are the only intentional behaviour changes in the
  phase and are each pinned by a golden/focused test.
- Added `converters/codecs/` with the first shared primitives: bidirectional enum codecs
  (`UserType`, `UserStatusConnection`, `RoomType`, `SettingType`).
- Added the **behavioural safety net**: enum-codec unit tests (asserting parity with the legacy
  helpers) and **golden-snapshot tests** locking the current RC ↔ Apps-Engine field mapping,
  including `_unmappedProperties_` bucketing, for settings, users, visitors, departments, roles,
  videoConferences, contacts and uploads.
- Validated the async-codec approach (`z.decodeAsync` / `z.encodeAsync`, `$ZodAsyncError`) that
  Phases 3–4 depend on.

#### Incidental fixes

Typing the converters exposed three latent bugs in the legacy code. They are small, self-contained,
and fixed in Phase 0 rather than carried forward as "behaviour to preserve":

1. **`users` — `utfOffset` typo (from-app).** `convertToRocketChat` read the misspelled
   `appUser.utfOffset`, so a round-tripped user always lost its `utcOffset`. It now reads
   `utcOffset` first and keeps `utfOffset` only as a compatibility fallback for any app still
   emitting the old key. The golden round-trip fixture uses `utcOffset`; a focused test pins the
   legacy fallback.
2. **`messages` — dead visitor-sender fallback (to-app).** The `sender` resolver deleted
   `message.u` *before* the "old system message without token" fallback re-read it, so the fallback
   always received `undefined`. It now captures the sender before deletion. A focused test drives a
   missing primary lookup and asserts the fallback resolves the original sender.
3. **`messages` — null editor deref (from-app).** `convertAppMessage` dereferenced
   `Users.findOneById(editor.id)` through a non-null assertion, throwing if the editor no longer
   exists. It now falls back to the editor data carried on the app payload, mirroring the adjacent
   sender handling.

Alongside these, a few defensive guards were added where a destructuring or lookup could hit an
optional value that the types claimed was always present (`uploads` `rid`/`room`, `users`
`convertByUsername`, `rooms` `visitorChannelInfo`). These only turn a latent `TypeError` into the
already-intended empty result and match the guards their sibling fields already had, so they change
no covered output.

### Phase 1 — Trivial, one-way, sync

`settings`, `roles`, `videoConferences`. Proves the codec + enum-codec pattern end-to-end at the
lowest risk.

### Phase 2 — Self-contained, bidirectional, sync

`visitors`, `departments`, `users`. Introduces and hardens the `mappedCodec` unmapped-bucket helper
and exercises the enum codecs with the `console.warn` side effects preserved in both directions.

### Phase 3 — Async, cross-converter

`uploads`, then `rooms`. Introduces the codec-factory pattern, `z.decodeAsync` / `z.encodeAsync`,
`isPartial` handled in the class layer, and `secureFieldsMapper` integration.

### Phase 4 — Async + memoized + nested (done)

`messages`, `threads` and `contacts`. `contacts` became a clean bidirectional `ContactCodec`
(`decode` clones; `encode` maps every attribute via the nested field map). `mappedDecodeAsync` was
extended with the nested `{ from, map, list }` branch so it fully reproduces `transformMappedData`.

**Deviation — messages and threads are not standalone codecs.** Unlike every other converter, these
two were migrated by swapping their `transformMappedData` calls for the shared `mappedDecodeAsync`
helper *in place*, rather than being wrapped in `create*Codec` factories. Reasons:

1. **Test harness.** `messages.tests.js` uses `proxyquire` to stub `@rocket.chat/models`,
   `@rocket.chat/random` and `@rocket.chat/core-typings` (`isMessageFromVisitor`) on the `messages.ts`
   module. `proxyquire` only replaces a module's *own* `require`s, so moving `convertAppMessage`'s
   model/`Random` usage into a separate `codecs/messages.ts` module would bypass the stubs and break
   the test (real `Rooms.findOneById` → no `GENERAL` room → the "proper schema"/"invalid room" cases
   fail). Keeping that usage in the class preserves the harness without editing it.
2. **Poor fit for the codec shape.** `convertMessage` builds its field map per call, closing over a
   per-message memoization cache (`WeakMap` + `cachedFunction`), the source `msgObj`
   (`isMessageFromVisitor`) and `mainFile`; `convertAppMessage` adds an `isPartial` flag and
   `Random.id`/`new Date()` defaults. None of this expresses cleanly as a static bidirectional
   `z.codec`, and forcing it would add casts and risk for no real gain.

The migration goal for these two is therefore narrower but still met: the `transformMappedData`
dependency is removed and the mapping logic is the shared, tested `mappedDecodeAsync`. The
attachment sub-maps stayed per-converter because messages' and threads' variants differ (threads has
extra `author`/`timestamp`/`fileId` guards) — sharing them would change behaviour. Wrapping messages
in a codec later remains possible (e.g. via `proxyquire`'s `@global` stubs) if desired.

### Phase 5 — Cleanup (done)

Every converter is off `transformMappedData`, so `transformMappedData.ts` was deleted and its
(previously importer-located) spec was retired — its coverage now lives in the `mappedDecodeAsync`
tests under `tests/unit/app/apps/server/codecs/`. `cachedFunction` stays: it is still used by the
messages and threads memoization, which remained in the class layer (see the Phase 4 deviation).

## Testing strategy

- **Golden snapshots** (added in Phase 0) are the equivalence oracle: each phase must keep them green
  while swapping internals. Output is compared after `JSON.parse(JSON.stringify(...))` so Dates
  normalise to ISO strings and `undefined` fields drop — matching how payloads cross the app bridge.
- **Enum-codec unit tests** assert `decode`/`encode` match the legacy `_convert*` helpers for every
  input, including fallbacks.
- The existing `rooms.tests.ts` and `messages.tests.js` remain the oracle for the two hardest
  converters.
- New codecs get their own focused tests as they are introduced.

## Risks

- **`_unmappedProperties_` fidelity** — the single biggest behavioural trap; the `mappedCodec` helper
  plus golden tests are the mitigation.
- **From-app validation rejecting live app payloads** — mitigated by loose schemas; do not tighten
  during the migration.
- **Async codec ergonomics** — de-risked in Phase 0, but the factory wiring for rooms/messages should
  still be spiked before committing to Phase 3.
- **Test rewrite** — the existing tests use `proxyquire.noCallThru()` against module paths; codec-ing
  each converter means updating those loaders.

## Type strategy for the mapping helpers

The mapping helpers in `converters/codecs/mappedData.ts` are split by how well the source type is
known, which is what makes generic typing worthwhile in some cases and not others:

- **Sync string maps → fully generic and inferred.** `mappedDecode<Source>(fieldMap)` and
  `createMappedCodec<Source>(fieldMap)` are generic over the source document type. The field map is
  typed `FieldMap<Source> = Record<string, Extract<keyof Source, string>>`, so a renamed or
  misspelled source field is a **compile error** (a `@ts-expect-error` test locks this). The decode
  result is the inferred `Decoded<Source, Map>` — each renamed target as an optional property plus the
  `_unmappedProperties_` bucket typed as `Omit<Source, mappedKeys>` — rather than `Record<string, any>`.
  `mappedEncode` is the inverse and returns `Partial<Source>`. `Source` defaults to a loose record, so
  untyped call sites (e.g. tests) still work. Consumers with clean document types (`visitors`,
  `departments`, `roles`) pass their `Source` and get the typo-safety for free.

- **Async/function/nested maps → loose map, generic result.** `mappedDecodeAsync` keeps its
  `AsyncFieldMap` loosely typed on purpose: its consumers (`rooms`, `messages`, `uploads`, `contacts`)
  map many optional/livechat-only fields that are *not* on the base document types (which is why the
  original converters used dynamic access), and the return shape depends on arbitrary function/nested
  entries. Fully inferring that would resurrect the large conditional type the old helper avoided. It
  does take a `Result` type parameter — `mappedDecodeAsync<IAppsUpload>(data, map)` — so call sites
  assert the produced shape once instead of trailing every call with `as unknown as Promise<…>`.

- **Each apps-type boundary keeps a single, documented cast.** The Apps-Engine interfaces
  (`IAppsVisitor`, …) are hand-authored and don't structurally equal the produced `Decoded`/mapped
  shape, so each affected codec boundary — supplied role, department, user and visitor — retains one
  localized `as unknown as <AppsType>` where the codec meets that interface. Those casts are the
  deliberate loose-validation seams (see design decision 7), not incidental looseness.

## Non-goals

- Changing the `IAppXConverter` interfaces or any app-facing behaviour.
- Tightening the from-app validation surface (tracked as a separate follow-up).
- Migrating converters that are not in the directory above.
