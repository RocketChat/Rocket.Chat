---
title: Block authoring — builder vs. object literals
kind: research report
status: informs an open decision; decides nothing on its own
decides: none
informs: "51-open-questions.md — the app-facing surface, decision 1 (Block Kit authoring DSL)"
createdAt: 2026-08-31
author: Douglas Gubert
branch: claude/apps-engine-api-redesign-8py65c
baseCommit: e3b6f3db5cec368d8f5e2e825c86a36fbff921c3
baseRef: origin/develop
baseCommitDate: 2026-08-31
baseCommitSubject: "refactor: move `app/ui` modules (#41928)"
question: >
  How should an app author UIKit blocks? What does a builder pattern buy, and
  can plain object literals give the same type-checking and autocomplete?
verification:
  typescript: 5.9.3
  assignability: tsc --noEmit; --extendedDiagnostics for the cost table
  autocomplete: tsserver completionInfo; every completion list quoted is verbatim
  strictness: strict true, exactOptionalPropertyTypes false (matches @rocket.chat/tsconfig)
  note: >
    The probe files were scratch and are not committed. Every snippet here was
    compiled against the real @rocket.chat/ui-kit types at baseCommit.
readAgainst:
  - packages/ui-kit/src
  - packages/fuselage-ui-kit/src
  - apps/meteor/client/uikit
  - apps/meteor/client/views/modal/uikit
  - packages/apps-engine/src/definition/uikit
  - packages/app-sdk/src
findings:
  - "16-surface-interactive-ui.md binds z.number() to a text input; every submit would fail validation"
  - "ui-kit MessageSurfaceLayoutBlock includes InfoCardBlock but the parser's allow-list omits 'info_card'"
---

# Block authoring — research report

> Part of the [Apps Engine SDK RFC](../README.md).

[16](../16-surface-interactive-ui.md) settles *when* a surface opens and how its
result comes back. It does not settle *how an app writes the blocks*, and
[the open questions](../51-open-questions.md) records that as decision 1: adopt
`@rocket.chat/ui-kit` as-is, or design an app-facing layer on top of it.

This report answers that question with measurements rather than taste. Every
claim below was checked against `@rocket.chat/ui-kit`'s real types with
TypeScript 5.9.3 — `tsc` for the assignability claims, `tsserver`'s
`completionInfo` for the autocomplete claims. Where a result is a completion
list, it is the literal list the editor returns.

**Conclusion up front.** A builder buys us three things — identity defaults,
text-object shorthand, and progressive state accumulation. The first two are
type-level problems with a type-level answer; the third collapses on the exact
case that needs it. Plain object literals, typed against a *projection* of the
ui-kit union and *bound to the surface's state schema*, beat a builder on every
axis measured, including autocomplete. Recommendation in
[§7](#7-recommendation).

---

## 1. What ui-kit gives us today

`@rocket.chat/ui-kit` is types plus renderers. It ships **no authoring API** —
`src/index.ts` exports type aliases, three `*Type` const maps, the
`SurfaceRenderer` base class, and typia guards. There is nothing to call.

| | count |
|---|---|
| layout blocks (`LayoutBlock`) | 12 |
| block elements (`BlockElement`) | 21 |
| of those, actionable (`ActionableElement`) | 19 |
| text objects | 2 (`plain_text`, `mrkdwn`) |

Three properties of the schema matter for authoring:

**It is a well-formed discriminated union.** Every member carries a literal
`type`. That is the precondition for contextual typing, and it holds without
exception.

**Each surface exposes its own legal subset.** `ModalSurfaceLayout`,
`MessageSurfaceLayout`, `ContextualBarSurfaceLayout`, `BannerSurfaceLayout`,
`AttachmentSurfaceLayout` are separate unions. A modal accepts 7 block types; a
message accepts 9, and `input` is not among them.

**Every actionable element carries a required identity triple**
(`packages/ui-kit/src/blocks/Actionable.ts:4`):

```ts
export type Actionable<Block> = Block & {
	appId: string;
	blockId: string;
	actionId: string;
	…
};
```

19 of 21 elements are `Actionable`. So on the wire type, `appId` and `blockId`
are mandatory on almost every element an app writes — and both are values the
app should not be choosing.

---

## 2. The wire types are not authoring types

Author the reference modal directly against `LayoutBlock` and the gap is
visible:

```ts
const raw: LayoutBlock[] = [
  { type: 'section', text: { type: 'mrkdwn', text: 'Configure reminders.' } },
  { type: 'input', label: { type: 'plain_text', text: 'Digest channel' },
    element: { type: 'plain_text_input', appId: APP_ID, blockId: 'digest',
               actionId: 'digestChannel', initialValue: values?.digestChannel } },
  { type: 'input', label: { type: 'plain_text', text: 'Max per user' },
    element: { type: 'linear_scale', appId: APP_ID, blockId: 'max',
               actionId: 'maxReminders', minValue: 1, maxValue: 99 } },
];
```

Four costs, each independent of the others:

1. **`appId` on every element.** The runtime knows the app's id. An app that
   writes it can write it wrong.
2. **`blockId` on every element.** Meaningful only as a state key
   ([§3](#3-the-state-round-trip)); the legacy builder defaults it to a
   `uuid()` (`packages/apps-engine/src/definition/uikit/blocks/BlockBuilder.ts:197`),
   which makes the submitted state unreadable unless the app overrides it.
3. **`{ type: 'plain_text', text: … }` for every label.** Nine tokens to say a
   string. `Option` nests it one level deeper again.
4. **`actionId` doubles as the state key** but is declared on the *element*,
   while the value comes back keyed under the *block*.

Everything in this list is mechanical. That is what makes it a type problem.

---

## 3. The state round-trip

The submitted state is assembled client-side and is **two levels deep**:

```ts
// values are collected flat, keyed by actionId …
// packages/fuselage-ui-kit/src/utils/extractInitialStateFromLayout.ts:13
state[element.actionId] = { value: getInitialValue(element), blockId: block.blockId };
// … then re-nested under blockId before submit
// apps/meteor/client/uikit/hooks/useUiKitView.ts:67
obj[blockId][actionId] = value;
```

Two consequences the SDK must handle, and one it can exploit:

- **A value whose block has no `blockId` is silently dropped.** The reducer
  skips any entry with a falsy `blockId`. Generating `blockId` is not a
  convenience; it is correctness.
- **`actionId` must be unique per block** or values collide inside the nest.
- **Errors come back keyed by `actionId`.** `ReportErrorsServerInteraction`
  carries `errors: { [field: string]: string }[]`
  (`packages/ui-kit/src/interactions/ServerInteraction.ts:74`), and
  `useUiKitState` looks each one up by the element's `actionId`.

That last point is the leverage. If the SDK sets `blockId === actionId === the
state key`, then:

- flattening the submitted state is `state[key][key]` — no search, no ambiguity;
- a Standard Schema `issue.path[0]` **is** the actionId, so a failed
  `state` validation maps onto the `errors` interaction with no translation
  layer, and `ctx.ui.open` can re-render with per-field errors for free.

Nothing in the current design gets that, because `key` is not a concept: the
example in [16](../16-surface-interactive-ui.md) passes `key: 'digestChannel'` to a
`blocks.textInput` helper that has no relationship to the `state` schema
declared four lines above it.

### 3.1 A defect this surfaces in the current proposal

[16](../16-surface-interactive-ui.md) binds `maxReminders: z.number()` to
`blocks.textInput(...)`. A `plain_text_input` returns a **string**;
`ActionOf<PlainTextInputElement>` is `PlainTextInputElement['initialValue']`,
i.e. `string | undefined`. The modal in the RFC would fail validation at
runtime on every submit. Nothing in the current shape can catch it, because
`render` returns `readonly UiBlock[]` and `UiBlock` is
`{ readonly type: string; readonly [k: string]: unknown }`
(`packages/app-sdk/src/models.ts:84`).

The wire value types are narrow and enumerable — `ActionOf` in
`packages/ui-kit/src/rendering/ActionOf.ts` already enumerates them. Only three
shapes exist: `string`, `string[]`, `number` (`linear_scale` alone).

---

## 4. The candidate styles

| | identity defaults | text shorthand | per-slot legality | conditionals & loops | discovery |
|---|---|---|---|---|---|
| raw ui-kit types | ✗ | ✗ | ✓ | ✓ | contextual |
| fluent builder (legacy, `slack-block-builder`) | ✓ | ✓ | weak | poor | method names |
| factory functions (`section(…)`, `input(…)`) | ✓ | ✓ | ✓ | ✓ | import names |
| **projected object literals** | ✓ | ✓ | ✓ | ✓ | contextual |

"Contextual" discovery means the completion list comes from the position in the
literal, not from a name you have to know first. [§5.5](#55-autocomplete)
measures what that is actually worth.

---

## 5. The experiments

### 5.1 Raw literals already type-check well

Against `LayoutBlock[]`, TypeScript narrows on the discriminant before
reporting, so the errors are local and specific:

```
error TS2561: Object literal may only specify known properties, but 'txt' does
  not exist in type 'SectionBlock'. Did you mean to write 'text'?
error TS2322: Type '"button"' is not assignable to type '"channels_select" | …'
error TS2322: … is missing the following properties …: appId, blockId, actionId
```

A wrong element in an input slot, a misspelled property, a bad discriminant and
a missing required field are all caught, all pointed at the right member. The
union is not the DX hazard it is often assumed to be. **The problem with raw
literals is not checking. It is boilerplate.**

### 5.2 One projection removes the boilerplate

```ts
type Authored<T> = T extends TextObject
	? string | T
	: T extends readonly (infer U)[]
		? readonly Authored<U>[]
		: T extends object
			? { [K in keyof Omit<T, 'appId' | 'blockId' | 'actionId'>]: Authored<T[K]> } &
			  ('actionId' extends keyof T
					? { actionId?: string; onAction?: (ctx: ActionCtx) => Promise<void> }
					: unknown)
			: T;
```

It reads in both directions at once: it **removes what the runtime knows**
(`appId`, `blockId`), **relaxes what is mechanical** (`actionId`, text objects),
and **adds what only the author knows** (an inline `onAction`, erased at
normalization). Applied to `ModalSurfaceLayout[number]`, the same modal becomes:

```ts
[
  { type: 'section', text: 'Configure reminders.' },
  { type: 'input', key: 'digestChannel', label: 'Digest channel',
    element: { type: 'plain_text_input', initialValue: values?.digestChannel } },
  { type: 'input', key: 'maxReminders', label: 'Max per user',
    element: { type: 'linear_scale', minValue: 1, maxValue: 99 } },
]
```

34% fewer characters, no identity bookkeeping, and every check from
[§5.1](#51-raw-literals-already-type-check-well) still fires. The i18n form
survives too: a text slot accepts `string` or the full `WithTranslations`
object, and `text` stays required as the fallback.

### 5.3 The state binding

Bind the key to the schema, and the element to the field's value type:

```ts
type BoundInput<S> = {
	[K in Extract<keyof S, string>]: {
		type: 'input'; key: K; label: Text; hint?: Text; optional?: boolean;
		element: ElementFor<S[K]>;
	};
}[Extract<keyof S, string>];

type ElementFor<V> =
	[V] extends [string    | undefined] ? Extract<AnyInputElement, { type: 'plain_text_input' | 'static_select' | … }> :
	[V] extends [string[]  | undefined] ? Extract<AnyInputElement, { type: 'multi_static_select' | 'checkbox' | … }> :
	[V] extends [number    | undefined] ? Extract<AnyInputElement, { type: 'linear_scale' }> :
	never;
```

`S` is inferred from the sibling `state:` property, so `render` is checked
against it in the same object literal. Verified rejections:

```ts
state: z.object({ digestChannel: z.string() })
{ type: 'input', key: 'digestChanel', … }              // ✗ not a state key
state: z.object({ maxReminders: z.number() })
{ …, key: 'maxReminders', element: { type: 'plain_text_input' } }   // ✗ §3.1's bug
state: z.object({ owners: z.array(z.string()) })
{ …, key: 'owners', element: { type: 'users_select' } }            // ✗ single select
```

The third one is the point: **the schema and the blocks can no longer
disagree.**

### 5.4 Downward beats upward

The binding survives a data-driven render, because the constraint flows *down*
from the annotation into the callback:

```ts
render: ({ values }) => [
  { type: 'section', text: 'Channels' },
  ...editable.map((key) => ({ type: 'input' as const, key, label: key,
      element: { type: 'plain_text_input' as const, initialValue: values?.[key] } })),
  { type: 'input', key: 'level', label: 'Level', element: { type: 'linear_scale' } },
]
```

A bad key inside the `.map` is still rejected. Two designs that instead infer
*upward* — from the blocks to the state — both collapse here:

| design | static list | `.map()` | conditional spread |
|---|---|---|---|
| infer state from blocks | `{ digestChannel: string; level: number }` | `{ [x: string]: string }` | tail widens to `string` |
| fluent builder accumulation | `{ digestChannel: string; level: number }` | `{}` | `{}` |

Both fail **silently**: no error, just a state type that has quietly become
useless. And both fail on the data-driven form, the case where a typed binding
is worth the most.

Exhaustiveness — "the schema declares `b`, but no block fills it" — is
expressible at the type level with `const` inference, and fails for exactly the
same reason. It belongs in a runtime check at open time, where the SDK holds
both the schema keys and the rendered blocks.

### 5.5 Autocomplete

`tsserver` `completionInfo` at three cursor positions, against the full
integrated design. These are the complete lists returned:

| cursor | completions |
|---|---|
| `render: () => [{ type: '│' }]` in a **modal** | `actions, context, divider, image, input, section, callout` (7) |
| `{ type: 'input', key: '│' }`, state `{ digestChannel, level }` | `digestChannel, level` (2) |
| `key: 'level'` (a `z.number()` field), `element: { type: '│' }` | `linear_scale` (1) |

The modal list is 7, not the 12 of `LayoutBlock` — `video_conf` is not offered
because a modal cannot render it. The element list for a numeric field is
**one**. A builder cannot do this: `.input(key, label, element)` has no way to
narrow its third argument by the first, and no way to narrow its first by a
schema declared on a different call.

Property completions, authored vs. raw:

| position | authored | raw ui-kit |
|---|---|---|
| inside a `button` | `actionId, confirm, dispatchActionConfig, onAction, secondary, style, url, value` (8) | `actionId, appId, blockId, text, confirm, dispatchActionConfig, secondary, style, url, value` (10) |
| inside a `section` | `accessory, fields, text` (3) | `accessory, appId, blockId, fields, text` (5) |

The raw lists offer two properties the author must never fill in. The authored
lists do not, and offer `onAction`, which the wire type has no place for.

### 5.6 Cost

120 blocks, `tsc --extendedDiagnostics`:

| | type instantiations | check time |
|---|---|---|
| raw `LayoutBlock[]` | 818 | 0.08s |
| `Authored<…>[]` | 3129 | 0.09s |

3.8× the instantiations, no measurable check time. Affordable.

The real cost is **error text**. The projection is structural, so a failure
prints the expanded shape instead of a name:

```
… does not exist in type '{ type: "section"; text?: string | Markdown | PlainText
| undefined; accessory?: ({ type: "datepicker"; placeholder?: … '
```

Naming the projection restores it — `interface Section extends
Authored<SectionBlock> {}` gives back `does not exist in type 'Section'` — but
only at the level that is named. A nested element union still prints
structurally, so the fix costs roughly 33 one-line aliases (12 blocks + 21
elements). Mechanical, and each one still *derives* from ui-kit, so nothing can
drift.

---

## 6. What a builder buys, and what it costs

**Buys:** identity defaults; text shorthand; progressive state accumulation
([§5.4](#54-downward-beats-upward)); a discoverable entry point for someone who
does not know the schema exists.

**Costs:**

- *Accumulation is the only one of those a type projection cannot do, and it
  collapses on loops.* The other two are pure type-level problems.
- *Per-slot legality gets weaker, not stronger.* `ModalSurfaceLayout` already
  encodes which blocks a modal may contain. A builder must re-encode it as a set
  of methods per surface, by hand.
- *Composition suffers.* A chain does not compose with `map`, `filter`, a
  conditional spread, or a helper that returns a fragment. An array literal
  does all four.
- *It is a second hierarchy.* This is not hypothetical. The legacy
  `BlockBuilder` is exactly this experiment, already run:

  | | ui-kit | legacy `BlockBuilder` | coverage |
  |---|---|---|---|
  | layout blocks | 12 | 7 | 58% |
  | elements | 21 | 6 | 29% |
  | button styles | 5 | 2 | 40% |

  It is marked `@deprecated please prefer the rocket.chat/ui-kit components` in
  tree, and `IUIKitSurface.blocks` is already widened to
  `Array<IBlock | LayoutBlock>`
  (`packages/apps-engine/src/definition/uikit/IUIKitSurface.ts:16`) so apps can
  bypass it. A parallel authoring hierarchy is the mechanism that produced this
  drift; a projection cannot produce it, because it has no independent
  existence.

A **non-chained factory** (`section('…')`, `input({…})`) avoids the composition
and accumulation problems and keeps the defaults. What it does not buy over a
projected literal is any additional checking — [§5.1](#51-raw-literals-already-type-check-well)
shows the union already discriminates — and it costs the position-narrowed
completion lists of [§5.5](#55-autocomplete), because a function argument is
checked against one type rather than against a slot.

---

## 7. Recommendation

**Answer to [51](../51-open-questions.md) decision 1: neither, exactly.** Do not
adopt ui-kit as-is (the identity triple and the text objects make it hostile to
write), and do not design an app-specific layer (that is the legacy
`BlockBuilder`, and it drifts). Derive an authoring type *from* ui-kit and keep
the values plain data.

Four pieces:

1. **`Authored<T>`, applied per surface.** Export `ModalBlock<State>`,
   `ContextualBarBlock<State>`, `MessageBlock`, `BannerBlock` from the SDK,
   each projected from the matching ui-kit `*SurfaceLayout`. Name each block and
   element projection so error text stays readable
   ([§5.6](#56-cost)).
2. **Move the state key to the input block.** `{ type: 'input', key, label,
   element }`, with `key` bound to `keyof Infer<S>` and the element bound to the
   field's value type. The SDK sets `blockId = actionId = key` at
   normalization, which makes the state flat and the error mapping free
   ([§3](#3-the-state-round-trip)).
3. **`onAction` co-located on clickable elements**, stripped before the block
   goes on the wire and registered under a generated `actionId` — the same move
   [16](../16-surface-interactive-ui.md) already makes for `ActionButton.onClick`.
4. **Normalize in the SDK, not the host.** `string → { type: 'plain_text', text }`,
   fill `appId`, generate `blockId`/`actionId`, strip `key` and `onAction`. A
   pure function over the authored tree. The host keeps receiving exactly the
   ui-kit `View` it receives today, so `isModalView` and the renderers are
   untouched.

The whole thing compiles: a modal with three bound inputs of three different
value types, a callout, a message with two handler-carrying buttons, and three
rejections (`input` in a message, `video_conf` in a modal, `users_select` for a
`string[]` field).

`ctx.ui.confirm` ([16](../16-surface-interactive-ui.md)) falls out as
`ModalBlock<{}>` plus two labels.

### What this replaces

`BlockKit` in `packages/app-sdk/src/ui.ts:128` and the opaque `UiBlock` in
`packages/app-sdk/src/models.ts:84`. Both are placeholders the RFC introduced to
compile offline; neither survives.

---

## 8. Risks

- **Error text.** Mitigated by naming the projections, at the cost of ~33
  aliases ([§5.6](#56-cost)). Not fully solved for deeply nested slots.
- **The projection is only as good as the source.** It inherits every
  inconsistency in ui-kit — `StaticSelectElement.placeholder` is required while
  every other placeholder is optional; `MultiStaticSelectElement` carries both
  `initialValue` and `initialOption`.
- **ui-kit's own type/runtime drift.**
  `MessageSurfaceLayoutBlock` includes `InfoCardBlock`, but `'info_card'` is
  absent from the allow-list the parser passes to `super([...])`
  (`packages/ui-kit/src/surfaces/message/UiKitParserMessage.ts:21` vs `:25`), so
  the type permits a block the renderer drops. The two lists are maintained by
  hand. Deriving the array from the union closes it, and the SDK inherits the
  fix.
- **`ConditionalBlock` recursion.** Its `render` array would need `BoundBlock`
  recursively for the state binding to hold inside it. Not modelled here.

---

## 9. Open questions

1. **Where does the projection live?** In `@rocket.chat/app-sdk` (the SDK owns
   authoring; ui-kit stays a wire/render package), or in
   `@rocket.chat/ui-kit` as a second entry point (`ui-kit/authoring`, usable by
   the core product too)? The second is more reuse and more coupling.
2. **i18n shorthand.** A text slot accepts `string` or the full
   `WithTranslations` object, and `text` stays required as the fallback. The
   rest of the SDK uses `i18nLabel` / `i18nDescription` properties instead. Do
   blocks get a `t('key')` helper, an `i18n:` sibling, or stay as they are and
   diverge from the other surfaces?
3. **Does `key` replace `actionId` entirely on input elements**, or may an app
   still set an explicit `actionId` on one? Allowing both re-opens the ambiguity
   [§3](#3-the-state-round-trip) closes.
4. **Value coercion.** `linear_scale` is the only numeric element. Does a
   `z.number()` field bound to a `plain_text_input` become a hard type error
   (the [§5.3](#53-the-state-binding) behaviour), or is `z.coerce.number()`
   accepted as an escape hatch? Accepting it re-admits the [§3.1](#31-a-defect-this-surfaces-in-the-current-proposal)
   class of bug.
5. **Exhaustiveness.** Runtime check at open time
   ([§5.4](#54-downward-beats-upward)) — throw, or log and send a partial view?
6. **Where does normalization run in a split runtime?** In the app process
   (SDK code) it is a pure function over the authored tree, and the bundle
   carries it. On the monolith side it is one more thing the `ui.open` RPC
   handler must know ui-kit's shape for — but it is then patchable without
   republishing every app. [41](../41-platform-deployment-and-isolation.md).
