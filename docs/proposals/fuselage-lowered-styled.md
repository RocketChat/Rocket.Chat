# Lowering `styled()` definitions: phase 1 prototype

Phase 1 of the "Checklist to zero Tamagui runtime" in [fuselage-tamagui.md](fuselage-tamagui.md). Branch `proto/fuselage-lowered-styled-v2`: the first prototype (`proto/fuselage-lowered-styled`) rebased onto the current `feat/fuselage-tamagui-pilot`, where no frame takes `forceStyle` any more and `Button`/`IconButton` take a single `variant`. Every number below is from that rebase.

## What was built

- **`packages/fuselage/lowerStyled.ts`**: a build plugin, wired into `vite.config.mts` and into Storybook's webpack (`.storybook/lowerStyledLoader.mjs`). For an allowlisted `styled()` definition it:
  1. evaluates the module with the real `@tamagui/web` and the Fuselage config, which gives the frame's merged `staticConfig` (inheritance, `defaultVariants`, `render`, default attributes);
  2. resolves the frame with Tamagui's `resolveStaticElement` (`@tamagui/web/static-resolve`, the resolver the compiler uses) for every reachable combination of the variants that touch each atomic class group (Tamagui's "slot": `border` holds the width, style and every state of the color in one class);
  3. files each slot's class under a key the runtime can compute from props, and keeps the rules Tamagui produced for those classes;
  4. replaces the `styled()` call with `lowered(recipe)` and imports the rules as a stylesheet in the `fuselage` layer;
  5. checks the recipe's classes against Tamagui on about 300 random prop combinations, and fails the build on any difference.
- **`packages/fuselage/src/lowered/recipe.ts`**: the runtime, about 1 kB minified. It merges props over defaults the way Tamagui does, walks the props in order to build the slot keys, looks up the classes, adds the variant `className`s and the consumer `className`, renders `render` (a tag, or an element whose props it merges), and passes `ref` and the remaining DOM props through. It has no hooks and inserts no CSS.
- **No CSS or class names are generated outside Tamagui.** Every class and rule comes from `resolveStaticElement`. Two pieces of Tamagui logic are mirrored, and the build verifies both against Tamagui:
  - the order model in `slotTuples`: a key set again moves to the end of its slot, and a default variant stays in the base layer.
- `scripts/check-lowered.mts` runs the plugin plus its check on the allowlist. `scripts/measure-lowered.mts` tries every definition in `src/components` without changing anything. `scripts/measure-button-reachable.mts` splits `ButtonFrame`'s CSS by slot and keeps only what `getButtonStates` can produce.
- `LOWER_STYLED=0` turns the plugin off, in the library build and in Storybook, for A/B builds from one checkout.

Pilot allowlist:
- `MessageName` (plain frame)
- `ButtonGroup` (variants with `variantClass`, `defaultVariants`, default `role`)
- `ButtonFrame` and `ButtonContent` (per-state values, an element `render`, a `color` style prop at the use site)

## What each frame needed

- **Text frames inherit Tamagui's own `numberOfLines`**, a computed variant. The recipe drops that prop. No Fuselage caller sets it.
- **`ButtonGroupFrame` is extended by `styled()` elsewhere** (`NavBarGroup`, `SidebarButtonGroup`, `ModalFooterControllers`). The plugin keeps the Tamagui frame under the exported name, so those definitions still extend it, and points the module's own uses (the public `ButtonGroup`) at the recipe. Once a definition's children are lowered too, its frame can go: they read its `staticConfig` at build time.
- **`ButtonFrame`, variant order.** Tamagui resolves conflicting variants (`kind`, `pressed`, `inactive`, `ghost`) by prop order, and the class depends on that order. Covering every order needs about 116k resolutions.
  - The allowlist marks the frame `ordered`: a caller's variants apply in declaration order. `Button` and `IconButton` already pass them in that order, and the frame's own comments document it.
  - That brings the frame down to 7,258 resolutions, which take 1.4 s with the check (8.7 s in the first prototype, which also resolved every forced state).
  - Without `ordered`, all orders are enumerated. That is fine for small frames: `ButtonGroup` takes 36 resolutions.
- **`forceStyle` is gone from the pilot**, and so are the recipe's forced-state inline tables (74 kB raw of `ButtonFrame`'s recipe in the first prototype). The recipe now only maps props to classes.
- **`color` at the `IconButton` use site** is a dynamic value. It goes inline. The difference: inline style beats unlayered consumer CSS, where Tamagui's class in the `fuselage` layer did not. No story or app rule relies on it.
- **`isTamaguiComponent`** also recognizes the recipe's `isLoweredFrame` marker, so `Box is={…}` still skips the `rcx-box` base classes.

## Parity

Both Storybooks and both `dist`s come from the same checkout, with `LOWER_STYLED=0` for the unlowered side.

**Storybook** (lowering runs in its webpack build too), `STORY_AB_WAIT=2000 perf/story-ab.mjs`, pixels:

| Filter | Pixel-identical |
|---|---|
| button (Button, IconButton, ButtonGroup, SplitButton, RadioButton) | 49 / 49 |
| message | 34 / 34 |
| modal | 13 / 13 |
| sidebar | 9 / 9 |
| bubble | 8 / 8 |
| navbar | 1 / 1 |

**`perf/story-computed.mjs`** (tag, `rcx` classes, every computed property, 20 elements shown at most): zero differences on these stories:
- Button: `states`, `variants`, `sizes`, `as-link`, `loading` (one run showed the spinner's `transform` mid-animation; a second run showed none)
- IconButton: `states`, `colors`, `variants`, `icon-button-with-badge`
- ButtonGroup: `stretch-equal`, `vertical-stretch`, `aligned-at-end`, `wrap`
- SplitButton: `variants`, `call-controls`
- Message: `default`, `with-mentions`, `with-clickable-author-name`, and MessageSystem `default`

The first prototype's bench-page comparison (`perf/computed-ab.mjs`, at rest, hovered and focused) was not rerun.

**Build-time check:** every lowered definition matches `resolveStaticElement` on 300 or more prop combinations (`node scripts/check-lowered.mts`): 303 for `MessageName`, 311 for `ButtonGroup`, 353 for `ButtonFrame`, 302 for `ButtonContent`.

## Size

`dist`, `LOWER_STYLED=0` against lowered (3 definitions plus `ButtonContent`), gzip level 9:

| | raw | gzip |
|---|---|---|
| `fuselage.production.js` | 354,493 → 382,709 (+28,216) | 100,139 → 107,549 (**+7,410**) |
| `fuselage.css` | 94,197 → 246,228 (+152,031) | 12,889 → 22,856 (**+9,967**) |

The first prototype added 14.4 kB gzip of JS, 6.8 kB of it the forced-state tables. Those are gone; the CSS is byte for byte the same as before, because `forceStyle` never produced any.

Lowering adds about 1 s to the library build (3.4 s → 4.4 s), against about 10 s before.

CSS emitted per definition, against what the runtime inserts for the same stories (`perf/runtime-css.mjs`, union over the stories):

| Definition | Emitted ahead of time | Runtime, over its stories | Recipe |
|---|---|---|---|
| MessageName | 763 B, 15 rules | 694 B, 11 rules (34 stories) | 693 B |
| ButtonGroup | 2,605 B, 70 rules | 1,104 B, 28 rules (13 stories) | 1,854 B |
| ButtonFrame | 160,499 B, 1,082 rules (9.7 kB gzip) | 55,834 B, 427 rules (49 stories) | 26,520 B (5.6 kB gzip) |
| ButtonContent | 367 B, 11 rules | — | 574 B |

**What `ButtonFrame`'s CSS is made of** (`node scripts/measure-button-reachable.mts`):

| Slot | Classes emitted | Bytes | Reachable from `getButtonStates` | Bytes |
|---|---|---|---|---|
| `borderColor` (`border` group) | 94 | 77,337 | 28 | 22,735 |
| `backgroundColor` | 98 | 71,210 | 32 | 22,891 |
| `color` | 32 | 4,015 | 31 | 3,908 |
| `boxShadow` | 14 | 3,994 | 13 | 3,727 |
| everything else | | 3,943 | all | |
| **Total** | 1,082 rules | **160,499 B, 9.7 kB gzip** | 440 rules | **57,405 B, 5.7 kB gzip** |

"Reachable" resolves every prop set `Button` and `IconButton` can produce through `getButtonStates` (each kind, disabled or not, pressed or not, every segment position with and without each ghost variant, every size, `square`, `icon`, `compact`, `withBadge`, `squareSize`): 31,200 prop sets, 163 distinct classes, each checked against `resolveStaticElement`. Those 57.4 kB match what the runtime inserts over all 49 button stories (55.8 kB).

**Why `ButtonFrame` is so large:**
- Tamagui groups each property's states into one class. `border` holds the width, the style and four state colors; `background` holds four state colors. Each class carries about 6 rules of long `var()` fallbacks.
- The plugin enumerates `kind` (13 values), `pressed` (5), `inactive` (13) and `ghost` (5) as independent variants, each also unset.
- Callers only produce a small part of that space. `getButtonStates` always sets `inactive` to the same kind as `kind`, and `pressed` only to that kind when it is pressable. Combinations such as `kind: primary, inactive: danger` or `kind: secondary, pressed: icon-info` cannot happen, yet each gives a distinct `border` and `background` class.
- 66 of the 94 `border` classes and 66 of the 98 `background` classes (103 kB raw) are unreachable.

**Extrapolation to the whole library** (`node scripts/measure-lowered.mts`, every definition matched by `const X = styled(`, `ordered`):
- **Lowerable: 226 of 230.** The 4 failures are frames with a styled `context`: `AvatarElementFrame`, `AvatarStackFrame`, `CardFrame`, `CardCol`.
  - This only covers what the definition needs. Use-site needs (dynamic values, `context:`, `animation:`) are the checklist's step 3.
- **CSS:** 2,369 distinct rules, 237 kB raw, **23.9 kB gzip**. Without `ButtonFrame`: 1,356 rules, 83 kB raw, **15.2 kB gzip**. The next largest after `ButtonFrame` are `Tag` (10 kB raw), `BubbleButton` (8.4 kB) and `TabsItem` (8.3 kB).
- **Recipes:** 26.9 kB gzip together, with `ButtonFrame` at 5.6 kB.
- **Estimated net, full conversion:**
  - JS: about −31 kB of runtime, minus part of the 20.5 kB of definitions, plus 27 kB of recipes, plus 1 kB of recipe runtime. Roughly **−15 to −20 kB gzip**.
  - CSS: **+20 to +24 kB gzip** as emitted today; about **+19 to +21 kB** if `ButtonFrame` emitted only its reachable classes. Less what `fuselage.css` already holds from the compiler.
  - Total bytes are roughly a wash. The gain is render cost.
- **The recipe format is not tuned.** Its tables are keyed by strings such as `3=12^;4=12^;`, and an integer encoding would roughly halve it.

## Gate: `ButtonFrame`'s ahead-of-time CSS against the runtime's

**No-go as it stands, and the fix is known.** `ButtonFrame` emits 160.5 kB raw (9.7 kB gzip) ahead of time against the 55.8 kB the runtime inserts over its 49 stories: 2.9 times as much, the same as in the first prototype. Removing `forceStyle` only removed the JS tables; it never touched the CSS.

The excess is not inherent to lowering. The classes callers can reach come to 57.4 kB raw (5.7 kB gzip), within 3% of the runtime's figure. The other 103 kB are `border` and `background` classes for `kind`/`pressed`/`inactive`/`ghost` combinations that `getButtonStates` never produces. Step 2 of the checklist targets exactly that:
- One combined color variant (for example `look: 'primary' | 'primary-disabled' | 'icon-info-pressed' | …`, with ghost per segment) whose values are only the combinations `getButtonStates` produces. That should bring `ButtonFrame` to about 57 kB raw, close to the runtime, with no change to the plugin.
- Or keep the four variants and let the allowlist declare the reachable combinations; this is weaker, since nothing then stops a caller from passing an unlisted one.

## Runtime cost

From the first prototype, not rerun on this rebase.

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

From the first prototype, not rerun on this rebase.

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
  3. ~~An option to render `forceStyle` with state classes~~: no longer needed, Fuselage dropped `forceStyle`.
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
2. ~~Replace `forceStyle`~~: done on the pilot; the forced tables are gone from the recipe.
3. **Compact the recipe encoding** (integer keys), and emit the CSS once for the bundle. Today each module writes its own stylesheet, so a rule two definitions share appears twice.
4. **Cache resolutions by `staticConfig` hash.** Lowering adds about 1 s to the library build without the forced states, almost all of it `ButtonFrame`; a full conversion will need the cache.

## Reproduce

```sh
cd packages/fuselage
node scripts/check-lowered.mts            # lower and verify the allowlist
node scripts/measure-lowered.mts          # try every definition
node scripts/measure-button-reachable.mts # ButtonFrame CSS by slot, emitted against reachable
yarn exec vite build --mode production    # dist with lowering
LOWER_STYLED=0 yarn exec vite build --mode production --outDir <out>  # the same without
NODE_ENV=production yarn exec storybook build -o <out>
```

The measuring scripts under `perf/` (untracked, as on the pilot) are `story-ab`, `story-computed`, `computed-ab`, `run-bench`, `runtime-css`, `sizes`, and `stub/` (`STUB=1 OUT=… vite build -c perf/stub/vite.config.mjs`, then `node perf/stub/compare.mjs <a> <b>`).
