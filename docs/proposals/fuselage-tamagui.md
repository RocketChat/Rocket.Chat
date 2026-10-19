# Proposal: Fuselage components on Tamagui

## Status

Pilot. 40 Fuselage components render with Tamagui (`@tamagui/web` 3.x), each through its own `feat(fuselage): render … with Tamagui` commit:

- No SCSS is left in the package, and Sass is no longer a dependency. `src/index.css` is the stylesheet entry.
- 24 components keep a flat plain-CSS file (`<Name>.styles.css`) for what Tamagui cannot express (see "What stays plain CSS"). The others are styled by Tamagui alone.
- Untouched: `Box` itself, `Dropdown`, `Select`, `AutoComplete` and the components that were already plain compositions, such as `Flex`, `Margins` and the inputs. They are not migrated.

Component SCSS went from 5,923 lines to none, and about 2,650 lines of plain CSS remain. The biggest pieces:

- `InputBox` (512): native `:invalid`, and the class names consumers put on their own elements;
- `Box` (463): `rcx-box` base classes and `withRichContent`;
- `Message` (315);
- `Select` (267);
- `Field` (251): rich text inside hints and descriptions.

## Why migrate

The goal is one styling system for Fuselage and for the packages built on it. Today a component's styles come from three places:

- the SCSS compiled into `fuselage.css`;
- the runtime css-in-js behind `Box` styling props and `` css`…` `` template literals;
- inline styles.

A package that wants to extend a component copies SCSS or overrides `rcx-*` classes with loose CSS.

The reasons, in order of weight:

1. **Leave SCSS, the css-in-js runtime and `Box` behind.**
   - The pilot already removed the SCSS: 5,923 lines went to none, and Sass is gone from the build, Storybook and lint. About 2,650 lines of plain CSS remain, for what Tamagui cannot express.
   - The css-in-js runtime is the next step:
     - `@rocket.chat/css-in-js` and `stylis` are about 10 kB gzip, on top of the Fuselage bundle;
     - `<Box>` has 1,917 use-sites in 875 files outside Fuselage, and 527 inside it;
     - `` css`…` `` appears 173 times;
     - about 97 public components accept `BoxProps`.
2. **Extend and reuse components from other packages.**
   - `styled(Component, { … })` inherits a component's variants, states and tokens, with types.
   - 45 components are already their own Tamagui frame (see "Compiled with the Tamagui compiler"), so they can be extended this way today.
3. **Enforce our tokens and patterns.**
   - Values come from helpers typed by the token lists (`spacing`, `size`, `borderRadius`, the `Theme` colors), so a value outside the scale does not compile.
   - Variants and states are declared once, next to the component, instead of SCSS modifiers and overrides.
   - Values still resolve to `--rcx-*` custom properties, so palettes, dark mode, high contrast and admin Custom CSS keep working.
4. **Performance and size: gains are welcome, but nothing extreme is promised.** The result is mixed today and depends on running the compiler in the app:

   | Better | Worse |
   |---|---|
   | `fuselage.css` 26.7 → about 12 kB gzip; 12.7% of it used on a room page, against 5.5% of `develop`'s | `fuselage.production.js` 34.4 (plus about 10 kB of css-in-js) → 96.5 kB gzip |
   | Compiled in an app: 150 messages mount in 10.1 instead of 16.1 ms, 300 button groups in 1.5 instead of 11.8 ms, and 200 sidebar rows from `PureItem` in 1.7 ms (`develop`'s `Item` took about 5.7 ms in an earlier run) | Without the compiler in the app, mounting is slower than `develop`: 150 messages take 16.1 ms, against about 1.8 ms in an earlier run |
   | — | A full style recalc costs 3.51 ms instead of 2.39 ms per thousand elements, because atomic classes give each element about 3.2× more matching rules |

5. **React Native, as a bonus.** The same `styled()` sources compile for native, so sharing components with the mobile app becomes cheap if it is ever wanted. It is not a reason to migrate on its own.

## Plan

1. **Phase 0, on `develop`, without Tamagui:** fix the API inconsistencies first, so migrating each component only changes how it is styled. [fuselage-phase-0-inventory.md](fuselage-phase-0-inventory.md) lists 57 findings:
   - 43 are non-breaking: `className` replaced or dropped, props dropped, state discovered after mount, state carried by class names, default styling written as runtime styling props;
   - 14 need a deprecation now and a removal in 9.0.0: naming, polymorphism, `BoxTransforms`, `BoxProps` on components that are not layout primitives.

   Each fix is its own pull request and pays off even if the migration stops.
2. **Phase 1, this pilot:** components render with Tamagui, and the library's own frames are compiled.
3. **Phase 2, replace `Box` and the css-in-js runtime:**
   - layout primitives as compiled frames, with styling props kept only on them;
   - a codemod for static `Box` usage;
   - the Tamagui compiler in Rocket.Chat's bundler (the rspack migration, #42862);
   - then `TAMAGUI_RUNTIME=island` to drop most of the runtime.
4. **9.0.0:** the breaking removals from the phase 0 inventory.

## Costs and risks

- **Bundle:** the Tamagui runtime stays bundled until most use-sites compile.
- **Runtime cost:** without the compiler in the app, frames cost more to mount than `Box` with `rcx-*` classes. The performance case depends on phase 2.
- **Patches:** six patches on Tamagui 3.0.18:
  - React 19 ref cleanups;
  - `forceStyle` and `onLayout` leaking to the DOM (Fuselage no longer passes `forceStyle`);
  - `stopPropagation()` after every `onClick`;
  - frames without a provider;
  - two in the compiler.

  Tamagui is maintained mostly by one person.
- **Replacing `Box`:** about 1,900 app use-sites have to move to the new primitives, through a codemod plus manual work.

## Alternatives considered

- **Plain CSS or CSS modules, no Sass:**
  - removes Sass and keeps zero runtime;
  - but gives no typed extension or token enforcement, still needs its own replacement for `Box` and the css-in-js, and has no native path.
- **vanilla-extract:**
  - typed, zero-runtime styles;
  - web only, and extending a component means composing class names rather than inheriting variants.
- **StyleX, with react-strict-dom for native:**
  - compile-time atomic CSS with zero runtime, and a native path;
  - the closest alternative. It needs its compiler everywhere from day one, with no runtime fallback, and was not measured against the pilot.

## Problem

Fuselage styles come from three places: the SCSS compiled into `fuselage.css`, the runtime css-in-js behind `Box` styling props, and inline styles. Tamagui would put component styles, variants and pseudo states next to the component in TypeScript, and could later let a compiler extract them.

An earlier attempt, branch `feat/fuselage-tamagui-v3` of the now-archived `RocketChat/fuselage` repository, migrated about 60 components on `@tamagui/core` 2.0 RCs. It never merged. Its problems shaped every decision below:

- It needed `react-native-web` and a hand-written `react-native` type shim.
- Colors and themes were copies of the tokens. The high-contrast theme was identical to the light one, and Rocket.Chat palettes and custom themes no longer reached migrated components.
- `rcx-*` class names disappeared, which breaks e2e selectors, app CSS and admin Custom CSS.
- `Box` props were half-supported through inline styles, and `is` polymorphism was dropped.
- Each consumer needed a provider, plus Jest `transformIgnorePatterns` patches.
- It added roughly 55 `@ts-ignore` and 170 `as any`.

## Decisions in the pilot

### `@tamagui/web`, not `@tamagui/core`

`@tamagui/core` pulls `react-native-media-driver`, whose peer is `react-native-web`. `@tamagui/web` exposes the same `styled`, `View`, `createTamagui` and `ThemeProvider` with no React Native dependency, so no shim is needed.

### No Tamagui tokens or themes

`tamagui.config.ts` declares empty token groups and a single `light` theme, only because Tamagui requires a theme context. Values come from the helpers Fuselage already has, `Theme.ts` and `styleTokens.ts`, so every color is `var(--rcx-color-…, fallback)`.

Because of that, `PaletteStyleTag`, dark mode, high contrast and custom themes keep working with no Tamagui theme switching. Component hooks such as `--rcx-divider-color` keep working too, through `toCSSValue`.

### Tamagui styles live in the `fuselage` cascade layer

With SCSS, overriding a component relied on source order between rules of equal specificity. Those overrides came from `Box` styling props (css-in-js), wrapper classes like `.rcx-sidepanel--divider`, app CSS and admin Custom CSS. Tamagui inserts its rules at runtime, so source order no longer means anything.

The build pins `TAMAGUI_CSS_LAYER=fuselage`, so all Tamagui rules sit in a cascade layer. Unlayered CSS always beats layered CSS, whatever the insertion order.

The other side of that rule: an unlayered **element** selector beats a layered class. Rocket.Chat's Meyer reset (`div, span, a, … { margin: 0; padding: 0; border: 0 solid }`) would wipe Tamagui margins, paddings and borders on every `div`. Two changes handle this:

- `fuselage.css` declares the order `@layer reset, fuselage;`.
- Rocket.Chat's `reset.css` moves into `@layer reset`.

A layer's place is fixed by its first appearance anywhere in the document, so the order statement has to come first:

- `src/index.css` opens with it, ahead of the `@import`s, because an imported stylesheet that opens a `fuselage` block would otherwise register `fuselage` before `reset`.
- `styles/layerOrder.ts`, loaded with the Tamagui config, prepends it to `<head>` before any frame inserts Tamagui's runtime sheet. Pages that inject their CSS from JavaScript (Storybook's style-loader) would otherwise see Tamagui's `fuselage` sheet before their `reset` stylesheet. That let normalize's `button { font-family: inherit; appearance: button; overflow: visible }` beat every Button and input.

Among the stylesheets in `main.css` and `fuselage.css`, layering the reset changes no existing rule. Only zero-specificity rules used to lose to it, and the ones that exist (`*` and `:where()` rules) set none of the properties the reset sets. Stylesheets loaded before `main.css` were not audited. Any consumer that loads its own reset (normalize, for example) has to put it in the `reset` layer too. Fuselage's Storybook does this in `.storybook/normalize.css`.

### `@tamagui/web` is bundled into `dist`

Tamagui reads its settings from `process.env` at runtime. The Fuselage Vite build bundles it and pins those reads, through `pinTamaguiEnv` in `vite.config.mts`, so consumers need no bundler config. Meteor, Webpack Storybooks and Jest all load the CommonJS bundle as before.

Fuselage's own Jest and Storybook run on `src`. For those:

- The shared client Jest preset transforms `@tamagui/*` ESM.
- Fuselage's Storybook defines `TAMAGUI_CSS_LAYER` itself.

### `FuselageProvider` is optional

Tamagui throws "Missing theme" without a theme context. Fuselage removes both reasons a provider was required:

- **Theme context:** the `@tamagui/web` patch lets a frame with no `ThemeProvider` above act as its own theme root. Fuselage has a single empty theme, so nothing depends on which root a frame uses.
- **Base stylesheet:** Tamagui's base stylesheet (`:where(.is_View)`, `:where(.is_Text)`, the `@scope` rule) ships in `fuselage.css`.
  - `scripts/build-tamagui-css.mjs` (`yarn tamagui-css`) writes it from `tamagui.config.ts` into `src/styles/tamagui-base.css`.
  - `yarn lint` fails when the file is stale.

`FuselageProvider` is a bare `ThemeProvider` (with `addThemeClassName: false`) that lets the components under it share one root. It adds no DOM element. `withFuselageProvider` mounts nothing: it registers the component for `isTamaguiComponent` and adds `BoxTransforms` handling where asked.

`TamaguiProvider` was rejected for two reasons:

- It wraps the tree in a `display: contents` span.
- In development it adds a hidden revision span.

Either one would have changed every snapshot.

Rocket.Chat mounts one `FuselageProvider` at the app root, so components share it. Tests, Storybooks and other roots need nothing; each frame there is its own root.

### Props, class names and `is` stay the same

- **Styling props:** `Divider` still takes `BoxProps`. Styling props become a css-in-js class name through `useStylingProps`; it is unlayered, so it still wins over Tamagui.
- **`rcx-*` props:** they still become class names through `prependRcxClassNames`.
- **`is`:** it maps to Tamagui's `render`.
- **Class names:** `rcx-divider`, `rcx-divider--vertical`, `rcx-divider--danger`, `rcx-divider__bar` and `rcx-divider__wrapper` are all kept.

The component must not get `rcx-box--full`. It is an unlayered reset of margin, padding and border, so it would win over the Tamagui styles.

## Measurements

| | `develop` | Pilot |
|---|---|---|
| `fuselage.production.js` | 130.6 kB (34.4 kB gzip) | 333.0 kB (96.5 kB gzip) |
| `fuselage.css` | 255.0 kB (26.7 kB gzip) | 73.8 kB (8.7 kB gzip) |

JavaScript and CSS together grow by about **+44 kB gzip**:

- The Tamagui runtime alone accounted for +41 kB gzip, measured when only `Divider` had moved. That figure already includes pinning `NODE_ENV=production` in the production bundle, which removed Tamagui's development branches (about 12.5 kB gzip).
- The component definitions move from CSS into JavaScript.

**Visual check:** the Storybook of every Fuselage story (531) was screenshotted against `develop` in the same Chromium. All 531 are pixel-identical.

The Rocket.Chat login page (`yarn dev:next` against open.rocket.chat) is also pixel-identical to a `develop`-based build. It renders 30 Tamagui elements: `Tile`, `FieldGroup`, `Field`, `Label`, `Icon`, `ButtonGroup` and `Button`.

**Jest:**

- 213 Fuselage snapshots, 102 Rocket.Chat client snapshots and the snapshots of 10 packages changed.
- After normalizing, every one of those diffs shows only expected changes: Tamagui atomic classes, the removed `rcx-box rcx-box--full`, moved `rcx-css-*` classes, `rcx-*` class order, and shifted `_r_N_` ids (Tamagui's theme state calls `useId`).
- No tag, attribute, text or `rcx-*` class was added or lost.

### Compiled with the Tamagui compiler

`vite.config.mts` runs `@tamagui/vite-plugin` over the library, so a frame rendered with literal props becomes a plain element with static classes and no Tamagui component at runtime.

- **Literal definitions:** the compiler reads a module's `styled()` options without running them, and our values come from functions (`spacing`, `fontScale`, `String(...)`). `prevalStyled.ts` evaluates each component module at build time and rewrites the options as JSON, only for frames the module renders somewhere without a spread.
- **Two patches to `@tamagui/static`** (`.yarn/patches`):
  - a frame's non-style defaults (`role`, `type`, `aria-*`) stay on the flattened element; upstream drops them on the web;
  - a variant given a runtime value (`selected={isSelected}`) compiles to a lookup over the variant's classes instead of bailing out, so per-row state no longer stops a row from flattening.
- **Layering:** extracted rules are wrapped in the `fuselage` layer (`wrapExtractedCSS`).
- **Verification:** Jest and Storybook run `src`, so the compiled code is only checked through `dist`: the computed-style diff of the bench pages and the `ui-client` Storybook built against it.

**Exported frames.** Components that only style one element are the frame itself, so an app that runs the compiler flattens its use-sites too:

- 45 of them: the Message leaves and containers, Card parts, States, Sidepanel, `ButtonGroup`, `NavBar` and others;
- every `rcx-*` class comes from an always-on variant (`helpers/variantClass.ts`), because a consumer's `className` replaces a `className` default but adds to variant classes;
- `helpers/asPublicFrame.ts` keeps each component's public props type.

**`PureItem` and its parts** are the `Item` frames with nothing worked out at runtime: the row declares its surface, pointer, gap, highlight and ARIA ids. `Item` itself also takes `multiline` and `interactive`, which skip the re-render it otherwise needs to find them out.

| Compiled in the app, median of 9–11 runs | warm mount | update |
|---|---|---|
| 150 messages | 16.1 → 10.1 ms | 19.6 → 15.9 ms |
| 300 button groups | 11.8 → 1.5 ms | 17.4 → 1.9 ms |
| 200 sidebar rows, `Item` → `PureItem` | 38.5 → 1.7 ms | 31.4 → 2.6 ms |

The computed styles match in every case, at rest, hovered and focused. Components with hooks, context or `BoxProps` (about 230 of the public components) still render through the runtime.

## Removing the runtime

**Where the bytes go** (`fuselage.production.js`, 100.7 kB gzip, attributed through source maps):

| | gzip |
|---|---|
| `@tamagui/*` runtime (`web` 26.3 kB, `helpers` 3.3, `style-grammar` 1.0, the rest 0.6) | 31.2 kB |
| The 249 `styled()` and `createStyledContext()` definitions | 20.5 kB |
| Component logic and everything else | 49.0 kB |

css-in-js is external. Its closure costs consumers another 6.2 kB, plus a render-time pass on every `Box`.

**Tamagui's own zero-runtime mode doesn't fit.** In 3.0.18 it sits under `experimental.zeroRuntime`.

- **Enforce mode needs an application build:** an HTML entry. It also fails when an exported `styled()` binding has importers it didn't transform, and every consumer of a library is such an importer.
- **It only supports `vite`, `next-webpack` and `metro-web`.** Rocket.Chat builds with rspack.
- **Its report on the library lists 276 violations.** 214 are definitions it can't erase because something outside the module still uses them. 53 are dynamic values, and 36 of those are React context providers it mistakes for theme updates. 8 are unsafe spreads, and 1 is an animation.

**Flattening use-sites isn't enough either.** A flattened element no longer calls the runtime, but its `styled()` definition stays in the bundle. 34 definitions are already orphans and still run `createComponent` at load. The 63 exported frames only flatten in an app that runs the compiler.

**The approach: compile the definition, not the use-site.** Tamagui stays the authoring tool and the compiler: frames are still written with `styled()`, and Tamagui's own build code produces their CSS and class names. Only its runtime leaves the browser. The build turns each `styled()` definition into a recipe, preferably by extending `@tamagui/static`, as the existing patches do, rather than with a separate plugin:

- At build time, Tamagui itself produces the atomic CSS for every value the definition can take: base, each variant value, each state. `prevalStyled` already evaluates the options, and the `@tamagui/static` patches already produce per-variant class tables.
- At runtime, a component of about 1 to 2 kB maps props to those classes, merges `className`, honors `render` and forwards `ref`. It has no state hooks and inserts no CSS.
- Every component then costs about what a plain element does, at any use-site, in apps that don't run the compiler too.
- The web build replaces `@tamagui/web` with a stub. The same `styled()` sources still compile for React Native through Tamagui, from a separate `react-native` entry.

### Phases

0. **Lock and measure.** A CI ratchet on the web bundle (count of `@tamagui/*` modules, gzip size). The computed-style A/B over every story already exists (`perf/story-ab.mjs`, `perf/story-computed.mjs`), and so does the mount and update bench.
1. **Prototype on three definitions:** `MessageName` (plain), `ButtonGroup` (variants) and `ButtonFrame` (states, `render`).
   - It must reach computed-style parity.
   - It must measure JS and CSS size. The open question is how much CSS grows when every variant value is emitted ahead of time instead of inserted on demand.
   - This phase decides whether the plan goes on.
2. **Remove what needs the runtime:**

   | Runtime need | Uses | Replacement |
   |---|---|---|
   | dynamic style values | 17 frames | a finite variant, or a CSS custom property through `style` |
   | `context:` / `createStyledContext` | 6 / 4 | a React context read by the recipe, or a `data-*` attribute on the parent with a descendant selector |
   | `group` | 2 | a parent rule in the `fuselage` layer, as Message and Item already do |
   | `animation:` | 5 | CSS `@keyframes` |
   | computed `render` | 35 | the recipe takes a tag or an element |
   | `getTokens` | 1 (PaletteStyleTag) | a token module |
   | `isTamaguiComponent` | 2 | a marker the recipe sets |

3. **Convert all 249 definitions with the plugin.**
   - A definition the plugin can't lower is reported and keeps the runtime for now.
   - The CI ratchet drives that count to zero.
4. **Drop the runtime from the web build.**
   - Alias `@tamagui/web` to the stub, so `tamagui.config.ts` only exists in the native build. The base stylesheet is already static (`tamagui-base.css`).
   - CI then requires zero `@tamagui/*` modules in the web bundle.
5. **In parallel, the second runtime.** css-in-js leaves when `Box` loses its styling props in favor of layout primitives such as `Stack`. That continues #42974 and #43100.

**Expected result:**
- **JS:** about −31 kB gzip of runtime and part of the 20.5 kB of definitions, against 1 to 2 kB of recipe runtime.
- **CSS:** grows by an amount phase 1 has to measure.
- **Render cost:** back near `develop`'s. 150 messages mount in 1.8 ms on `develop` against 29 ms on the first pilot.

**Risks:**
- The build depends on Tamagui internals (`getSplitStyles`, the atomic CSS helpers), so the version stays pinned and patched.
- The web build runs without Tamagui while the native one runs with it, so they can drift. The computed-style A/B therefore runs against the compiled `dist`.

## Known costs and open questions

- **React DOM attribute types are not Tamagui prop types**, for example `aria-*` typed `Booleanish` against `boolean`. Each component needs one typed cast at the boundary (`GetProps<typeof Frame>`).
- **Static rendering:**
  - `packages/ui-voip/src/generate-landing-view.tsx` sets up a partial DOM. Tamagui registers global listeners at import whenever `window` exists, so the shim now also exposes `addEventListener`.
- **jsdom cannot parse `@scope`**, which Tamagui's base stylesheet uses. Jest maps `.css` imports to stubs, so `tamagui-base.css` never reaches it.
- **Element rules in the app:** Rocket.Chat's `button`, `input`, `code`, `pre`, `blockquote` and `:focus` rules now sit in the `reset` layer. The Storybook A/B cannot see these rules, because it does not load the app's CSS.
  - The universal `box-sizing: border-box` rule stays unlayered on purpose. It keeps app elements `border-box` as before, even where a frame restates the `content-box` a plain element had in Storybook.
- **React 19 ref cleanups:** Tamagui 3.0.18 drops the cleanup a callback ref returns. It calls the ref again with `null` instead, so a ref such as `useIsVisible`'s hands `null` to `IntersectionObserver.observe` and never disconnects.
  - `.yarn/patches` patches `@tamagui/web` (forwarded refs) and `@tamagui/compose-refs` (composed refs) to keep the cleanup.
  - Drop both patches once upstream handles it; `FuselageProvider.spec.tsx` checks the behavior.
- **`render` functions:** Tamagui adds the frame's `className` to the element a `render` function returns. Use `renderAs`, which drops it, or the class names render twice.
- **Vendor-prefixed properties** (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`) have no Tamagui prop. One `:where(.is_View, .is_Text)` rule in `src/index.css` sets them for every frame.
- **Collapsed `ItemGroup`s** rely on normalize's `[hidden] { display: none }` beating `.rcx-item-group { display: flex }`. The Rocket.Chat app loads no normalize, which suggests collapsed groups show there today. This is independent of Tamagui.
- **Still to decide:**
  - Bundle size: `TAMAGUI_RUNTIME=island` could remove most of the runtime once enough use-sites compile.
  - Running the compiler in Rocket.Chat's bundler (`tamagui-loader` for rspack), which needs an ESM Fuselage build whose dependencies load under Node.
  - `Box` itself is still css-in-js; replacing it is phase 2 of the plan.

## Migrating a component

Follow `Divider` (`components/Divider/Divider.tsx`).

1. **Frames:** build each styled element with `styled(View, …)`, or `styled(Text, …)` when it can hold text nodes. Tamagui warns when a text node sits directly in a `View`. Use `render: '<tag>'` to keep the original element, such as `button`, `label`, `hr` or `li`.
2. **Base display:** Tamagui's base CSS makes every `View` a column flexbox with `flex-shrink: 0`, `min-width: 0`, `min-height: 0` and `box-sizing: border-box`. Every `Text` gets `display: inline` and `white-space: pre-wrap`. Restate `display`, `flexDirection`, `flexShrink` and `whiteSpace` whenever the SCSS element did not already behave that way. A plain `div` was `display: block`.
3. **Values:** take them from `Theme.ts` (`strokeColors`, `surfaceColors`, `fontColors`, …) and from `styleTokens.ts` (`spacing`, `size`, `borderWidth`, `borderRadius`, …). They then resolve to `var(--rcx-…)` with the token as fallback.
   - Keep each SCSS `theme('<name>', …)` hook as `toCSSValue('--rcx-<name>', …)`.
   - Never hard-code a color.
4. **Class names:** keep every `rcx-*` class name the SCSS version rendered, on the same elements, along with the same DOM structure and attributes. E2E tests, app CSS and admin custom CSS select on them.
5. **Props:** a component takes DOM and ARIA attributes plus the variations it declares (`ElementProps`, see #43100), never `Box` styling props. It builds its `className` itself, `rcx-*` classes first and the caller's last, maps a declared `is` to `render`, and spreads the rest onto the frame. Cast the spread to `GetProps<typeof Frame>` only for React's `Booleanish` ARIA types; a cast never carries a style.
   - Styling a component used to receive from inside Fuselage moves into its frame: a margin, a size, an `rcx-box--*` flag.
   - Only components that `Margins`, `Flex` or `Scrollable` still lay out keep `withFuselageProvider(Component, { takesBoxTransforms: true })`.
   - A frame that replaces a `Box` restates what `rcx-box--full` gave it: `border-box`, `flex-shrink: 1`, `auto` minimum sizes, zero margin, padding and border, no outline, the sans font family and tabular numbers.
   - Never render a Tamagui frame through `<Box is={…}>`, because `rcx-box--full` would reset its margin, padding and border.
   - Keep `ref` forwarding and the `is` behavior.
6. **Variants and states:**
   - Modifier classes (`rcx-x--small`) become variants.
   - States are per-property objects in Tamagui 3, for example `backgroundColor: { default: …, hover: …, focus: … }`. Version 3 does not type `hoverStyle`, `pressStyle` and `focusVisibleStyle`.
   - Use a `disabled` variant for `:disabled`.
   - Keep the modifier class names anyway.
7. **What stays in CSS:** some rules keep living in the component's plain CSS file, which is unlayered and so wins over the frame exactly as before (see "Removing the remaining SCSS" for which):
   - `::before` and `::after`;
   - keyframes;
   - `@media` and `@container`;
   - attribute and descendant selectors;
   - any selector that reaches into another component.

   Delete each CSS rule you move, and the whole file once it is empty.
8. **Export:** when the component only styles one element, export the frame itself through `asPublicFrame`, with its `rcx-*` classes as variants (see `MessageName`). Otherwise export the component through `withFuselageProvider`.
9. **Verify:**
   - `yarn tsc --noEmit -p tsconfig.json` and the component's Jest specs.
   - Snapshot diffs may show only Tamagui class names (`is_View`, `_m-…`), removed `rcx-box rcx-box--full`, and shifted `_r_N_` ids.
   - The A/B screenshot comparison with `develop` must stay pixel-identical.

## Removing the remaining SCSS

The goal is no SCSS, and as little CSS as Tamagui allows. Each component's residual SCSS moves into its Tamagui frames with the techniques below. Only rules no technique covers become plain CSS.

### Tamagui 3 techniques

- **States** are per-property clauses, for example `backgroundColor: { default, hover, press, focus, 'focus-visible', 'focus-within' }`. Version 3 removed `hoverStyle`, `pressStyle`, `focusStyle` and the `$sm` media props.
  - The `disabled` clause targets `[aria-disabled="true"]`. Don't add `aria-disabled` where `develop` didn't render it; use a variant driven by the `disabled` prop instead. A variant *named* `disabled` also adds `aria-disabled`, so name it something else (`inactive`).
  - Tamagui orders states its own way: `press` above `focus-visible` above `hover`. SCSS often had hover last, so a hovered, keyboard-focused element now keeps its focus look.
  - Hover clauses, `group-hover` included, are wrapped in `@media (hover: hover)`, so touch-only devices no longer get sticky hover.
- **Variants:**
  - When several variants set the same property, the one whose prop comes last in the JSX wins. Per-state clauses merge across variants.
  - Style props passed where the frame is used beat every variant, whatever the prop order.
  - Never name a variant after a CSS style prop (`position`, `direction`): it swallows that base style without a warning. Use `side`, `align` and the like.
  - `':string'` function variants are not supported; use a keyed variant instead.
  - Clause objects (`{ default: …, md: … }`) also work as plain props, not only in `styled()` and variants.
  - A variant with a plain value replaces the base clause object for that property, so restate the states it needs.
- **Media**: the config holds the Fuselage breakpoints (`sm`, `md`, `lg`, `xl`, `xxl`, `xxxl`, `min-width` in `em`, as the SCSS `on-breakpoint` mixin used). Write them as clauses, for example `padding: { default: …, md: … }`.
- **Parent state → child style**: put `group="<name>"` on the parent frame, then use `'group-hover/<name>'` or `'group-focus-within/<name>'` clauses on child frames. They emit real CSS.
  - They are not CSS only: each child with a group clause subscribes to the group, and the parent attaches mouse and press handlers that re-render those children. Specs that click outside `act()` then fail the console error check.
  - `group` works in the `styled()` config; `container` only works as a JSX prop.
  - **Not for parts rendered once per row.** The first subscriber makes the parent render again on mount, and each subscriber costs about 28 µs per mount (`perf/micro`). Message and Item reveal their parts with plain rules in the `fuselage` layer instead (`.rcx-message:hover .rcx-message-header__time`, `.rcx-item:focus-within .rcx-item__actions--reveal-hover`), with hover inside `@media (hover: hover)` as Tamagui does. That made mounting 26% faster for message rows and 43% faster for item rows with actions.
  - Declaring a group with no subscriber costs nothing.
  - Removing the subscribers moves the cache warm-up to the first update, which gets about 17% slower; later updates are unchanged.
- **Container queries**: `container="<name>"` on the parent sets `container-type: inline-size`, and children use `'@md/<name>'` clauses. Only use them where `develop` already had a container.
- **Cross-component styles** (one component styling another's parts): pass a variant from the parent, or share one with `createStyledContext`. Don't reach into other components with selectors.
  - A styled frame with `context` hands its variant props to descendant frames that use the same context, with no Provider.
  - A frame takes one `context`, and a nested Provider resets the other keys to their defaults. Use separate contexts and read them with `useStyledContext()` when several values travel.
  - When the other component has no variant for it, a css-in-js class (`useStyle`) on it is the fallback. Avoid inline `style`: it adds an attribute to the DOM.
- **`:has()`**: let the child register in a parent context (for example "has an addon"), then style through a variant.
- **Attribute selectors** (`[aria-selected]`, `[tabindex]`): the component already knows the prop, so map it to a variant.
- **Pseudo-elements**: decorative `::before`/`::after` become real `aria-hidden` elements, keeping the class name of the element that held them. Snapshots change; pixels must not.
- **Forced state classes** (`hover`/`is-hovered`, `active`/`is-active`, `focus`/`is-focused`, `focus focus-visible`) no longer pin a component's state: only the Storybook state showcases used them, and `forceStyle` rendered the whole frame inline, which kept it from compiling. Those stories now show the rest state.
  - Forced `disabled`/`is-disabled` still maps to the component's disabled variant; `isForcedDisabled(className)` reads it.
- **Vendor-prefixed font smoothing** comes from one `:where(.is_View, .is_Text)` rule in `index.css`. Drop the per-component copies.
- **Typing gaps:** `WebkitLineClamp`, `WebkitBoxOrient` and `display: '-webkit-box'` emit CSS but are typed `never` on `Text`; cast them in one helper. `animationName`, `transition`, `wordBreak` and `textIndent` emit real CSS.
- **Fonts:** a frame that replaces `font: inherit` also needs `fontVariantNumeric: 'inherit'`, or a `<button>` loses `tabular-nums` and text shifts by a fraction of a pixel.

### What stays plain CSS

- `:checked`, `:indeterminate` and `:invalid` on native inputs (sibling rules such as `input:checked + .fake`), so uncontrolled inputs work without React state.
- Rich text and links inside text (`withRichContent`, links inside field hints): they style arbitrary HTML no component renders.
- States of a native input styled through a sibling (`input:hover + .fake`, `:focus`, `:active`, `:disabled`): `group-*` clauses would make every hover re-render.
- Colors and focus rings of a component that can render as `<a>`: the global link rules in `styles/link.css` are unlayered, so layered frame styles lose to them.
- `@keyframes`, referenced through the `animationName` style prop, and `@font-face`.

Plain CSS has no Sass: flat selectors, no nesting, values written as `var(--rcx-…, <fallback>)`. It lives in `<Name>.styles.css` and is loaded from `components/index.css` with `@import`, in the order the SCSS `@use`s had. Rules that used to win over frames stay unlayered.

The entry is `src/index.css`:

1. the `@layer reset, fuselage;` statement, first;
2. Tamagui's base stylesheet (`styles/tamagui-base.css`);
3. the `@font-face`;
4. the global link colors (`styles/link.css`);
5. `components/index.css`;
6. the font-smoothing rule. Vite inlines the `@import`s into `fuselage.css`, and Storybook's `css-loader` does the same. `.storybook/normalize.css` puts normalize in the `reset` layer with `@import … layer(reset)`. `css-loader` drops that layer when it inlines the import, so Storybook runs `postcss-import`, limited to `normalize.css`, which keeps it. Without it, normalize's unlayered `button { font-family: inherit }` beats every frame's font. `yarn stylelint` lints `**/*.css`.

### Lessons from consumers

- `<Box is={TamaguiComponent}>` drops the `rcx-box` base classes, and `isTamaguiComponent` tells which components are Tamagui.
- Components whose `develop` root was a `Box` take `Margins`/`Scrollable` transforms through `withFuselageProvider(X, { takesBoxTransforms: true })`.
- Tamagui's base `min-height: 0` lets frames shrink where `Box` didn't. Restate `minHeight: 'auto'`.
- Tamagui 3.0.18 is patched (`.yarn/patches`):
  - React 19 ref cleanups;
  - `forceStyle` no longer leaks to the DOM (dead since Fuselage stopped passing it);
  - the container `onLayout` measurer no longer leaks to the DOM;
  - a frame with no `ThemeProvider` above acts as its own root instead of throwing.
- Run `yarn exec eslint --fix <paths>`, never `yarn eslint --fix <paths>`: the package script is `eslint .` and fixes the whole package.
- The Fuselage Storybook A/B is not enough. The apps/meteor and ui-client Storybooks catch what Fuselage stories never exercise, so compare them against `develop` too.
- Pixel A/B can't see behavior. Run the Rocket.Chat client and package unit tests after every batch, and treat any failure that isn't a snapshot as a regression. Examples:
  - an `onChange` firing twice;
  - a click that no longer reaches a header button.
- Watch for React's unknown-DOM-prop warnings. A variant name that also travels outside Tamagui leaks to the element, as `pressed` did.
- Consumers style raw elements with Fuselage class names (`rcx-input-box`, `rcx-input-box__wrapper`, `rcx-modal__backdrop`, `rcx-sidebar`, `rcx-card__header`, `rcx-card__row`).
  - Keep those classes styled in plain CSS for as long as consumers render them on non-Fuselage elements.
  - `styles/consumer-classes.css` restores develop's rules for them, restricted to non-Tamagui elements.
  - Audit by listing every `rcx-*` class that code outside Fuselage writes in a `className` or as a `Box` prop, then checking it is still in `fuselage.css`.
- A Tamagui `render` *function* receives the frame's props, and Tamagui then merges the same props into the element it returns. Every handler runs twice: `onChange` fired twice per keystroke. Pass an element instead; `renderAs` returns one.
- Tamagui 3.0.18 calls `stopPropagation()` after a frame's `onClick`, which `Box` never did. Clicks stopped reaching parent handlers, such as the room list group header. The patch removes that call.
- Update package snapshots through the `testunit` script, never with a bare `jest -u`. Packages pin `TZ=UTC` there, and a bare run writes local-time dates into the snapshots.
- `yarn dev:next` pre-bundles the Fuselage `dist` JavaScript into `apps/meteor/node_modules/.vite`, while the CSS reloads live. After rebuilding Fuselage, restart it with that directory removed, or the app shows a broken mix of old JS and new CSS.
- Pixel A/B of the real app is part of verification: home, a room, a user panel, a modal, preferences, the marketplace. Run it against a `develop` build on the same server, logged in with a personal access token.
