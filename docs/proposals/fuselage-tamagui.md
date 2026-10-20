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

Among the stylesheets in `main.css` and `fuselage.css`, layering the reset changes no existing rule. Only zero-specificity rules used to lose to it, and the ones that exist (`*` and `:where()` rules) set none of the properties the reset sets. Stylesheets loaded before `main.css` were not audited. Any consumer that loads its own reset (normalize, for example) has to put it in the `reset` layer too. Fuselage's Storybook does this in `.storybook/normalize.css`.

### `@tamagui/web` is bundled into `dist`

Tamagui reads its settings from `process.env` at runtime. The Fuselage Vite build bundles it and pins those reads, through `pinTamaguiEnv` in `vite.config.mts`, so consumers need no bundler config. Meteor, Webpack Storybooks and Jest all load the CommonJS bundle as before.

Fuselage's own Jest and Storybook run on `src`. For those:

- The shared client Jest preset transforms `@tamagui/*` ESM.
- Fuselage's Storybook defines `TAMAGUI_CSS_LAYER` itself.

### `FuselageProvider` is optional

Tamagui throws without a theme context. A Tamagui-based component is exported through `withFuselageProvider`, which mounts a `FuselageProvider` when none is above it.

`FuselageProvider` is a bare `ThemeProvider` (with `addThemeClassName: false`), plus the layered base stylesheet as a React 19 `<style precedence>`. It adds no DOM element, so mounting it per component changes no selector.

`TamaguiProvider` was rejected for two reasons:

- It wraps the tree in a `display: contents` span.
- In development it adds a hidden revision span.

Either one would have changed every snapshot.

Rocket.Chat mounts one `FuselageProvider` at the app root, so components share it. Tests, Storybooks and other roots need nothing.

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

## Known costs and open questions

- **React DOM attribute types are not Tamagui prop types**, for example `aria-*` typed `Booleanish` against `boolean`. Each component needs one typed cast at the boundary (`GetProps<typeof Frame>`).
- **Static rendering:**
  - `packages/ui-voip/src/generate-landing-view.tsx` sets up a partial DOM. Tamagui registers global listeners at import whenever `window` exists, so the shim now also exposes `addEventListener`.
  - Once components rendered there move to Tamagui, the generator must also append `tamaguiConfig.getCSS()`, since those rules are not in `fuselage.css`.
- **jsdom cannot parse `@scope`**, which Tamagui's base stylesheet uses, so `FuselageProvider` skips the base stylesheet under `NODE_ENV=test`.
- **Element rules in the app:** Rocket.Chat's `button`, `input`, `code`, `pre`, `blockquote` and `:focus` rules now sit in the `reset` layer. The Storybook A/B cannot see these rules, because it does not load the app's CSS.
  - The universal `box-sizing: border-box` rule stays unlayered on purpose. It keeps app elements `border-box` as before, even where a frame restates the `content-box` a plain element had in Storybook.
- **React 19 ref cleanups:** Tamagui 3.0.18 drops the cleanup a callback ref returns. It calls the ref again with `null` instead, so a ref such as `useIsVisible`'s hands `null` to `IntersectionObserver.observe` and never disconnects.
  - `.yarn/patches` patches `@tamagui/web` (forwarded refs) and `@tamagui/compose-refs` (composed refs) to keep the cleanup.
  - Drop both patches once upstream handles it; `FuselageProvider.spec.tsx` checks the behavior.
- **`render` functions:** Tamagui adds the frame's `className` to the element a `render` function returns. Use `renderAs`, which drops it, or the class names render twice.
- **Vendor-prefixed properties** (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`) have no Tamagui prop. One `:where(.is_View, .is_Text)` rule in `src/index.css` sets them for every frame.
- **Collapsed `ItemGroup`s** rely on normalize's `[hidden] { display: none }` beating `.rcx-item-group { display: flex }`. The Rocket.Chat app loads no normalize, which suggests collapsed groups show there today. This is independent of Tamagui.
- **Static extraction (spike, 2026-10-20): not worth it yet.** We tried `@tamagui/vite-plugin` 3.0.18 on Divider, Tag and Button.
  - **The compiler only flattens literals.** It reads code without running it, so any style value computed by a function call (`toCSSValue`, `spacing`, `fontScale`, `String(...)`) is skipped silently.
  - **Few frames qualify.** Neither are frames that spread `useTamaguiBoxProps`, use `context`, or use `forceStyle`/`group`. Only 23 of 227 definitions flattened.
  - **Size went up, not down.** Extraction added about 1.9 kB gzip: the runtime stays, and each flattened element inlines its class string. Zero-runtime mode reports 293 violations, mostly `ThemeProvider` and live frame references.
  - **The extracted CSS needs fixes.** It is unlayered by default (an internal `wrapExtractedCSS` option layers it) and is not deduplicated across modules.
  - **The usual checks miss it.** The compiled code only exists in `dist`, while Jest and Storybook run `src`.
  - **What it would take:** generating literal value modules from `Theme`/`styleTokens`, and removing the props spreads from root frames. Even then, `Box`-driven roots would keep the runtime.
- **Still to decide:**
  - Bundle size: the compiler (`@tamagui/static`) and `TAMAGUI_RUNTIME=island` could remove most of the runtime.
  - `Box` itself is still css-in-js, and how to migrate it is undecided.

## Migrating a component

Follow `Divider` (`components/Divider/Divider.tsx`).

1. **Frames:** build each styled element with `styled(View, …)`, or `styled(Text, …)` when it can hold text nodes. Tamagui warns when a text node sits directly in a `View`. Use `render: '<tag>'` to keep the original element, such as `button`, `label`, `hr` or `li`.
2. **Base display:** Tamagui's base CSS makes every `View` a column flexbox with `flex-shrink: 0`, `min-width: 0`, `min-height: 0` and `box-sizing: border-box`. Every `Text` gets `display: inline` and `white-space: pre-wrap`. Restate `display`, `flexDirection`, `flexShrink` and `whiteSpace` whenever the SCSS element did not already behave that way. A plain `div` was `display: block`.
3. **Values:** take them from `Theme.ts` (`strokeColors`, `surfaceColors`, `fontColors`, …) and from `styleTokens.ts` (`spacing`, `size`, `borderWidth`, `borderRadius`, …). They then resolve to `var(--rcx-…)` with the token as fallback.
   - Keep each SCSS `theme('<name>', …)` hook as `toCSSValue('--rcx-<name>', …)`.
   - Never hard-code a color.
4. **Class names:** keep every `rcx-*` class name the SCSS version rendered, on the same elements, along with the same DOM structure and attributes. E2E tests, app CSS and admin custom CSS select on them.
5. **`Box` props:** components typed with `BoxProps` pass their remaining props through `useTamaguiBoxProps(props, '<rcx class names>')`, then spread the result onto the frame as `GetProps<typeof Frame>`.
   - This covers `withRichContent`, `animated`, `focusable` and `htmlSize` too.
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
8. **Export:** export the public component through `withFuselageProvider`.
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
  - `forceStyle` on the group parent does not reach its children's group clauses.
  - `group` works in the `styled()` config; `container` only works as a JSX prop.
- **Container queries**: `container="<name>"` on the parent sets `container-type: inline-size`, and children use `'@md/<name>'` clauses. Only use them where `develop` already had a container.
- **Cross-component styles** (one component styling another's parts): pass a variant from the parent, or share one with `createStyledContext`. Don't reach into other components with selectors.
  - A styled frame with `context` hands its variant props to descendant frames that use the same context, with no Provider.
  - A frame takes one `context`, and a nested Provider resets the other keys to their defaults. Use separate contexts and read them with `useStyledContext()` when several values travel.
  - When the other component has no variant for it, a css-in-js class (`useStyle`) on it is the fallback. Avoid inline `style`: it adds an attribute to the DOM.
- **`:has()`**: let the child register in a parent context (for example "has an addon"), then style through a variant.
- **Attribute selectors** (`[aria-selected]`, `[tabindex]`): the component already knows the prop, so map it to a variant.
- **Pseudo-elements**: decorative `::before`/`::after` become real `aria-hidden` elements, keeping the class name of the element that held them. Snapshots change; pixels must not.
- **Forced state classes** (`hover`/`is-hovered`, `active`/`is-active`, `focus`/`is-focused`, `focus focus-visible`): pass `forceStyle={getForcedState(className)}` to the frame.
  - Only do this once *all* of the frame's state styles are clauses. Under `forceStyle`, Tamagui renders the whole frame with inline styles, which beat any SCSS still styling that state.
  - Forced `disabled`/`is-disabled` maps to the component's disabled variant; `isForcedDisabled(className)` reads it.
  - `!important` values survive in atomic CSS but are dropped from the inline styles `forceStyle` renders.
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

The entry is `src/index.css`: the `@font-face`, the global link colors (`styles/link.css`), `components/index.css`, the `@layer reset, fuselage;` statement and the font-smoothing rule. Vite inlines the `@import`s into `fuselage.css`, and Storybook's `css-loader` does the same. `.storybook/normalize.css` puts normalize in the `reset` layer with `@import … layer(reset)`. `css-loader` drops that layer when it inlines the import, so Storybook runs `postcss-import`, limited to `normalize.css`, which keeps it. Without it, normalize's unlayered `button { font-family: inherit }` beats every frame's font. `yarn stylelint` lints `**/*.css`.

### Lessons from consumers

- `<Box is={TamaguiComponent}>` drops the `rcx-box` base classes, and `isTamaguiComponent` tells which components are Tamagui.
- Components whose `develop` root was a `Box` take `Margins`/`Scrollable` transforms through `withFuselageProvider(X, { takesBoxTransforms: true })`.
- Tamagui's base `min-height: 0` lets frames shrink where `Box` didn't. Restate `minHeight: 'auto'`.
- Tamagui 3.0.18 is patched (`.yarn/patches`):
  - React 19 ref cleanups;
  - `forceStyle` no longer leaks to the DOM;
  - the container `onLayout` measurer no longer leaks to the DOM.
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
