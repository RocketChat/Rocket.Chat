# Fuselage on Tamagui: how much zero runtime the compiler can reach

Tamagui stays, because it is the path to React Native. This measures how far its compiler (`@tamagui/vite-plugin` and `@tamagui/static` 3.0.18) can take Fuselage on web, starting from the pilot (PR #42942), where every component renders through the runtime.

## Verdict

- **Zero runtime holds per element, not per bundle.** The compiler turns a JSX element into a plain DOM element with static atomic classes only when all of these hold:
  - the tag is a Tamagui frame visible at that use-site;
  - the element spreads no props of unknown shape;
  - every style and variant prop is a literal;
  - the frame has no `context`, is not a HOC, and gets no `forceStyle`.

  Everything else keeps the runtime, so the runtime (about 41 kB gzip) never leaves the bundle. `experimental.zeroRuntime: true` would need every frame in the graph to flatten.
- **Ceiling:**
  - about **35-45%** of the Tamagui frames in the room message list;
  - about **0%** of the sidebar rows;
  - about **9%** of all app use-sites that render Tamagui.

  The rest are components with logic: hooks, `BoxProps`, context and nested structure (Field*, Button, Icon, Message/Body/Header, Sidebar items).
- **Measured on the Message row: −58% mount time** (29.2 → 12.4 ms for 150 rows), pixel and computed-style identical to the pilot. That is still 6.5x `develop`, because the frames that can't flatten dominate.
- **The bundle does not shrink.** Compiling adds +3.7 kB gzip of JavaScript and +2.5 kB of CSS: flattened elements carry their class strings, and the runtime stays.

## What the compiler does with our code

| Finding | Evidence |
|---|---|
| Inside the library, only use-sites with no spread can flatten. Every component root forwards `{...props}`, so roots never flatten there (`local/unsafe-style-spread`). | baseline library build: 32 candidates, 20 flattened |
| Local `styled()` configs must be literal in the AST. `spacing()`, `toCSSValue()` and fragment spreads all fail (`local/dynamic-style-value`). | same build |
| `importsWhitelist` exists only in the types. The v3 compiler never reads it. | `grep` of `@tamagui/static/src` |
| Configs of an imported **package** are evaluated for real, so token helpers work there. | app build: 4 of 4 flattened |
| `styled(Base, 'class', {...})` treats the string as style input for frontends (Tailwind), not as a DOM class. The `rcx-*` class has to be a default `className` prop. | computed-style diff lost the `rcx-*` class |
| The compiler only recognizes named imports (`import { MessageName }`), not `F.MessageName`. | 0 candidates with a namespace import |
| The package is evaluated through Vite's ESM module runner. Fuselage and its dependencies (`@rocket.chat/icons`, …) are CJS, and `OwnerDocument` read `window.document` at import, so loading failed. | `exports is not defined`, `module is not defined`, `window is not defined` |
| `group-hover` clauses flatten into real CSS. | MessageTimestamp flattened, hover diff clean |

## Two levers, measured

1. **In the library** (`TAMAGUI_PREVAL=1 TAMAGUI_EXTRACT=1` on the Fuselage build):
   - `prevalStyled.mts` evaluates each component module at build time, with `@tamagui/web` stubbed, and rewrites the `styled()` options as JSON literals before the compiler runs. It only rewrites frames rendered somewhere without a spread; rewriting every frame costs +6.5 kB gzip for nothing.
   - Result: candidates 32 → 96, **flattened 20 → 61**. The rest bail on dynamic props passed at the use-site (26) or spreads (8).
   - That matches the 59 internal spread-free use-sites the inventory predicted.
2. **In the app:**
   - Pure wrappers (`(props) => <XFrame className='rcx-x' {...props} />`) become exported frames: `export default styled(Text, { className: 'rcx-x', … })`.
   - The app's bundler runs the compiler with Fuselage as a component package, so `<MessageName>{name}</MessageName>` flattens in Rocket.Chat's own code.
   - Prototyped for MessageName, MessageUsername, MessageTimestamp and MessageContainer (plus its Fixed and Left variants).

### Bench

Warm mount, root provider, median of 7 runs ([bench-compiler-7runs.md](bench-compiler-7runs.md)):

| | `develop` | pilot | library | app | library + app |
|---|---|---|---|---|---|
| Message ×150 | 1.8 ms | 29.2 | 27.2 | 13.8 | **12.4** |
| Button ×300 | 2.8 | 19.6 | **16.7** | 19.6 | 16.9 |
| Tag ×300 | 1.8 | 14.6 | **12.2** | 14.4 | 12.2 |
| Item ×200 | 5.7 | 58.6 | 57.9 | 63.6 | 58.2 |

- **Update** (re-render) improves less: Message 20.2 → 17.0 ms.
- **Item gains nothing.** Its roots have spreads and context, and its leaves have logic.
- **Equivalence:** `perf/computed-ab.mjs` diffs the tag, `rcx-*` classes, every computed style and the bounding box of each element, with and without hover. Message, Item, Button and Tag all show **0 differences** against the pilot in every variant above.

### Bundle (`fuselage.production.js` / `fuselage.css`, gzip)

| | JS | CSS |
|---|---|---|
| pilot | 95.4 kB | 8.6 kB |
| library compile, every config rewritten | 104.3 | 11.2 |
| library compile, only flattenable configs rewritten | 99.1 | 11.1 |

## Ceiling (TypeScript AST over the library and every app package that imports Fuselage)

- **Public components (285):**
  - 40 are pure frame wrappers, which can become exported frames;
  - 13 map props to variants but also build `rcx-*--modifier` classes, which a frame can't add;
  - 232 have logic (101 hooks or `useTamaguiBoxProps`, 38 wrap other logic components, 30 have their own children structure, …);
  - 31 render no Tamagui at all (`Box`, `Margins`, `Flex`, …).
- **App use-sites:**
  - 7,421 use Fuselage components; 5,341 of them render Tamagui;
  - 498 of those could flatten (9.3%), and only 23 pure or variant sites can't (spread, dynamic variant, `style`).
- **Room message list:**
  - A full message is about 12 frames. About 4 flatten as exported frames, 5 with `MessageHeaderWrapper` compiled in the library, and 6 if `MessageNameContainer`'s `forceStyle`/`role` logic is redesigned: **35-50%**.
  - A sequential message is about 40%.
- **Sidebar and navbar rows:** every per-row component has logic, so about **0%**.
- **Most used, all with logic:** Field, FieldRow, FieldLabel, Button, Skeleton, Icon, TextInput, IconButton. Going past the ceiling means redesigning their APIs (dropping `BoxProps`/`useTamaguiBoxProps` and context hooks), not a mechanical conversion.

## What it takes to ship

1. **Library compile:**
   - `prevalStyled.mts` plus `tamaguiPlugin` in `vite.config.mts`, both prototyped here;
   - the Storybook A/B, which must run against the compiled `dist` because Storybook and Jest run `src`;
   - extracted CSS that lands in the `fuselage` layer (to check: the spike saw it unlayered by default).
2. **Exported frames** (the pattern is worked out in "Exported frames without a provider" below):
   - the 40 pure wrappers and the 13 variant wrappers become `styled()` exports;
   - `rcx-*` classes come from variants;
   - exports are typed through `asPublicFrame`;
   - `isTamaguiComponent` accepts `staticConfig` (done here).
3. **App compile:**
   - an ESM Fuselage build whose whole dependency graph loads under Node (ESM `@rocket.chat/icons`, `fuselage-hooks`, …; `OwnerDocument` is fixed here);
   - the compiler in Rocket.Chat's bundler (`tamagui-loader` 3.0.18 exists for webpack/rspack; the Meteor rspack migration is the entry point);
   - named imports at use-sites.
4. **For React Native:** the same `styled()` sources compile natively, but the web-only parts need platform files: `rcx-*` classes, cascade layers, css-in-js `BoxProps`, `render` tags.

## Exported frames without a provider

Exporting a frame as the public component (so app use-sites can flatten) ran into four problems. Each has a fix, prototyped on `ButtonGroup` and the Message leaves.

| Problem | Fix |
|---|---|
| **A consumer's `className` replaces a `className` default**, so `rcx-button-group` disappeared under `<ButtonGroup className='x'>`. The pilot's wrappers had the same flaw: they spread `{...props}` after their own `className`. | **Variant class names add up** with the consumer's, so every `rcx-*` class comes from a variant: an always-on `rcx: { true }` variant with `defaultVariants: { rcx: true }`, plus one variant per modifier class (`rcx-button-group--small`, `--align-end`, …). This also makes the 13 variant wrappers convertible. |
| Tamagui types `className` inside variants as `never`. | `helpers/variantClass.ts`. |
| React's DOM attribute types don't match Tamagui's (`aria-*` as `Booleanish`), so consumers that spread `HTMLAttributes` failed typecheck. | `helpers/asPublicFrame.ts` exports the frame with its old public props type. The runtime value is still the frame the compiler sees. |
| **A frame with no `ThemeProvider` above throws "Missing theme".** That is why every component went through `withFuselageProvider`, which mounted a fallback provider. Tests, Storybooks and app roots without a provider all relied on it. | `@tamagui/web` is patched so that a frame with no provider acts as its own theme root. Fuselage has a single empty theme, so nothing depends on which root it is. |

**The stylesheet the provider injected now ships in `fuselage.css`:**

- It covers the `:where(.is_View)` and `:where(.is_Text)` bases, the `@scope` rule and the token custom properties.
- `scripts/build-tamagui-css.mjs` writes it from `tamagui.config.ts` into `src/styles/tamagui-base.css`; `--check` fails when the file is stale.
- So `FuselageProvider` is now an optional `ThemeProvider`, and `withFuselageProvider` mounts nothing: with no `takesBoxTransforms`, it returns the component itself.

**Effects:**

- One fewer component per element.
- No runtime `<style>` injection.
- Any component can become an exported frame.
- The CSS grows from 8.7 to 12.0 kB gzip (the base rules plus about 3 kB of token properties, until the spacing scale trims them).

**Layer order bug, introduced by the group change and fixed here.** The layer order is set by each layer's first appearance. `Messages.styles.css` opens a `@layer fuselage` block and was imported before `index.css` declared `@layer reset, fuselage;`, so `reset` would have outranked `fuselage` in the app. The declaration now opens `index.css`, ahead of the imports.

**Second layer order bug, caught by the Storybook A/B: the provider was also what put the order first.**

- **What happened:** the pilot's `FuselageProvider` rendered `@layer reset, fuselage;` as a hoisted `<style>`. Without it, Tamagui's runtime sheet opened `@layer fuselage` before Storybook's style-loader injected normalize in `reset`.
- **Effect:** normalize's `button { font-family: inherit; appearance: button; overflow: visible }` then beat every Button and input frame (53 stories off).
- **Fix:** `styles/layerOrder.ts`, imported by `tamagui.config.ts`, prepends the order statement to `<head>` before any frame renders.
- **The rule:** any page that injects CSS from JavaScript needs the order declared before Tamagui's sheet. Pages that load `fuselage.css` in `<head>` (the app) already had it.

**Compiled `ButtonGroup` at an app use-site:**

- **Flattened:** 14 of 14 bench use-sites.
- **Classes:** variant classes and a consumer's `className` survive as one static class string, and computed styles match the pilot. Only the class order changes.
- **Blocker:** the compiler drops the frame's non-style defaults. `role="group"` (a `role` default) is missing from flattened elements, while the runtime path keeps it.
  - Variants can't carry it; they only apply styles and `className`.
  - So a frame with default attributes (`role`, `type`, `aria-*`) needs a patch to `@tamagui/static` before it can be flattened in apps, or an upstream fix. Its defaults reach `completeProps` but only attributes written at the use-site are emitted.

**Performance** (median of 9, [bench-provfree-9runs.md](bench-provfree-9runs.md)):

- With a root provider: 0-3% faster (one fewer component per element).
- Without one, as in tests and Storybooks: 7-17% faster than the old per-component fallback.

The gain is structural rather than speed.

**Checks:**

- **Fuselage tests:** 669 of 669 pass. 78 snapshots changed, on class names and shifted `_r_N_` ids only.
- **Storybook pixel A/B against the pilot:** all 531 stories are identical, except `tooltip--arrow-positioning-rtl`, which also differs between two runs of the pilot itself. `perf/story-ab.mjs` now waits for an attached root, so Select stories, whose root starts hidden, get captured too.
- **Typecheck:** `tsc` is clean.

## `Box` styling props as Tamagui tokens

**Superseded by draft PR #42974.** Fuselage components will take no styling props: only DOM and ARIA attributes and the variations they declare. That work lands on `develop`; the pilot is then rebased on it.

- Step 5 of that plan removes `BoxProps`, `Margins` and `BoxTransforms`, which makes the token routing in `useTamaguiBoxProps` below moot.
- Step 6 of that plan drops `useTamaguiBoxProps` and `takesBoxTransforms` and turns components into exported frames with the pattern in "Exported frames without a provider" (`variantClass`, `asPublicFrame`). Every component root that spreads `useTamaguiBoxProps` today (55 of them) then stops blocking flattening.

The token configuration below is still useful for the frames' own styles (the space scale of #42973). Don't extend the routing to more props.

Tamagui v3 tokens take no `$` prefix (the runtime even warns about `$x8`), and they resolve per category (`space`, `size`, `radius`). That matches the `x<n>` grammar of `Box` styling props, so `marginBlockEnd='x8'` can be a Tamagui prop as is.

**Prototype:**

- `tamagui.config.ts` declares `space`, `size` and `radius` tokens computed by the same `spacing()`, `size()` and `borderRadius()` helpers, so every value is the one `Box` produces.
- `useTamaguiBoxProps` sends margin, padding, gap, inset, sizes and the plain layout props (`display`, `flex*`, `align*`, `overflow`, `position`) to the frame. Colors, `fontScale`, borders, `elevation` and `size` keep the css-in-js path, because Tamagui has a single `color` category while Fuselage resolves `color`, `backgroundColor` and `borderColor` against different palettes.

**Constraints found:**

- **Every token becomes a `:root` custom property, and nothing turns that off.** Enumerating `x0`-`x1280` injected 208,000 characters of CSS at runtime. The prototype only declares `x0`-`x64` plus the 39 larger measures Rocket.Chat uses: 16,900 characters, about 3-4 kB. The hook resolves any other `x<n>` itself.
- **`none` is a reserved CSS keyword, and Tamagui rejects it as a token name.** `Box` reads `none` as `0px`, so props set to `none` stay on css-in-js.
- **`!important` is lost.** css-in-js emitted `!important` and unlayered rules. Equal computed styles in every check here, but an unlayered app rule on the same property would now win.

**Depends on the spacing scale (draft PR #42973):**

- The official space scale is `x4`, `x8`, `x12`, `x16`, `x20`, `x24`, `x32` and `x40`, plus their negatives, `0`, `none` and `auto`.
- Sizes (width, height, `size`, min/max, inset) are not tokens. Their `x<n>` becomes plain px numbers.

Once that lands, this prototype gets simpler:

- the `space` tokens shrink from about 400 to the 8 steps and their negatives;
- the `size` tokens and the hand-picked `largeMeasures` list go away;
- so does the off-token fallback in `useTamaguiBoxProps`;
- so do most of the injected `:root` properties (about 3-4 kB today).

Rebase this prototype onto it rather than keeping its own token list.

**Results:**

| | pilot | tokens |
|---|---|---|
| 300 `Button`s with 4 styling props, warm mount | 21.8 ms | 20.3 ms (−7%) |
| 300 `Button`s without styling props | 18.9 ms | 19.3 ms (±noise) |
| Exported frames with styling props, compiled in the app (300 rows) | 14.1 ms | **0.9 ms (−94%)** |

Checks:

- **Fuselage tests:** 669 of 669 pass. 69 snapshots changed, all on `class` lines only (the `rcx-css-*` class goes away); no tag, attribute or text changed.
- **Typecheck:** `tsc` is clean.
- **Computed styles:** identical to the pilot on `Button` with styling props.
- **Exported frames with styling props:** they now apply where the pilot dropped them. In the pilot, `MessageTimestamp marginInlineStart='x12'` reached Tamagui as the unknown token `x12` and was ignored.

**What this means:**

- On its own, tokens shave about 7% off components that receive styling props, by skipping css-in-js.
- Their real value: they make a styling prop a literal the compiler can flatten. An exported frame with `marginBlockEnd='x8'` at an app use-site now flattens (7 of 7 in the bench).
- They are also required for React Native, which has no css-in-js.
- They don't change the ceiling for `Button` or `SidebarItem`. Both stay runtime components:
  - `Button` normalizes deprecated props, reads two contexts and renders an inner `rcx-button--content` span that no frame can produce.
  - `SidebarItem` renders `Item`, which has contexts and measures its layout.

  Flattening them means changing their DOM and API (step 4). The most that keeps today's DOM is one runtime frame per `Button`, with its inner span compiled in the library.

## The runtime that stays

Most frames in a room view keep the runtime, so its per-frame cost still matters.

### What a frame costs

`perf/micro` mounts 2,000 elements of one shape with `@tamagui/web` alone. Warm mount, median of 7 ([bench-micro-7runs.md](bench-micro-7runs.md)):

| Shape | µs per element |
|---|---|
| `div` with a class | 1.0 |
| empty frame | 6.8: a **fixed ~5.7 µs per frame** |
| 4 style props / 16 style props | 8.7 / 13.0: **~0.5 µs per prop** |
| 16 props, 3 of them with state clauses | 18.2: **~1.7 µs per prop with states** |
| 4 props and 2 active variants | 10.9: ~1.1 µs per variant |
| parent + child | 18.8 |
| parent with `group` + plain child | 18.7: declaring a group costs nothing |
| parent with `group` + child with a `group-hover` clause | **44.9: +28 µs per subscribing child** |
| 16 props, 11 of them moved to one static class | 9.4: −30% against 16 props |

So the levers, by size:

1. **Group subscriptions.** A runtime frame with a `group-*` clause costs about 5 frames. Compiled frames turn the clause into CSS and pay nothing.
2. **Frames per row:** a fixed 5.7 µs each.
3. **Style props per frame.** About 34% of the declarations are the restated `rcx-box--full` reset.

### Group clauses in the message row

Every message rendered three subscribers to the `message` group: the timestamp, the always-mounted toolbar wrapper, and the toolbar or reaction action once shown.

**Change:** those clauses became layered rules in `Messages.styles.css`. They are `.rcx-message:hover .x` inside `@media (hover: hover)`, plus `:focus-within` and `:focus-visible`, all in the `fuselage` layer where the clauses were. `Message` no longer declares a group.

**Results** (150 rows, median of 15 runs, [bench-nogroup-7runs.md](bench-nogroup-7runs.md)):

| | with group | without |
|---|---|---|
| Message row as the app renders it, warm mount | 29.4 ms | **20.9 ms (−29%)** |
| … cold mount | 53.7 ms | 39.9 ms (−26%) |
| … update | 20.0 ms | 23.1 ms (**+16%**) |
| Message row without toolbar, warm mount | 27.1 ms | 20.6 ms (−24%) |

Checks:

- **Computed styles:** identical, with and without hover; the toolbar wrapper shows and the timestamp color changes.
- **Fuselage tests:** 669 of 669 pass. 4 snapshots changed: `t_group_message` is gone and some atomic hashes moved.

**The update cost is not explained yet:**

- It is not the new CSS: removing those rules leaves it at +18%.
- It is not DOM work: both variants make the same 6 text mutations.
- An update-only profile shows +7% JavaScript, in `applyStylePieceClasses`, `contributeProp` and React's `updateProperties`.
- Removing only the timestamp clause or only the toolbar clause changes neither mount nor update much. Removing both gives the whole effect. That looks like a Tamagui path that differs depending on whether a group has subscribers.

Mounting is what a room switch and scrolling pay for, and it saves more than the update loses (−8.5 ms against +3.1 ms per 150 rows). Still, the update cost needs a Tamagui-side look before this ships.

The same change applies to `Item` (the `ItemActions` clauses on `rcx-item` and `rcx-item-group-header`) and to the Sidebar frames that subscribe.

### Ruled out, or still open

- **Ruled out:**
  - **`withFuselageProvider` per leaf:** 0.3% of the JavaScript in the Item profile.
  - **`ItemContent`'s `setState` on every layout effect:** 0.7%. Still worth fixing, but not for speed.
- **Open:**
  - **Moving static declarations to CSS.** −30% per frame in the microbench, but CSS doesn't exist on React Native. The RN-safe version is a web build step that moves each `styled()` base declaration into a generated layered class. That requires attaching a class Tamagui keeps: the string `baseClassName` is treated as style input, not as a DOM class.
  - **Upstream: memoize `getSplitStyles`** by (static config, props signature, theme, media).
