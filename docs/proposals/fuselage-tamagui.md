# Proposal: Fuselage components on Tamagui

## Status

Pilot. 40 Fuselage components render with Tamagui (`@tamagui/web` 3.x), each through its own `feat(fuselage): render … with Tamagui` commit:

- Fully on Tamagui, with no SCSS left: `Badge`, `Chip`, `CodeSnippet`, `Divider`, `FramedIcon`, `StatusBullet` and `Tile`.
- Partially migrated: every other component keeps a residual SCSS file for what Tamagui cannot express (see recipe step 7).
- Untouched: `Box` itself, `Dropdown`, `Select`, `AutoComplete` and the components that were already plain compositions, such as `Flex`, `Margins` and the inputs. They are not migrated.

Component SCSS went from 5,923 lines to 3,367.

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

Among the stylesheets in `main.css` and `fuselage.css`, layering the reset changes no existing rule. Only zero-specificity rules used to lose to it, and the ones that exist (`*` and `:where()` rules) set none of the properties the reset sets. Stylesheets loaded before `main.css` were not audited. Any consumer that loads its own reset (normalize, for example) has to put it in the `reset` layer too. Fuselage's Storybook does this in `.storybook/normalize.scss`.

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
| `fuselage.production.js` | 130.6 kB (34.4 kB gzip) | 295.5 kB (87.4 kB gzip) |
| `fuselage.css` | 255.0 kB (26.7 kB gzip) | 199.1 kB (19.9 kB gzip) |

JavaScript and CSS together grow by about **+46 kB gzip**:

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
- **`render` functions:** Tamagui adds the frame's `className` to the element a `render` function returns. Use `renderAs`, which drops it, or the class names render twice.
- **Vendor-prefixed properties** (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`) have no Tamagui prop. They stay in SCSS where they matter.
- **Collapsed `ItemGroup`s** rely on normalize's `[hidden] { display: none }` beating `.rcx-item-group { display: flex }`. The Rocket.Chat app loads no normalize, which suggests collapsed groups show there today. This is independent of Tamagui.
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
7. **What stays in SCSS:** some rules keep living in the component's SCSS file, which is unlayered and so wins over the frame exactly as before:
   - `::before` and `::after`;
   - keyframes;
   - `@media` and `@container`;
   - attribute and descendant selectors;
   - any selector that reaches into another component.

   Delete each SCSS rule you move, and the whole file once it is empty.
8. **Export:** export the public component through `withFuselageProvider`.
9. **Verify:**
   - `yarn tsc --noEmit -p tsconfig.json` and the component's Jest specs.
   - Snapshot diffs may show only Tamagui class names (`is_View`, `_m-…`), removed `rcx-box rcx-box--full`, and shifted `_r_N_` ids.
   - The A/B screenshot comparison with `develop` must stay pixel-identical.
