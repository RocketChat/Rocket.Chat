# Lowering `styled()` definitions: phase 1 prototype

Phase 1 of "Removing the runtime" in [fuselage-tamagui.md](fuselage-tamagui.md). Branch `proto/fuselage-lowered-styled`, on top of `feat/fuselage-tamagui-pilot`.

## What was built

- **`packages/fuselage/lowerStyled.ts`**: a build plugin, wired into `vite.config.mts` and into Storybook's webpack (`.storybook/lowerStyledLoader.mjs`). For an allowlisted `styled()` definition it:
  1. evaluates the module with the real `@tamagui/web` and the Fuselage config, which gives the frame's merged `staticConfig` (inheritance, `defaultVariants`, `render`, default attributes);
  2. resolves the frame with Tamagui's `resolveStaticElement` (`@tamagui/web/static-resolve`, the resolver the compiler uses) for every reachable combination of the variants that touch each atomic class group (Tamagui's "slot": `border` holds the width, style and every state of the color in one class);
  3. files each slot's class under a key the runtime can compute from props, and keeps the rules Tamagui produced for those classes;
  4. replaces the `styled()` call with `lowered(recipe)` and imports the rules as a stylesheet in the `fuselage` layer;
  5. checks the recipe against Tamagui on about 300 random prop combinations, classes and forced inline styles, and fails the build on any difference.
- **`packages/fuselage/src/lowered/recipe.ts`**: the runtime, about 1 kB minified. It merges props over defaults the way Tamagui does, walks the props in order to build the slot keys, looks up the classes, adds the variant `className`s and the consumer `className`, renders `render` (a tag, or an element whose props it merges), and passes `ref` and the remaining DOM props through. It has no hooks and inserts no CSS.
- **No CSS or class names are generated outside Tamagui.** Every class and rule comes from `resolveStaticElement`. Two pieces of Tamagui logic are mirrored, and the build verifies both against Tamagui:
  - the order model in `slotTuples`: a key set again moves to the end of its slot, and a default variant stays in the base layer;
  - `styleSlot`, which is only used to split the forced inline style by slot.
- `scripts/check-lowered.mts` runs the plugin plus its check on the allowlist. `scripts/measure-lowered.mts` tries every definition in `src/components` without changing anything.

Pilot allowlist:
- `MessageName` (plain frame)
- `ButtonGroup` (variants with `variantClass`, `defaultVariants`, default `role`)
- `ButtonFrame` and `ButtonContent` (per-state values, `forceStyle`, an element `render`, a `color` style prop at the use site)

## What each frame needed

- **Text frames inherit Tamagui's own `numberOfLines`**, a computed variant. The recipe drops that prop. No Fuselage caller sets it.
- **`ButtonGroupFrame` is extended by `styled()` elsewhere** (`NavBarGroup`, `SidebarButtonGroup`, `ModalFooterControllers`). The plugin keeps the Tamagui frame under the exported name, so those definitions still extend it, and points the module's own uses (the public `ButtonGroup`) at the recipe. Once a definition's children are lowered too, its frame can go: they read its `staticConfig` at build time.
- **`ButtonFrame`, variant order.** Tamagui resolves conflicting variants (`kind`, `pressed`, `inactive`, `ghost`) by prop order, and the class depends on that order. Covering every order needs about 116k resolutions.
  - The allowlist marks the frame `ordered`: a caller's variants apply in declaration order. `Button` and `IconButton` already pass them in that order, and the frame's own comments document it.
  - That brings the frame down to 7,258 resolutions, which take 8.7 s with the check.
  - Without `ordered`, all orders are enumerated. That is fine for small frames: `ButtonGroup` takes 36 resolutions.
- **`forceStyle`.** On the client, Tamagui renders a forced frame with `noClass`, so the whole style goes inline.
  - The recipe reproduces this exactly from per-state inline tables that Tamagui resolved.
  - It works, but the tables cost about 74 kB raw in the recipe.
  - The plan's alternative is to emit each state's CSS under its state class (`:hover, .is-hovered`). That is cheaper, but it no longer matches Tamagui's output by construction (see below).
- **`color` at the `IconButton` use site** is a dynamic value. It goes inline. The difference: inline style beats unlayered consumer CSS, where Tamagui's class in the `fuselage` layer did not. No story or app rule relies on it.
- **`isTamaguiComponent`** also recognizes the recipe's `isLoweredFrame` marker, so `Box is={…}` still skips the `rcx-box` base classes.

## Parity

All builds compared against the pilot base, before any change.

**Storybook** (lowering runs in its webpack build too), `perf/story-ab.mjs`, pixels:

| Filter | Pixel-identical |
|---|---|
| button | 49 / 49 |
| message | 34 / 34 |
| buttongroup | 13 / 13 |
| iconbutton | 19 / 19 |
| modal | 13 / 13 |
| sidebar | 9 / 9 |
| bubble | 8 / 8 |
| navbar | 1 / 1 |

**`perf/story-computed.mjs`** (tag, `rcx` classes, every computed property): zero differences on these stories:
- Button: `states` (forced hover, press and focus), `variants`, `sizes`, `as-link`
- IconButton: `states`, `colors`, `with-badge`
- ButtonGroup: `stretch-equal`, `vertical-stretch`, `aligned-at-end`, `wrap`
- Message: `default`, `with-mentions`, and MessageSystem `default`

**Bench pages built against the two `dist`s**, `perf/computed-ab.mjs`, also comparing the bounding box: 0 differences at rest, hovered and focused, for each scenario:

| Scenario | Elements |
|---|---|
| message | 28 |
| buttonGroup | 22 |
| button | 7 |

**Build-time check:** every lowered definition matches `resolveStaticElement` on 300 or more prop combinations, classes and forced styles (`node scripts/check-lowered.mts`).

## Size

`dist`, pilot base against lowered (3 definitions plus `ButtonContent`):

| | raw | gzip |
|---|---|---|
| `fuselage.production.js` | 356,519 → 459,278 (+102,759) | 100,673 → 115,078 (**+14,405**) |
| …the same, without the forced tables | → 384,980 (+28,461) | → 108,279 (+7,606) |
| `fuselage.css` | 97,512 → 249,543 (+152,031) | 12,711 → 22,634 (**+9,923**) |

Almost all of it is `ButtonFrame`. CSS emitted per definition, against what the runtime inserts for the same stories (`perf/runtime-css.mjs`, union over the stories):

| Definition | Emitted ahead of time | Runtime, over its stories |
|---|---|---|
| MessageName | 763 B, 15 rules | 694 B, 11 rules (34 stories) |
| ButtonGroup | 2,605 B, 70 rules | 1,104 B, 28 rules (13 stories) |
| ButtonFrame | 160,499 B, 1,082 rules | 55,834 B, 427 rules (49 stories with every kind) |

**Why `ButtonFrame` is so large:**
- Tamagui groups each property's states into one class. `border` holds the width, the style and four state colors.
- So each reachable kind/pressed/inactive/ghost outcome is its own class carrying all its rules: 94 `border` classes and 98 `background` classes, each with roughly 6 rules of long `var()` fallbacks.
- The runtime only inserts the outcomes a page renders.

**Extrapolation to the whole library** (`node scripts/measure-lowered.mts`, every definition matched by `const X = styled(`, `ordered`, no forced tables):
- **Lowerable: 226 of 230.** The 4 failures are frames with a styled `context`.
  - This only covers what the definition needs. Use-site needs (dynamic values, `group`, `animation:`) are phase 2 work, as the plan lists.
- **CSS:** 2,369 distinct rules, 237 kB raw, **23.9 kB gzip**. `ButtonFrame` is 160 kB raw and 10 kB gzip of that; the next largest are `Tag` (10 kB raw), `BubbleButton` (8.4 kB) and `TabsItem` (8.3 kB).
- **Recipes:** 26.9 kB gzip together, with `ButtonFrame` at 5.6 kB.
- **Estimated net, full conversion:**
  - JS: about −31 kB of runtime, minus part of the 20.5 kB of definitions, plus 27 kB of recipes, plus 1 kB of recipe runtime. Roughly **−15 to −20 kB gzip**.
  - CSS: **+20 to +24 kB gzip**, less what `fuselage.css` already holds from the compiler.
  - Total bytes are roughly a wash. The gain is render cost.
- **The recipe format is not tuned.** Its tables are keyed by strings such as `3=12^;4=12^;`, and an integer encoding would roughly halve it.

## Runtime cost

`perf/run-bench.mjs 9`, both with a root provider, median of 9 runs:

| Scenario | Metric | Pilot | Lowered |
|---|---|---|---|
| buttonGroup (300, fully lowered) | cold mount | 29.1 ms | 7.3 ms (−75%) |
| | update | 17.8 ms | 4.2 ms (−76%) |
| | 3rd update | 10.8 ms | 2.3 ms (−79%) |
| button (300; `Button` still goes through `withFuselageProvider`) | cold mount | 28.3 ms | 8.3 ms (−71%) |
| | update | 18.0 ms | 5.3 ms (−71%) |
| | warm mount | 12.3 ms | 3.3 ms (−73%) |
| message (150; only `MessageName` lowered, the other 8 frames per row still Tamagui) | cold mount | 36 ms | 34 ms (−6%) |
| | update | 20.4 ms | 21.2 ms (noise) |

## Without `@tamagui/web` at all

`perf/stub/` builds a page with `MessageName`, `ButtonGroup` and `Button` from `src`, with the plugin on:
- **`STUB=1` aliases `@tamagui/web` to a 20-line stub.** The build succeeds and the output contains **zero `@tamagui/*` modules**: no `tamagui` string at all, against a dozen in the build without the stub.
- **Size:** 92.3 kB gzip against 132.3 kB, **−40 kB**. Both include React.
- **Rendering:** `perf/stub/compare.mjs` finds 16 elements and **0 differences** in tag, classes, attributes and every computed style. That includes a forced hover, a link `render`, `disabled`, and stretched and vertical groups.
- **Only lowered frames can render under the stub.** Nothing else in the page may render a Tamagui frame: `Icon` is one, so `Button` must not show an icon.
- `FuselageProvider` only needs `ThemeProvider` to pass its children through.

## Tamagui's pipeline, and what is upstreamable

- **Everything style-related is Tamagui's own code.** `styled()` stays the authoring source and the build calls `resolveStaticElement` for every class and rule. The plugin's own logic is limited to evaluating modules, enumerating cases, the class tables and the AST edit.
- **Why not a "library mode" patch to `@tamagui/static`:**
  - Its compiler host is built around use-sites: it extracts JSX elements, and our existing patch adds class tables per element for one variant at a time.
  - Lowering a definition needs a different output: a component plus cross-variant tables.
  - As a yarn patch on the compiled `compilerHost` it would be several hundred lines of new code in `dist`. The existing patches are 10 to 20 lines.
  - The thin plugin over `static-resolve` gets the same output with no patch, so it is the better prototype vehicle.
- **Upstreamable to Tamagui:**
  1. A `resolveStaticDefinition(staticConfig)` (or a compiler "library" target) returning slot tables plus CSS for a definition. The enumeration and the order model in this plugin are the reference.
  2. Exposing the slot of each class in `resolveStaticElement`'s result. `styleSlot` is internal today and had to be mirrored.
  3. An option to render `forceStyle` with state classes instead of `noClass` inline styles. That would make forced states CSS-only and drop the forced tables.
  4. An option for ungrouped per-state atomic classes. The grouped `border`/`background` classes are what makes ahead-of-time CSS grow with the number of variant interactions (the `ButtonFrame` blow-up).

## Assessment: go, with conditions

**Go:**
- Exact parity by construction: classes and rules come from Tamagui, and every build verifies the recipe against Tamagui.
- Render cost drops 70 to 79% on fully lowered components.
- 226 of 230 definitions already lower as far as the definition goes.
- A stub build with zero `@tamagui/*` modules works.

**Conditions before phase 3:**
1. **Variant interactions must stay small, or be declared `ordered`.**
   - Frames like `ButtonFrame`, with four interacting color variants, multiply build time and ahead-of-time CSS.
   - Restructure them: one `look` variant listing the combinations callers use, or `ordered` by default.
   - Or get ungrouped state classes upstream (item 4).
2. **Replace `forceStyle` before converting the 9 frames that use it.** Use state-class CSS (plan phase 2), or upstream item 3. The inline tables work but cost about 74 kB raw for `ButtonFrame` alone.
3. **Compact the recipe encoding** (integer keys), and emit the CSS once for the bundle. Today each module writes its own stylesheet, so a rule two definitions share appears twice.
4. **Cache resolutions by `staticConfig` hash.** Lowering adds about 10 s to each build today, almost all of it `ButtonFrame`.

## Reproduce

```sh
cd packages/fuselage
node scripts/check-lowered.mts            # lower and verify the allowlist
node scripts/measure-lowered.mts          # try every definition
yarn exec vite build --mode production    # dist with lowering
NODE_ENV=production yarn exec storybook build -o <out>
```

The measuring scripts under `perf/` (untracked, as on the pilot) are `story-ab`, `story-computed`, `computed-ab`, `run-bench`, `runtime-css`, `sizes`, and `stub/` (`STUB=1 OUT=… vite build -c perf/stub/vite.config.mjs`, then `node perf/stub/compare.mjs <a> <b>`).
