# Fuselage: refactoring the Tamagui components toward static CSS

Analysis on top of the Tamagui pilot (PR #42942), where the components match `develop` pixel for pixel. The goals:

- a static build;
- more reuse;
- a smaller bundle;
- faster rendering;
- zero runtime, if possible.

## Verdict

- **Zero runtime is not reachable with Tamagui.** The 2026-10-20 spike ran `experimental.zeroRuntime: 'report'` and got 293 violations:
  - 240 are live frame references;
  - 35 are `ThemeProvider`;
  - `forceStyle`, `group` clauses and the `Box`-prop roots only work at runtime.
- **`TAMAGUI_RUNTIME=island` is not zero runtime either.** The runtime stays; it only stops generating CSS, and frames that aren't compiled fall back to inline styles.
- **The Tamagui compiler only flattens literals.** Refactoring the frames for it costs the same as moving them off Tamagui, and still leaves the runtime in the bundle.
- **What works: keep the authoring model, compile it at build time with vanilla-extract.**
  - vanilla-extract *runs* the `.css.ts` modules at build, so `spacing()`, `toCSSValue()`, `textScale()` and every other token helper work unchanged. The literal-only limit that blocks the Tamagui compiler (and StyleX, and Panda) does not apply.
  - It has native `@layer`, `@media`, `@container` and selectors.
  - `recipe()` maps Tamagui variants one to one, with a runtime of about 1 kB.
- **Prototype result:** the Message row (11 components) moved to vanilla-extract:
  - pixel-identical to the pilot (34 of 34 Message stories);
  - 669 of 669 Fuselage tests pass;
  - renders **13x faster** than Tamagui, close to `develop`.
- **The bundle only shrinks once the last `styled()` is gone.** A partial migration costs about +0.6 kB gzip, because both runtimes ship.

## Prototype (branch `analysis/fuselage-static-refactor`)

Changes:

- `src/styles/layers.css.ts`:
  - declares the layers `reset, fuselage`;
  - adds `layered()` and `onHover()` (wrapped in `@media (hover: hover)`);
  - adds the `view` and `text` primitives that reproduce Tamagui's `:where(.is_View)` and `:where(.is_Text)` bases at zero specificity.
- `src/components/Message/Message.css.ts`: the styles of Message, MessageContainer (and its Fixed and Left variants), MessageHeader, MessageNameContainer, MessageName, MessageUsername, MessageTimestamp and MessageBody.
- Each of those components is now a plain element with `rcx-*` classes plus the generated classes. `withFuselageProvider` is replaced by `markStaticComponent`, which keeps `isTamaguiComponent` true so `Box is={…}` still skips `rcx-box--full`.
- Tamagui-only mechanisms became plain CSS:
  - **`group-hover/message`** is now `.message:hover .timestamp`. There are no group subscriptions, so hovering no longer re-renders children.
  - **`forceStyle={getForcedState(className)}`** is now `&.hover, &.is-hovered` and `&.focus.focus-visible` selectors.
  - **Variants** are now `recipe()` variants, and `ThreadMessage` is a `thread` variant.
- Wiring:
  - `vite.config.mts` adds `vanillaExtractPlugin`.
  - `.storybook/main.ts` adds `VanillaExtractPlugin`.
  - `jest.config.ts` adds `@vanilla-extract/jest-transform` for `*.css.ts`, plus a mapper so `./X.css` resolves to the `.css.ts` module. The preset stubs every `.css` import.

### Results

| | `develop` (SCSS) | Tamagui pilot | vanilla-extract prototype |
|---|---|---|---|
| 150 Message rows, warm mount | 1.9 ms | 29.8 ms | **2.3 ms** |
| update (re-render) | 2.2 ms | 20.9 ms | **3.8 ms** |
| cold mount | 4.8 ms | 52.2 ms | **6.8 ms** |
| 300 `Box` (control) | 3.2 ms | 3.5 ms | 3.4 ms |
| `fuselage.production.js` gzip | 34.0 kB | 95.4 kB | 96.0 kB |
| `fuselage.css` gzip | 26.4 kB | 8.6 kB | 9.4 kB |

Notes:

- Benchmark: median of 7 runs, root provider ([bench-proto-7runs.md](bench-proto-7runs.md)).
- Visual check: `perf/story-ab.mjs` compares the pilot and prototype Storybooks; every Message story is pixel-identical.
- DOM: the prototype renders the same structure with 1-3 classes per element instead of 7-14.
- Jest: only snapshots changed (class names); no behavior failure.
- The pilot's `fuselage.production.js` is 325 kB raw (95.4 kB gzip) today, not the 333 kB the proposal doc records.

## Inventory: how far each frame is from static

All 228 `styled()` configs were evaluated with Tamagui stubbed out.

- **225 of 228** use literals or token helpers called with literal arguments. The other 3 are factories called with literals, so they are pre-evaluable too.
- **146 variant keys** across 80 frames. None is a function variant.

| Bucket | Frames | Static path |
|---|---|---|
| (a) no variants, states or media | 107 | `style()`; usually a plain element |
| (b) variants, states or media only | 42 | `recipe()` |
| (c) `group`, `container`, `context` or `forceStyle` | 23 | descendant selectors, native `@container`, state classes, React context + variant |
| (d) root spreads `useTamaguiBoxProps` (public `BoxProps` API) | 55 | static class + `useStylingProps` css-in-js class, as `Box` does on `develop` |
| (e) values from props (progress width, grid spans, icon size, cover image, animation timing) | 7 | `createVar()` + an inline custom property |

Per row, today:

- **Message:** 9 frames and 8 provider wrappers. 6 of the 9 take no runtime input.
- **Item:** 11 frames, 10 wrappers and 6 context providers. 6 of the 11 could be plain elements.

Also seen in the Item row: `ItemContent` has a dependency-less `useLayoutEffect` that calls `setState` on every render. That is a separate fix.

## Reuse

About 34% of all declarations (956 of 2,773) restate `rcx-box--full`.

| Duplication | Today | Shared primitive |
|---|---|---|
| `rcx-box--full` reset (border-box, `auto` min sizes, zero spacing, sans font, tabular nums) | 15 copies under 10 names (`boxFull`, `tableBoxStyle`, `resetBox` ×3, …) | `box` |
| font scale | 7 identical helpers (`textScale`, `textStyle`, `typography` ×2, `toFontStyle` ×2, `font`) plus 21 direct spreads; 72 frames | `text[scale]`, about 14 classes |
| truncation | 3 copies; 45 frames | `truncate`, `lineClamp(n)` |
| focus ring | 4 variants; 13 frames | `focusRing`, `focusBorder` |
| identical frames | BubbleLabel ≡ ChipText, ItemLinkOverlay ≡ ItemGroupTitleOverlay, ThreadMessageLeftContainer ≡ MessageLeftContainer | one each |
| near-identical frames | FieldHint/Error/Description/Link (color only), MessageName ≈ MessageSystemName, 6 Sidebar wrappers ≈ TableWrapper | a `tone` variant, or one frame |

With vanilla-extract these become composed classes (`style([box, text.p2, truncate, …])`): each rule is written once in the CSS and the elements share it. With Tamagui, every frame re-emits them as atomic props and resolves them on every render.

## Plan

Each phase leaves the components pixel-identical and ships on its own.

1. **Foundation** (the prototype already did most of it):
   - wire Vite, Storybook and Jest;
   - add the `layers.css.ts` primitives, named `is_View` and `is_Text` so `consumer-classes.css`, the font-smoothing rule and `isTamaguiComponent` keep matching;
   - add the shared primitives listed under "Reuse".
2. **Buckets (a) and (b), 149 frames:** mechanical conversion, component family by family (Message, Item, Sidebar, Field, Table, Modal…). Each family gets faster right away.
3. **Bucket (c), 23 frames:** `group` becomes descendant selectors, `forceStyle` becomes state-class selectors, `container` becomes native `@container`, and `context` becomes React context plus a variant.
4. **Bucket (d), 55 roots:** static class plus `useStylingProps` (css-in-js) for the styling props, plus `BoxTransforms`. This is what `Divider` already does for its props.
5. **Bucket (e), 7 frames:** each prop-driven value becomes a `createVar()` custom property set inline.
6. **Remove Tamagui:**
   - drop `@tamagui/web`, its patches and `tamagui.config.ts`;
   - keep `FuselageProvider` and `withFuselageProvider` as no-ops for compatibility;
   - fold `consumer-classes.css` into the primitives.

   Expected: JavaScript back to about `develop`'s 34 kB gzip plus about 1 kB of recipe runtime. CSS lands between the pilot and `develop`, smaller than `develop` thanks to the shared primitives (not measured).
7. **Optional, `Box` zero runtime:** `createSprinkles` turns token-valued styling props (`p='x8'`, `bg='light'`, `fontScale='p2'`) into static atomic classes. Arbitrary values (`p={13}`) keep the css-in-js fallback. That is the only runtime styling left after this phase.

## What changes for authors

- Styles live in a sibling `X.css.ts`, not next to the JSX. Variants and per-property states read almost the same as Tamagui 3:
  - `recipe({ base, variants })`;
  - `selectors: { '&:hover': … }`.
- State precedence is explicit. Tamagui ranks press above focus-visible above hover; vanilla-extract follows rule order, so a component whose states set the same property must order them. Hover goes through `onHover()`.
- Class names are hashed (`_1atjrh8k`) and stable per build. The `rcx-*` classes stay as the public contract.
- Snapshots change once, and get shorter.

## Risks and open points

- **Forced hover classes** (`.hover`, `.is-hovered`) sit inside `@media (hover: hover)` in the prototype, whereas `forceStyle` applied them everywhere. Move them out of the media query in the real conversion.
- **Partial migration costs bundle size**, about +0.6 kB per family until Tamagui is removed. It improves speed only.
- **Hover and focus were not covered by the pixel A/B** (static screenshots). The real conversion needs the hover and focus-visible screenshot pass the pilot used.
- **The Tamagui proposal changes direction.** This keeps the pilot's decisions (layers, `rcx-*` contract, no themes, values from `Theme`/`styleTokens`) and drops Tamagui itself. `docs/proposals/fuselage-tamagui.md` needs a decision before phase 2.
