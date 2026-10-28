# Change Log

## 0.96.0

### Minor Changes

- [#2281](https://github.com/RocketChat/fuselage/pull/2281) [`58201cd`](https://github.com/RocketChat/fuselage/commit/58201cdd7cea188241a81f10a77b3c072e0e91e7) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): Add the `Item` family

- [#2307](https://github.com/RocketChat/fuselage/pull/2307) [`0cca843`](https://github.com/RocketChat/fuselage/commit/0cca843fddb2aedf52769983e463338dd2fe673b) Thanks [@ivans-netto](https://github.com/ivans-netto)! - feat(fuselage): add `pill` prop to `Tag`

  Adds a `pill` boolean prop that renders a fully rounded Tag (`rcx-tag--pill`), matching the `Radius=Pill` variant in the design system. Use it for interactive tags such as filters. The modifier sets `--rcx-tag-border-radius` to the `full` border radius token, so padding, sizes and colors are unchanged. Tags without `pill` render as before.

### Patch Changes

- [#2226](https://github.com/RocketChat/fuselage/pull/2226) [`7f574ad`](https://github.com/RocketChat/fuselage/commit/7f574ad62e2be8286aa0aa283fcdef0c3b30c476) Thanks [@josephjpearce](https://github.com/josephjpearce)! - feat(fuselage-tokens): sync status font tokens with the Figma color system

- Updated dependencies [[`7f574ad`](https://github.com/RocketChat/fuselage/commit/7f574ad62e2be8286aa0aa283fcdef0c3b30c476)]:
  - @rocket.chat/fuselage-tokens@0.36.0

## 0.95.0

### Minor Changes

- [#2274](https://github.com/RocketChat/fuselage/pull/2274) [`203fc19`](https://github.com/RocketChat/fuselage/commit/203fc1981644af2d947fea42d69270b6b21150b0) Thanks [@ggazzo](https://github.com/ggazzo)! - feat(fuselage): Add `SplitButton` and remove the `joined` and `ghostPosition` props from `ButtonGroup`

  `ButtonGroup` is back to being a layout-only container. The split-button look (fused segments, translucent background, ghost menu segment) now lives in `SplitButton`, whose menu trigger is a `SplitButtonTrigger` and which takes a `danger` prop for destructive actions. The `--rcx-button-group-joined-background-color` theme variable was renamed to `--rcx-split-button-background-color`.

### Patch Changes

- [#2273](https://github.com/RocketChat/fuselage/pull/2273) [`312a253`](https://github.com/RocketChat/fuselage/commit/312a2537e7dc37f1d93c1f42aa699c00890e86bf) Thanks [@ivans-netto](https://github.com/ivans-netto)! - fix(fuselage): Ghost segments keep the button variant colors

  `SplitButton` takes `warning`, `success` and `primary` props alongside `danger`, so its ghost menu trigger keeps the action's variant identity, and the split button translucency goes from 60% to 70%.

- [#2289](https://github.com/RocketChat/fuselage/pull/2289) [`299bd8f`](https://github.com/RocketChat/fuselage/commit/299bd8f3162418c1d4f0c3e3b4008aa891d52567) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Tighten `Bubble` spacing

## 0.94.0

### Minor Changes

- [#2285](https://github.com/RocketChat/fuselage/pull/2285) [`55a8332`](https://github.com/RocketChat/fuselage/commit/55a8332b3843950c9934264980f2bcd8aa059d50) Thanks [@dougfabris](https://github.com/dougfabris)! - Restyles the sidebar collapse group header: the chevron now follows the title, the title is regular weight in a secondary color, and collapsed groups are dimmed when `empty` and emphasized when they have an unread badge

## 0.93.0

### Minor Changes

- [#2232](https://github.com/RocketChat/fuselage/pull/2232) [`fe677ba`](https://github.com/RocketChat/fuselage/commit/fe677ba3050ba405f49a8d3a86a270a7f387814d) Thanks [@ggazzo](https://github.com/ggazzo)! - Reverts the sidebar rows and collapse group headers restyle ([#2193](https://github.com/RocketChat/fuselage/issues/2193), [#2207](https://github.com/RocketChat/fuselage/issues/2207) and [#2221](https://github.com/RocketChat/fuselage/issues/2221)), bringing back their previous look and markup

### Patch Changes

- [#2234](https://github.com/RocketChat/fuselage/pull/2234) [`f84a6f6`](https://github.com/RocketChat/fuselage/commit/f84a6f6d52a65b3bf2ecfb8c4245221eb57b2ffc) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): Keep `Tooltip` arrows pointing at their anchor in RTL

## 0.92.0

### Minor Changes

- [`7bfeee4`](https://github.com/RocketChat/fuselage/commit/7bfeee493be0153ef4f9aa56d5c92c1f99ff59a4) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Rework the sidebar collapse group header layout

## 0.91.0

### Minor Changes

- [#2212](https://github.com/RocketChat/fuselage/pull/2212) [`771a90a`](https://github.com/RocketChat/fuselage/commit/771a90a98ac013e4e8a3f091efcf26ba11685a2a) Thanks [@ggazzo](https://github.com/ggazzo)! - feat(fuselage): `IconButton` accepts a `badge` to pin in its corner

## 0.90.1

### Patch Changes

- [#2207](https://github.com/RocketChat/fuselage/pull/2207) [`c4f78b0`](https://github.com/RocketChat/fuselage/commit/c4f78b07dc72ab821fb72ff46292f22d1b95d210) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): update hover background color for sidebar collapse group

## 0.90.0

### Minor Changes

- [#2164](https://github.com/RocketChat/fuselage/pull/2164) [`a5f51e7`](https://github.com/RocketChat/fuselage/commit/a5f51e722f2d0046ff81436c5749c5f9402ff932) Thanks [@ivans-netto](https://github.com/ivans-netto)! - feat(fuselage): Add `joined` ButtonGroup variant with `ghost` button segments

- [#2100](https://github.com/RocketChat/fuselage/pull/2100) [`4eb68c8`](https://github.com/RocketChat/fuselage/commit/4eb68c8d33e5704ee24905f272fd085d3244f8f7) Thanks [@tassoevan](https://github.com/tassoevan)! - Restricts border radius and border width token names

### Patch Changes

- [#2191](https://github.com/RocketChat/fuselage/pull/2191) [`c595094`](https://github.com/RocketChat/fuselage/commit/c5950940a685f4a1ea223ecd0a3a1bfc7dcf029f) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(fuselage): Let direction-aware CSS reach the browser

  `postcss-logical` was compiling every logical property in the sources down to hardcoded left-to-right physical ones, and `postcss-dir-pseudo-class` was replacing `:dir(rtl)` with the weaker `[dir="rtl"]` ancestor selector, which only matches under an explicit `dir` attribute. Both now ship as authored, so `margin-inline-start`, `inset-inline-end` and the rest flip in right-to-left documents instead of staying pinned to the left, and `:dir()` matches an element's own directionality — including `dir="auto"` resolved from its content. Left-to-right rendering is unchanged.

- [#2191](https://github.com/RocketChat/fuselage/pull/2191) [`c595094`](https://github.com/RocketChat/fuselage/commit/c5950940a685f4a1ea223ecd0a3a1bfc7dcf029f) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(fuselage): Publish separate development and production stylesheets

  Both webpack modes emitted `dist/fuselage.css`, so the production stylesheet overwrote the development one — but with source maps off in production, nothing overwrote `dist/fuselage.css.map`, leaving a map that described a file no longer there. `dist/fuselage.css` is unchanged and remains the minified stylesheet to import; the development build now emits `dist/fuselage.development.css` alongside a source map that matches it.

- [#2191](https://github.com/RocketChat/fuselage/pull/2191) [`c595094`](https://github.com/RocketChat/fuselage/commit/c5950940a685f4a1ea223ecd0a3a1bfc7dcf029f) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(fuselage): Build the package with Vite instead of webpack

  The bundler changed and the published bundles changed with it.
  `dist/fuselage.production.js` drops from 216KB to 126KB (44KB to 32KB
  gzipped) and `dist/fuselage.development.js` from 613KB to 271KB, because
  Rollup scope-hoists the modules rather than wrapping each one in webpack's
  runtime. The exported API is identical: the same 282 names with the same
  types, and components render the same markup.

  `dist/fuselage.css` is unchanged apart from the font reference, now
  `url(./fonts/InterVariable.woff2)` instead of `url(fonts/InterVariable.woff2)`
  — both resolve relative to the stylesheet.

  One artifact is lost: `dist/fuselage.development.css.map` is no longer
  published. Vite emits no source map for extracted CSS in a build, so the
  development stylesheet no longer has one.

- Updated dependencies [[`4eb68c8`](https://github.com/RocketChat/fuselage/commit/4eb68c8d33e5704ee24905f272fd085d3244f8f7)]:
  - @rocket.chat/fuselage-tokens@0.35.0

## 0.89.0

### Minor Changes

- [#2193](https://github.com/RocketChat/fuselage/pull/2193) [`b95ead6`](https://github.com/RocketChat/fuselage/commit/b95ead68a027abaabe2783eb2d53e5244410c331) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Restyle sidebar rows and collapse group headers

## 0.88.0

### Minor Changes

- [#2163](https://github.com/RocketChat/fuselage/pull/2163) [`11a8435`](https://github.com/RocketChat/fuselage/commit/11a8435db2d0516fd80192de0e8bbf5dc0a7bf57) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage)!: Remove legacy `Sidebar` and promote `SidebarV2`

## 0.87.0

### Minor Changes

- [#2162](https://github.com/RocketChat/fuselage/pull/2162) [`cdc86c7`](https://github.com/RocketChat/fuselage/commit/cdc86c7ae40915835a6e790c6a69896205a6d513) Thanks [@abhinavkrin](https://github.com/abhinavkrin)! - feat(fuselage): Update input pseudo states

- [#2155](https://github.com/RocketChat/fuselage/pull/2155) [`73bf4a4`](https://github.com/RocketChat/fuselage/commit/73bf4a4349a2c256b5515c7ee17cd75194feb652) Thanks [@ivans-netto](https://github.com/ivans-netto)! - feat(fuselage): Render message mentions as plain text instead of pills

## 0.86.0

### Minor Changes

- [#2138](https://github.com/RocketChat/fuselage/pull/2138) [`064b02a`](https://github.com/RocketChat/fuselage/commit/064b02a866d3f8c5ca82fcc9e810d082e8f0bbd1) Thanks [@ivans-netto](https://github.com/ivans-netto)! - feat(fuselage): quieter message header metadata

- [#2147](https://github.com/RocketChat/fuselage/pull/2147) [`9aaeab5`](https://github.com/RocketChat/fuselage/commit/9aaeab5c06798e3e562a9d6d2a0afcbdbed17c99) Thanks [@ivans-netto](https://github.com/ivans-netto)! - feat(fuselage)!: Remove the `ghost` variant and the `disabled` prop from `Badge`

- [#2148](https://github.com/RocketChat/fuselage/pull/2148) [`0d8e038`](https://github.com/RocketChat/fuselage/commit/0d8e038801972ec29ad2fb1d26da088af05b7b23) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage-tokens)!: Rework the token build and its output formats

### Patch Changes

- [#2150](https://github.com/RocketChat/fuselage/pull/2150) [`9d13357`](https://github.com/RocketChat/fuselage/commit/9d1335702b8d6aab51cbb42386cb92d2b4b69b5d) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `MultiSelect` option checkbox staying checked after deselect

- [#2088](https://github.com/RocketChat/fuselage/pull/2088) [`5f63640`](https://github.com/RocketChat/fuselage/commit/5f63640f0a88b0bcf5a725d2ba630b98147824fe) Thanks [@ricardogarim](https://github.com/ricardogarim)! - fix: Remove duplicated calendar icon on date inputs in Firefox

- Updated dependencies [[`695158b`](https://github.com/RocketChat/fuselage/commit/695158b0dc55d2a994424bb3faeefac6c5389a8f), [`0d8e038`](https://github.com/RocketChat/fuselage/commit/0d8e038801972ec29ad2fb1d26da088af05b7b23)]:
  - @rocket.chat/fuselage-tokens@0.34.0

## 0.85.0

### Minor Changes

- [#2137](https://github.com/RocketChat/fuselage/pull/2137) [`f42dac6`](https://github.com/RocketChat/fuselage/commit/f42dac630c1a4259a5c376a919823d7011c22fea) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage)!: Remove the `ContextualbarV2` component family and replace the `Contextualbar` component family with its implementation

  The `ContextualbarV2*` components and types are no longer exported; use the `Contextualbar*` ones instead, which now carry the V2 look and behavior.

- [#2132](https://github.com/RocketChat/fuselage/pull/2132) [`f48a1ba`](https://github.com/RocketChat/fuselage/commit/f48a1bae07bbbfd8ac9c6c6e5227cac05070e54a) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): Add `Button` `variant` and `size` props

### Patch Changes

- [#2135](https://github.com/RocketChat/fuselage/pull/2135) [`70fd444`](https://github.com/RocketChat/fuselage/commit/70fd444a925a072c8229de79bb9b68e099b64a28) Thanks [@tassoevan](https://github.com/tassoevan)! - chore(fuselage): Deprecate the `Sidebar` component family in favor of `SidebarV2`

- [#2134](https://github.com/RocketChat/fuselage/pull/2134) [`d85c323`](https://github.com/RocketChat/fuselage/commit/d85c323986553d8b7e8ee9d67047aa1982f8b5b4) Thanks [@tassoevan](https://github.com/tassoevan)! - Bump `react-is` dependency from 19.2.7 to 19.2.8

- [#2135](https://github.com/RocketChat/fuselage/pull/2135) [`70fd444`](https://github.com/RocketChat/fuselage/commit/70fd444a925a072c8229de79bb9b68e099b64a28) Thanks [@tassoevan](https://github.com/tassoevan)! - chore(fuselage): Deprecate the `Contextualbar` component family in favor of `ContextualbarV2`

- [#2135](https://github.com/RocketChat/fuselage/pull/2135) [`70fd444`](https://github.com/RocketChat/fuselage/commit/70fd444a925a072c8229de79bb9b68e099b64a28) Thanks [@tassoevan](https://github.com/tassoevan)! - chore(fuselage): Deprecate `AutoComplete` in favor of `SelectFiltered` and `MultiSelectFiltered`

- [#2135](https://github.com/RocketChat/fuselage/pull/2135) [`70fd444`](https://github.com/RocketChat/fuselage/commit/70fd444a925a072c8229de79bb9b68e099b64a28) Thanks [@tassoevan](https://github.com/tassoevan)! - chore(fuselage): Deprecate the sidebar `TopBar` and `TopBarV2` components

## 0.84.0

### Minor Changes

- [#2044](https://github.com/RocketChat/fuselage/pull/2044) [`dad21d4`](https://github.com/RocketChat/fuselage/commit/dad21d4166c4ba93f0e7fcc984a90a1b74459a3f) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add menu support to SidebarCollapseGroup

- [#2038](https://github.com/RocketChat/fuselage/pull/2038) [`e4ad42b`](https://github.com/RocketChat/fuselage/commit/e4ad42b063ea2a6cd3728356a365681879dfa337) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Introduce submenu to Menu component

### Patch Changes

- Updated dependencies [[`9f17e22`](https://github.com/RocketChat/fuselage/commit/9f17e223eab2a6de551a2c1b453838e658797a8d)]:
  - @rocket.chat/css-in-js@0.33.1

## 0.83.0

### Minor Changes

- [#2096](https://github.com/RocketChat/fuselage/pull/2096) [`18b421e`](https://github.com/RocketChat/fuselage/commit/18b421ec571d72118fccf3f7705df45b17b16191) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Drop styling props' aliases (`bg`, `w`, `h`, `m`, `mb`, `mbs`, `mbe`, `mi`, `mis`, `mie`, `p`, `pb`, `pbs`, `pbe`, `pi`, `pis`, `pie`) in favor of their full-name counterparts

### Patch Changes

- [#2086](https://github.com/RocketChat/fuselage/pull/2086) [`97ac6aa`](https://github.com/RocketChat/fuselage/commit/97ac6aab3e2049a039c1f60c4435a63833d1a0b5) Thanks [@MartinSchoeler](https://github.com/MartinSchoeler)! - Fixes misaligned unicode emojis by adding font-size and line-height

## 0.82.0

### Minor Changes

- [#2060](https://github.com/RocketChat/fuselage/pull/2060) [`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove deprecations and keep documentation comments

- [#2072](https://github.com/RocketChat/fuselage/pull/2072) [`46e9cc3`](https://github.com/RocketChat/fuselage/commit/46e9cc36b03bcdd8668f6146dd6e326857416a39) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove unused UMD builds from all packages

### Patch Changes

- [#2078](https://github.com/RocketChat/fuselage/pull/2078) [`6f06570`](https://github.com/RocketChat/fuselage/commit/6f065708cc5b9ea672ccfe30a7fdb122363d12e1) Thanks [@tassoevan](https://github.com/tassoevan)! - fix: Adapt `NavBarSection` to match previous (accidental) runtime behavior

- [#2069](https://github.com/RocketChat/fuselage/pull/2069) [`4e9188c`](https://github.com/RocketChat/fuselage/commit/4e9188c294806d38bd5755e37238ac9c0e470aee) Thanks [@tassoevan](https://github.com/tassoevan)! - fix: Pass filtered select anchor props via context

- [#2085](https://github.com/RocketChat/fuselage/pull/2085) [`5206e22`](https://github.com/RocketChat/fuselage/commit/5206e22f5004b19333bfe88a1de7cfa43c29c35b) Thanks [@ricardogarim](https://github.com/ricardogarim)! - fix: `MultiSelect`/`MultiSelectFiltered`/`PaginatedMultiSelect` dropdown never opening (pass `visible` instead of `visibility` to `PositionAnimated`)

- Updated dependencies [[`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023), [`46e9cc3`](https://github.com/RocketChat/fuselage/commit/46e9cc36b03bcdd8668f6146dd6e326857416a39)]:
  - @rocket.chat/css-in-js@0.33.0

## 0.81.0

### Minor Changes

- [#2052](https://github.com/RocketChat/fuselage/pull/2052) [`d20a82f`](https://github.com/RocketChat/fuselage/commit/d20a82fb51ec3620fc22ed23e1a90f26a89967df) Thanks [@ggazzo](https://github.com/ggazzo)! - feat(fuselage): extract controlled AudioPlayerControls from AudioPlayer

## 0.80.0

### Minor Changes

- [#1999](https://github.com/RocketChat/fuselage/pull/1999) [`6e37f9d`](https://github.com/RocketChat/fuselage/commit/6e37f9d2fee4c9ebeb8ea2c1601bbd4c89905859) Thanks [@tassoevan](https://github.com/tassoevan)! - feat!: Upgrade to React 19

## 0.79.1

### Patch Changes

- [#2024](https://github.com/RocketChat/fuselage/pull/2024) [`52fdd70`](https://github.com/RocketChat/fuselage/commit/52fdd70b9352c64276a1556275db44f8e1f505e6) Thanks [@ggazzo](https://github.com/ggazzo)! - fix(fuselage): `InputBox` spacing in leading and trailing addons

## 0.79.0

### Minor Changes

- [#2017](https://github.com/RocketChat/fuselage/pull/2017) [`752b501`](https://github.com/RocketChat/fuselage/commit/752b5018c3c0991a721f636394b9fab19340a5e3) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add `startAddon` and `endAddon` to `InputBox`

## 0.78.1

### Patch Changes

- [#1982](https://github.com/RocketChat/fuselage/pull/1982) [`9e055ca`](https://github.com/RocketChat/fuselage/commit/9e055cae7a4247dd4e812b56b9126e471e145869) Thanks [@nazabucciarelli](https://github.com/nazabucciarelli)! - fix(fuselage): autocomplete overlay on MultiSelectFiltered component

- [#1980](https://github.com/RocketChat/fuselage/pull/1980) [`faa9feb`](https://github.com/RocketChat/fuselage/commit/faa9feb879307fce6155d51c8bc0156c03bbb093) Thanks [@ricardogarim](https://github.com/ricardogarim)! - Fixed `Select` inflating ancestor scrollHeight inside non-positioned containers (collapsed `Accordion`, `Modal`, `Field`, etc.). Regression from 0.77.0 ([#1939](https://github.com/RocketChat/fuselage/issues/1939)).

- [#1961](https://github.com/RocketChat/fuselage/pull/1961) [`792c038`](https://github.com/RocketChat/fuselage/commit/792c038bb9d6d0c5bb30b2c45708ff14c6bb8ce6) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(fuselage): issues not caught by visual regression testing after Sass rewrite

## 0.78.0

### Minor Changes

- [#1947](https://github.com/RocketChat/fuselage/pull/1947) [`3620915`](https://github.com/RocketChat/fuselage/commit/3620915b5fede3d4cef6f1bad832f93aad62a6fd) Thanks [@gabriellsh](https://github.com/gabriellsh)! - feat(fuselage): Implement `OwnerDocument` context and update `document` references

- [#1956](https://github.com/RocketChat/fuselage/pull/1956) [`3a7c41d`](https://github.com/RocketChat/fuselage/commit/3a7c41d4d23b88a7867bd260f2fe5832085716f5) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage-forms): add `AutoComplete` component

### Patch Changes

- [#1951](https://github.com/RocketChat/fuselage/pull/1951) [`76d62c0`](https://github.com/RocketChat/fuselage/commit/76d62c03dacdca4b893e58d1c44f4dfcbf8c0ba6) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Add `aria-hidden` attribute to `StatusBullet`

## 0.77.0

### Minor Changes

- [#1946](https://github.com/RocketChat/fuselage/pull/1946) [`4f90c69`](https://github.com/RocketChat/fuselage/commit/4f90c696e0ce6815342aa755f20cac3f6d4b41ec) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(fuselage): remove incorrect dependency on `@rocket.chat/styled`

- [#1943](https://github.com/RocketChat/fuselage/pull/1943) [`cff98b1`](https://github.com/RocketChat/fuselage/commit/cff98b1b6035591c96ef0b03f05a72f68e4f1653) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): accept all `objectFit` css properties on `Avatar` component

- [#1945](https://github.com/RocketChat/fuselage/pull/1945) [`6797e0f`](https://github.com/RocketChat/fuselage/commit/6797e0f5c877ce6890644170d80f848692e605ab) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): add `objectFit` to `Box` styling props

- [#1949](https://github.com/RocketChat/fuselage/pull/1949) [`78ba393`](https://github.com/RocketChat/fuselage/commit/78ba393a7d7ce8d6c20512467a82e99a193d1ceb) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): Keep sidebar item menu button visible while expanded

- [#1942](https://github.com/RocketChat/fuselage/pull/1942) [`ef9dedd`](https://github.com/RocketChat/fuselage/commit/ef9dedd02084073731bd9cc008e1268e23b4b9a0) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage-forms): Add `MultiSelectFiltered` component

### Patch Changes

- [#1939](https://github.com/RocketChat/fuselage/pull/1939) [`b12a0a2`](https://github.com/RocketChat/fuselage/commit/b12a0a28eb6c61bdf9f1ef8717461093ec9b20b7) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): move `HiddenSelect` out of `SelectTrigger`

- [#1940](https://github.com/RocketChat/fuselage/pull/1940) [`9574ce2`](https://github.com/RocketChat/fuselage/commit/9574ce29f68950671a5d113fdcb2f3bc3be9f528) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): improve a11y for `MultiSelect` components

- Updated dependencies [[`00052dc`](https://github.com/RocketChat/fuselage/commit/00052dc976bbe72664ec2d3b97f9ba2ba2d4f3c7)]:
  - @rocket.chat/css-in-js@0.32.0

## 0.76.0

### Minor Changes

- [#1685](https://github.com/RocketChat/fuselage/pull/1685) [`2d6b78c`](https://github.com/RocketChat/fuselage/commit/2d6b78cdc43dc7b03c2cf0766242def14bd0bcb8) Thanks [@ergot-rp](https://github.com/ergot-rp)! - feat(fuselage): Add accessibility improvements to `Pagination`

### Patch Changes

- [#1934](https://github.com/RocketChat/fuselage/pull/1934) [`04d477a`](https://github.com/RocketChat/fuselage/commit/04d477a9a20d4b75011c5b6e447ca8fdd22da51f) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): Remove target `_blank` as default on `FieldLink`

## 0.75.0

### Minor Changes

- [#1912](https://github.com/RocketChat/fuselage/pull/1912) [`ee9f242`](https://github.com/RocketChat/fuselage/commit/ee9f24215b261c228781c540e9bbdda1f23c6e59) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): add `gap` styling prop to `Box`

### Patch Changes

- [#1923](https://github.com/RocketChat/fuselage/pull/1923) [`c223ca1`](https://github.com/RocketChat/fuselage/commit/c223ca16c837daccc5a320ca787b0bba646ba086) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Set default cursor style for Label component

## 0.74.0

### Minor Changes

- [#1901](https://github.com/RocketChat/fuselage/pull/1901) [`e5c02b9`](https://github.com/RocketChat/fuselage/commit/e5c02b9a29aa5ccad16fd62d4748042145368519) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage-forms): add `MultiSelect` component
  feat(fuselage): improve `MultiSelect` a11y

## 0.73.0

### Minor Changes

- [#1880](https://github.com/RocketChat/fuselage/pull/1880) [`c312238`](https://github.com/RocketChat/fuselage/commit/c3122389dfe5ba4970ddc59d57b1ddc70464f7dc) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): improve `Toastbar` accessibility

## 0.72.1

### Patch Changes

- [#1872](https://github.com/RocketChat/fuselage/pull/1872) [`ab46b78`](https://github.com/RocketChat/fuselage/commit/ab46b784c4aac7441916acef9be7c575e2e9e054) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `InputBox` not reactive to async errors

## 0.72.0

### Minor Changes

- [#1861](https://github.com/RocketChat/fuselage/pull/1861) [`789d6a8`](https://github.com/RocketChat/fuselage/commit/789d6a85877fa325b0d3dfc4d82e8038edbd2096) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Integrate Inter font

- [#1843](https://github.com/RocketChat/fuselage/pull/1843) [`c3bd7f8`](https://github.com/RocketChat/fuselage/commit/c3bd7f8c5fd5a6f8faea3378ebff26338a6ef470) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): promote `MenuV2` to `Menu`

### Patch Changes

- [#1868](https://github.com/RocketChat/fuselage/pull/1868) [`84d8d59`](https://github.com/RocketChat/fuselage/commit/84d8d59e3e16b5fc23a3321795e2061f09ca43ac) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage-hooks): Deprecate `useEffectEvent` in favor of `useStableCallback`

  The `useEffectEvent` hook has been renamed to `useStableCallback` to better reflect its purpose and behavior. The new
  name emphasizes that the hook provides a stable callback function that maintains a consistent identity across renders
  while always having access to the latest values of props and state. It differs from `useEffectEvent` from React 19,
  which returns functions that can only be called from inside effects and other effect events.

- [#1867](https://github.com/RocketChat/fuselage/pull/1867) [`717169f`](https://github.com/RocketChat/fuselage/commit/717169f8e0b92df45d9a0e4e72357fcb12e12e09) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Wrong color in invalid input border

## 0.71.0

### Minor Changes

- [#1837](https://github.com/RocketChat/fuselage/pull/1837) [`28172f1`](https://github.com/RocketChat/fuselage/commit/28172f198f382af076842f99205ac13338a72f02) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `Message.*` component namespace

- [#1717](https://github.com/RocketChat/fuselage/pull/1717) [`1179d3f`](https://github.com/RocketChat/fuselage/commit/1179d3f3fb954f00741fd99ddd979b00f39c937e) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: ES2024 standard requirement

- [#1854](https://github.com/RocketChat/fuselage/pull/1854) [`9695ec7`](https://github.com/RocketChat/fuselage/commit/9695ec74eb6fbc8dbb0eea431884b13e418229bc) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): add `ButtonGroup` `rtl` support

### Patch Changes

- [#1846](https://github.com/RocketChat/fuselage/pull/1846) [`7c1f866`](https://github.com/RocketChat/fuselage/commit/7c1f86616a6cb0dd581801acb1670bbe9fa32842) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `ContextualbarHeader` style overlapping with button focus style

- [#1849](https://github.com/RocketChat/fuselage/pull/1849) [`99b319c`](https://github.com/RocketChat/fuselage/commit/99b319c6c2ef1015d1d1edb027068c23dc1e29d9) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(storybook-dark-mode): Fork `storybook-dark-mode`

- [#1850](https://github.com/RocketChat/fuselage/pull/1850) [`a5028b6`](https://github.com/RocketChat/fuselage/commit/a5028b6471def411b60dc91c08290d1c3ad72d1a) Thanks [@dodaa08](https://github.com/dodaa08)! - fix(fuselage): prevent username truncation in system messages with long topics

## 0.70.2

### Patch Changes

- [#1839](https://github.com/RocketChat/fuselage/pull/1839) [`1904f3c`](https://github.com/RocketChat/fuselage/commit/1904f3cf71c40b8d80be9cd447bb645eec87d347) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix(fuselage): MessageReactions subcomponents export missing

## 0.70.1

### Patch Changes

- [#1832](https://github.com/RocketChat/fuselage/pull/1832) [`957a55c`](https://github.com/RocketChat/fuselage/commit/957a55cd6b31452a7f788c0d4af51bdccffcf89c) Thanks [@gabriellsh](https://github.com/gabriellsh)! - chore(fuselage): Increase `MessageBlock` margins when placed directly bellow `MessageHeader`

## 0.70.0

### Minor Changes

- [#1799](https://github.com/RocketChat/fuselage/pull/1799) [`3930b70`](https://github.com/RocketChat/fuselage/commit/3930b7008144a5c6966f0a228a7e07e223bcfc5a) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Use non-polyfilled CSS custom properties

## 0.69.0

### Minor Changes

- [#1787](https://github.com/RocketChat/fuselage/pull/1787) [`fb34f69`](https://github.com/RocketChat/fuselage/commit/fb34f69d9cb7627457d9fff3f23b7f92d397e8d0) Thanks [@gabriellsh](https://github.com/gabriellsh)! - Updates `FramedIcon` component styles to improve contrast and design system compliance

### Patch Changes

- [#1793](https://github.com/RocketChat/fuselage/pull/1793) [`c702714`](https://github.com/RocketChat/fuselage/commit/c702714478d543a9b456f2c7385e9f8d1a4f6df9) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): Missing scroll on `Menu` with many items

## 0.68.1

### Patch Changes

- [#1781](https://github.com/RocketChat/fuselage/pull/1781) [`ff70bf5`](https://github.com/RocketChat/fuselage/commit/ff70bf545ee0cbb903c0405a4221f2ce6e1edf32) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Check for `NavbarGroup` to render divider between childs in `NavbarSection`

## 0.68.0

### Minor Changes

- [#1779](https://github.com/RocketChat/fuselage/pull/1779) [`a6e5f37`](https://github.com/RocketChat/fuselage/commit/a6e5f37b43720ac6bf12b23bd31d09557488e0af) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Render Divider between NavbarSection childs

## 0.67.0

### Minor Changes

- [#1770](https://github.com/RocketChat/fuselage/pull/1770) [`aba9c50`](https://github.com/RocketChat/fuselage/commit/aba9c50945dcd003e75dc0fc0e6fb424cda15208) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `Option.*` component namespace

- [#1771](https://github.com/RocketChat/fuselage/pull/1771) [`5cbc83d`](https://github.com/RocketChat/fuselage/commit/5cbc83d0668e0123944519a32c53246dfee70e51) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `Options.*` component namespace

- [#1762](https://github.com/RocketChat/fuselage/pull/1762) [`cce8e7f`](https://github.com/RocketChat/fuselage/commit/cce8e7f7ae5bb261e95936c586ac831366579b7d) Thanks [@tassoevan](https://github.com/tassoevan)! - Deletes the `@rocket.chat/fuselage-polyfills` package

- [#1767](https://github.com/RocketChat/fuselage/pull/1767) [`faea5fe`](https://github.com/RocketChat/fuselage/commit/faea5fe9ba0073220632e8850dc0828477582e6b) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `Avatar.*` component namespace

- [#1768](https://github.com/RocketChat/fuselage/pull/1768) [`25555b8`](https://github.com/RocketChat/fuselage/commit/25555b8b197cacca0e5fd29d68b9f8bea3769628) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `Field.*` component namespace

- [#1769](https://github.com/RocketChat/fuselage/pull/1769) [`e0b2dd1`](https://github.com/RocketChat/fuselage/commit/e0b2dd135e5a99c6638341c84a5ca60dfc4f413e) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `InputBox.*` component namespace

- [#1754](https://github.com/RocketChat/fuselage/pull/1754) [`210f7e4`](https://github.com/RocketChat/fuselage/commit/210f7e4aee6551232753654def39e5e0d2a3d9b9) Thanks [@tassoevan](https://github.com/tassoevan)! - Reduces the bundle size of `@rocket.chat/fuselage` by externalizing more dependencies and increasing the ECMAScript version.

## 0.66.4

### Patch Changes

- [#1755](https://github.com/RocketChat/fuselage/pull/1755) [`ca03562`](https://github.com/RocketChat/fuselage/commit/ca03562593c5600830e5af2a97f6a85ba8b72212) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix: AutoComplete unable to remove selected item in single mode

- [#1756](https://github.com/RocketChat/fuselage/pull/1756) [`8d7afb0`](https://github.com/RocketChat/fuselage/commit/8d7afb034f5c14f7337c16f88b4425d2ee3328c6) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix: AutoComplete selected items not being updated when value changes

## 0.66.3

### Patch Changes

- [#1744](https://github.com/RocketChat/fuselage/pull/1744) [`bafacf2`](https://github.com/RocketChat/fuselage/commit/bafacf207836e199bb9bf64588e43cb3802de19c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): SidebarV2Item padding

## 0.66.2

### Patch Changes

- [#1742](https://github.com/RocketChat/fuselage/pull/1742) [`6f1e8de`](https://github.com/RocketChat/fuselage/commit/6f1e8ded438478f3fc985c0efaa2322c017ca3a8) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): SidebarItemV2 visual regressions

## 0.66.1

### Patch Changes

- [#1733](https://github.com/RocketChat/fuselage/pull/1733) [`fcf1f7d`](https://github.com/RocketChat/fuselage/commit/fcf1f7d1c95363fc3577e9a1681d361fe1934ffb) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - feat(fuselage): Made index available to OptionsPaginated rendered items

## 0.66.0

### Minor Changes

- [#1725](https://github.com/RocketChat/fuselage/pull/1725) [`0534e6b`](https://github.com/RocketChat/fuselage/commit/0534e6b8e323151af8524d4cefe08ff9315578ac) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add new Tag secondary variants

- [#1723](https://github.com/RocketChat/fuselage/pull/1723) [`1170251`](https://github.com/RocketChat/fuselage/commit/11702517a6c243d7ba9b52636d86c01bcaaf8320) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - feat(fuselage): Adjust SidebarItemContent styles

## 0.65.0

### Minor Changes

- [#1701](https://github.com/RocketChat/fuselage/pull/1701) [`3837986`](https://github.com/RocketChat/fuselage/commit/3837986eef96d8c8e6571002cfd10e59f1691615) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Sidepanel visual updates

- [#1720](https://github.com/RocketChat/fuselage/pull/1720) [`db64417`](https://github.com/RocketChat/fuselage/commit/db6441744523a460ef7f8052c355822f8d8b96ba) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Allow StatesAction to receive variant prop

- [#1715](https://github.com/RocketChat/fuselage/pull/1715) [`aa29684`](https://github.com/RocketChat/fuselage/commit/aa2968428e1e98e8e61b7847d4be424a5cf400fe) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `Modal.*` component namespace

- [#1719](https://github.com/RocketChat/fuselage/pull/1719) [`178abe3`](https://github.com/RocketChat/fuselage/commit/178abe3b400060066c3fc4bfbe70aed1b9b15da6) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Update SidePanel header title scale and color

### Patch Changes

- [#1704](https://github.com/RocketChat/fuselage/pull/1704) [`56b43b3`](https://github.com/RocketChat/fuselage/commit/56b43b3d2453cabae9fba1060f5f4e6da2e02db7) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix(fuselage): AutoComplete's disabled property not working

- [#1703](https://github.com/RocketChat/fuselage/pull/1703) [`33f6797`](https://github.com/RocketChat/fuselage/commit/33f67971392057420b3b3b49e35f567ac2af7319) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix(fuselage): FieldLabel required prop ignored when 'is' prop is set

- [#1712](https://github.com/RocketChat/fuselage/pull/1712) [`b82fb37`](https://github.com/RocketChat/fuselage/commit/b82fb37bc389b8cfc4ef9fa35b0f89f79a42e0c7) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix(fuselage): Placeholder not being displayed in PaginatedSelectFiltered

## 0.64.0

### Minor Changes

- [#1676](https://github.com/RocketChat/fuselage/pull/1676) [`93edea5`](https://github.com/RocketChat/fuselage/commit/93edea5a195d9d7de68a7991f09d54a7ef367a82) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - feat(fuselage): Apply proper bold styles to unread `SidebarItemTitle`.

## 0.63.0

### Minor Changes

- [#1671](https://github.com/RocketChat/fuselage/pull/1671) [`2a877ef`](https://github.com/RocketChat/fuselage/commit/2a877eff8996f7443df62d63039639212708cd1d) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Introduce useButtonPattern

### Patch Changes

- [#1669](https://github.com/RocketChat/fuselage/pull/1669) [`a694b0c`](https://github.com/RocketChat/fuselage/commit/a694b0ce3e8dcc7d08ce51bfca9012038fd5d9c8) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - feat(fuselage): Update ToggleSwitch size

## 0.62.3

### Patch Changes

- [#1654](https://github.com/RocketChat/fuselage/pull/1654) [`6ad5db9`](https://github.com/RocketChat/fuselage/commit/6ad5db9f613b2cda09d5cc5b8158196115f3f72a) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Tag default colors

- [#1655](https://github.com/RocketChat/fuselage/pull/1655) [`3dee4d8`](https://github.com/RocketChat/fuselage/commit/3dee4d887c7a58088c500df9a90611aee02a5535) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `Button` content not truncating

## 0.62.2

### Patch Changes

- [#1644](https://github.com/RocketChat/fuselage/pull/1644) [`174a936`](https://github.com/RocketChat/fuselage/commit/174a936c586185b0a4e4f186518bfd4e534dd994) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): MenuV2 button should receive label

## 0.62.1

### Patch Changes

- [#1633](https://github.com/RocketChat/fuselage/pull/1633) [`18a33f4`](https://github.com/RocketChat/fuselage/commit/18a33f44e7c2df9a2ef50596a813b86d68b1604e) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Keep displaying button when Menu is opened

- [#1632](https://github.com/RocketChat/fuselage/pull/1632) [`9f8fea1`](https://github.com/RocketChat/fuselage/commit/9f8fea100223fdb4efb1175e2ecb608cdfe3d79f) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - fix(fuselage): `MenuV2` not handling focus properly

- [#1634](https://github.com/RocketChat/fuselage/pull/1634) [`20d9521`](https://github.com/RocketChat/fuselage/commit/20d9521ccc517206e8e1ac87f4f8e7665036dfd4) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Increase `z-index` in `ContextualbarV2`

## 0.62.0

### Minor Changes

- [#1604](https://github.com/RocketChat/fuselage/pull/1604) [`8188f5b`](https://github.com/RocketChat/fuselage/commit/8188f5b7654603d66a623b2135a53433bfd40a1b) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add `focusable` prop in `Box`

## 0.61.0

### Minor Changes

- [#1559](https://github.com/RocketChat/fuselage/pull/1559) [`1695629`](https://github.com/RocketChat/fuselage/commit/1695629a9a9600159f7a6ca8d5f92ab7c8c76008) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat: replace `useLayoutEffect` in favor of `useInsertionEffect`

- [#1514](https://github.com/RocketChat/fuselage/pull/1514) [`c4d8300`](https://github.com/RocketChat/fuselage/commit/c4d8300a651a25b92450b8830c5028b4fcf8f4a1) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Raise minimum supported React version to 18

### Patch Changes

- [#1564](https://github.com/RocketChat/fuselage/pull/1564) [`aa6aa26`](https://github.com/RocketChat/fuselage/commit/aa6aa26b5ff2932276c463537f942edf0ab18797) Thanks [@rique223](https://github.com/rique223)! - fix(fuselage): Missing track on `Slider` component

- [#1565](https://github.com/RocketChat/fuselage/pull/1565) [`10f82d9`](https://github.com/RocketChat/fuselage/commit/10f82d9a9c93a42f563ff21be1bcdf3c2bd0456a) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix: broken `Slider` multi thumb

- Updated dependencies [[`1695629`](https://github.com/RocketChat/fuselage/commit/1695629a9a9600159f7a6ca8d5f92ab7c8c76008), [`c4d8300`](https://github.com/RocketChat/fuselage/commit/c4d8300a651a25b92450b8830c5028b4fcf8f4a1)]:
  - @rocket.chat/styled@0.32.0

## 0.60.3

### Patch Changes

- [#1537](https://github.com/RocketChat/fuselage/pull/1537) [`6a6386a`](https://github.com/RocketChat/fuselage/commit/6a6386a2b1fe56eda40277984f6d300315b1f38a) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix: `SelectAria` hidden select should be child of trigger

## 0.60.2

### Patch Changes

- [#1533](https://github.com/RocketChat/fuselage/pull/1533) [`a5bc3a6`](https://github.com/RocketChat/fuselage/commit/a5bc3a6a00b6931d7c67a9485de7f3ffaa112282) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): SelectAria id prop overwriting

## 0.60.1

### Patch Changes

- [#1521](https://github.com/RocketChat/fuselage/pull/1521) [`1dc6c86`](https://github.com/RocketChat/fuselage/commit/1dc6c86df827a44a8c0ac4cc7f239b2507ecd33d) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(fuselage-hooks): Stricter generics for `useEffectEvent`

- [#1516](https://github.com/RocketChat/fuselage/pull/1516) [`deac02f`](https://github.com/RocketChat/fuselage/commit/deac02f45b23227b699774b92aeac87b2dda739e) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `SidebarV2` styles

- [#1523](https://github.com/RocketChat/fuselage/pull/1523) [`7bf080f`](https://github.com/RocketChat/fuselage/commit/7bf080f512c160da6c8f79a3c3ba3cd783b17402) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(icons): Add circle-unfilled new variations

- [#1522](https://github.com/RocketChat/fuselage/pull/1522) [`0006fe9`](https://github.com/RocketChat/fuselage/commit/0006fe943a23607d9974cabacadf973a68996683) Thanks [@dougfabris](https://github.com/dougfabris)! - fix: `OptionIcon` not receiving proper icon props

## 0.60.0

### Minor Changes

- [#1494](https://github.com/RocketChat/fuselage/pull/1494) [`242af51`](https://github.com/RocketChat/fuselage/commit/242af51f3ada154599c294b918f872bb90726bbe) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Update selected system message background

- [#1475](https://github.com/RocketChat/fuselage/pull/1475) [`e86ad6f`](https://github.com/RocketChat/fuselage/commit/e86ad6fcb41454a3df41ee110f4dbc13e031fe71) Thanks [@tassoevan](https://github.com/tassoevan)! - Simplifies `Skeleton`

  It replaces the dependency on `Box` with `StylingBox` and implements a new background animation.

- [#1470](https://github.com/RocketChat/fuselage/pull/1470) [`86fe018`](https://github.com/RocketChat/fuselage/commit/86fe018577b24adf3b7ff7c7631aed36b7caa466) Thanks [@tassoevan](https://github.com/tassoevan)! - Simplifies `Accordion` and `AccordionItem`

  It removes an obsolete and not accessible toggle switch in `AccordionItem` and eases the internal usage of `Box` to
  improve rendering performance.

  Additionally, it adds a new `StylingBox` component that can be used as a wrapper for components that accept styling
  props but don't need the weight of the `Box` component prop handling internally.

  Also, it adds a new `cx` and `cxx` helpers to compose class names.

- [#1493](https://github.com/RocketChat/fuselage/pull/1493) [`a38bf08`](https://github.com/RocketChat/fuselage/commit/a38bf089d30c5581251ee09416c3397992b4a116) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Update selected message background

### Patch Changes

- [#1474](https://github.com/RocketChat/fuselage/pull/1474) [`fd15f2b`](https://github.com/RocketChat/fuselage/commit/fd15f2bd7bc1fda6e8a34edc4fe5be974cb04210) Thanks [@tassoevan](https://github.com/tassoevan)! - Fixes a bug that adds an extra whitespace when concatenating class names with `appendClassName`

- [#1495](https://github.com/RocketChat/fuselage/pull/1495) [`b044c3b`](https://github.com/RocketChat/fuselage/commit/b044c3b956bc253dfcf289677c4d909699284735) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Skeleton missing HTML attributes in type

- [#1487](https://github.com/RocketChat/fuselage/pull/1487) [`9e64011`](https://github.com/RocketChat/fuselage/commit/9e6401101b9bd8ef3b9685ecc7f8230dade8f472) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `Select` disabled opening with keyboard

- [#1428](https://github.com/RocketChat/fuselage/pull/1428) [`5cfac08`](https://github.com/RocketChat/fuselage/commit/5cfac085d329dd6d418e38d5692d5b668aa621b9) Thanks [@rique223](https://github.com/rique223)! - Changes the `contextualbar` z-index to avoid UI glitches on pages where it needs to appear on top of the `Table`

- [#1490](https://github.com/RocketChat/fuselage/pull/1490) [`418dd23`](https://github.com/RocketChat/fuselage/commit/418dd2340e75010e4ba3f16a787d2ac8a0c333ab) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `CodeSnippet` inheriting `code` css styles

- [#1483](https://github.com/RocketChat/fuselage/pull/1483) [`4910d29`](https://github.com/RocketChat/fuselage/commit/4910d294defc1effc0b857f44138498a73013877) Thanks [@tassoevan](https://github.com/tassoevan)! - Enables hooks' compatibility with React 18

- Updated dependencies [[`0b4e37a`](https://github.com/RocketChat/fuselage/commit/0b4e37aea8ca562d7cdf453824dd5c514ede349d)]:
  - @rocket.chat/fuselage-tokens@0.33.2

## 0.59.3

### Patch Changes

- [#1464](https://github.com/RocketChat/fuselage/pull/1464) [`1ca8371`](https://github.com/RocketChat/fuselage/commit/1ca83712e7da034d8370626b9d6674c1bd706edf) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): adjust `SidebarCollapseGroup` padding

## 0.59.2

### Patch Changes

- [#1462](https://github.com/RocketChat/fuselage/pull/1462) [`d255394`](https://github.com/RocketChat/fuselage/commit/d2553945363ce35adeb745fb398dc5673e80af23) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(icons): New `question-mark` icon

## 0.59.1

### Patch Changes

- [`1d038fdc`](https://github.com/RocketChat/fuselage/commit/1d038fdc5645d3afad000b6f255dc0a644cbb838) Thanks [@ggazzo](https://github.com/ggazzo)! - Fixed color sidebar highlighted

## 0.59.0

### Minor Changes

- [#1358](https://github.com/RocketChat/fuselage/pull/1358) [`60345fa9`](https://github.com/RocketChat/fuselage/commit/60345fa971da63da19b3ebad3a638b5bb27cc3cc) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): `Sidebar` and `Sidepanel` components

- [#1442](https://github.com/RocketChat/fuselage/pull/1442) [`1087ee86`](https://github.com/RocketChat/fuselage/commit/1087ee861138836699059e54aacdfeac60ef0eb6) Thanks [@rique223](https://github.com/rique223)! - feat(fuselage): update `InputBox` and `Field` typography

## 0.57.1

### Patch Changes

- [`98f18bb86`](https://github.com/RocketChat/fuselage/commit/98f18bb86038e5fc58b5d24cde79b1569752a0b7) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `Bubble` missing overflow property

- [`a214cfadd`](https://github.com/RocketChat/fuselage/commit/a214cfadd2ce76acaef0ab9cc6c3d4e972c1fefe) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Bubble missing text truncation

## 0.58.2

### Patch Changes

- [#1437](https://github.com/RocketChat/fuselage/pull/1437) [`e9333204`](https://github.com/RocketChat/fuselage/commit/e9333204008ec00f8123a4959def0bf95d5e111a) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `Bubble` missing overflow property

## 0.58.1

### Patch Changes

- [#1429](https://github.com/RocketChat/fuselage/pull/1429) [`5237bf4e`](https://github.com/RocketChat/fuselage/commit/5237bf4ec12469ead842bff9df020c0e587077c4) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): change `Accordion` color token

- [#1433](https://github.com/RocketChat/fuselage/pull/1433) [`277dffab`](https://github.com/RocketChat/fuselage/commit/277dffabcfcbfebd075d12fc912719b47eddd4b5) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Bubble missing text truncation

## 0.58.0

### Minor Changes

- [#1417](https://github.com/RocketChat/fuselage/pull/1417) [`b8441ee5`](https://github.com/RocketChat/fuselage/commit/b8441ee5f0b91a9a4a78d058a0da063582b9576a) Thanks [@gabriellsh](https://github.com/gabriellsh)! - Updated message metric styles and added Avatar row

## 0.57.0

### Minor Changes

- [#1406](https://github.com/RocketChat/fuselage/pull/1406) [`781f4aa0`](https://github.com/RocketChat/fuselage/commit/781f4aa07aa5be3dbd6658220d6cd4150acaffa8) Thanks [@debdutdeb](https://github.com/debdutdeb)! - feat(fuselage-toastbar): Pause ToastBar timer while hovering

- [#1415](https://github.com/RocketChat/fuselage/pull/1415) [`5fe84595`](https://github.com/RocketChat/fuselage/commit/5fe84595926c3e1e6d334eb197bcfd72d423e4d4) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Introduce Callout actions

### Patch Changes

- [#1422](https://github.com/RocketChat/fuselage/pull/1422) [`0df364b2`](https://github.com/RocketChat/fuselage/commit/0df364b2abda76c69fcf13d1bdd6fb4336c9d209) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `MenuItem` onPointerUp event behavior

## 0.56.0

### Minor Changes

- [#1409](https://github.com/RocketChat/fuselage/pull/1409) [`c156035e`](https://github.com/RocketChat/fuselage/commit/c156035ec539107bd187e094422addaea0892aa4) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): TableSelection visual improvements

## 0.55.2

### Patch Changes

- [#1404](https://github.com/RocketChat/fuselage/pull/1404) [`c23955874`](https://github.com/RocketChat/fuselage/commit/c239558745265d68b91bda1dc25bc8a7b0a1653b) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): move header size changes into V2 components

## 0.55.1

### Patch Changes

- [#1394](https://github.com/RocketChat/fuselage/pull/1394) [`1eb218f2a`](https://github.com/RocketChat/fuselage/commit/1eb218f2a5a8af323b744f60b812c1354d450155) Thanks [@abhinavkrin](https://github.com/abhinavkrin)! - Fixed: Prevent text overflow issues in chat messages when they include a large number of diacritical marks.

## 0.55.0

### Minor Changes

- [#1378](https://github.com/RocketChat/fuselage/pull/1378) [`b86d19b6c`](https://github.com/RocketChat/fuselage/commit/b86d19b6cd5ec784ef73bc5af57f6c4e21f528dc) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): new set of `NavBar` components

- [#1366](https://github.com/RocketChat/fuselage/pull/1366) [`756430c9e`](https://github.com/RocketChat/fuselage/commit/756430c9e530fe59ca8755f6649c5e282c9493c0) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): `Contextualbar` components size improvements

- [#1369](https://github.com/RocketChat/fuselage/pull/1369) [`ffef20480`](https://github.com/RocketChat/fuselage/commit/ffef20480bd420e486b375eb6d5b8b7704eda1b7) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): `Sidebar` header size improvements

### Patch Changes

- [#1398](https://github.com/RocketChat/fuselage/pull/1398) [`12da0a896`](https://github.com/RocketChat/fuselage/commit/12da0a8966c37ef1aad3e07e2c5d731b8b20c050) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): decrease `InputBox` small inline paddings

## 0.54.3

### Patch Changes

- [#1395](https://github.com/RocketChat/fuselage/pull/1395) [`07068a8c8`](https://github.com/RocketChat/fuselage/commit/07068a8c8bd1ff51eaf70756d0915a2cacd0a71d) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Fix the typing on OptionContent component

- [#1388](https://github.com/RocketChat/fuselage/pull/1388) [`bebe9bc1a`](https://github.com/RocketChat/fuselage/commit/bebe9bc1a82237f986efd68fca7526a12029fa21) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `IconButton` with badge positioning

- [#1392](https://github.com/RocketChat/fuselage/pull/1392) [`dfe712ee9`](https://github.com/RocketChat/fuselage/commit/dfe712ee9b496b4218f9d93155972f1909fa99ff) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): SidebarItem missing badge vertical alignment

- [#1390](https://github.com/RocketChat/fuselage/pull/1390) [`4094d78c5`](https://github.com/RocketChat/fuselage/commit/4094d78c51be1cac1dd783249671dd430987e7c1) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Modal components missing some a11y props

## 0.54.2

### Patch Changes

- [#1383](https://github.com/RocketChat/fuselage/pull/1383) [`5870a9395`](https://github.com/RocketChat/fuselage/commit/5870a939500e5b596be8c1ef1c2e28bb1cded4f5) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): remove `codeBlock` palette and add `palette` prop for a custom palette

## 0.54.1

### Patch Changes

- [#1381](https://github.com/RocketChat/fuselage/pull/1381) [`7e9138078`](https://github.com/RocketChat/fuselage/commit/7e91380780fdc862ff4546fdc449657f51f31aa1) Thanks [@dougfabris](https://github.com/dougfabris)! - Update dependencies [cef91c8dc](https://github.com/RocketChat/fuselage/commit/cef91c8dc646a4e9fc256eed6138eef108ee996c):
  - @rocket.chat/icons@0.36.0

## 0.54.0

### Minor Changes

- [#1377](https://github.com/RocketChat/fuselage/pull/1377) [`a4f8bb5fb`](https://github.com/RocketChat/fuselage/commit/a4f8bb5fb31a9f80e9d8d5b4bfbb0cbb4f9780e6) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): new `InputBox` small variant

## 0.53.7

### Patch Changes

- [#1363](https://github.com/RocketChat/fuselage/pull/1363) [`3bc0e982c`](https://github.com/RocketChat/fuselage/commit/3bc0e982c27748fc1cf2551dffbd1c9112feb141) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): MessageToolbar missing opacity on hover

- [#1372](https://github.com/RocketChat/fuselage/pull/1372) [`3b6daeebc`](https://github.com/RocketChat/fuselage/commit/3b6daeebcd0341f784ddbaa95deba26a128f37bc) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `Bubble` missing font-family

## 0.53.6

### Patch Changes

- [#1370](https://github.com/RocketChat/fuselage/pull/1370) [`c94bd1cb8`](https://github.com/RocketChat/fuselage/commit/c94bd1cb8bf6586126da852b29594f6eadfc1d78) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): add `MessageSystem` missing colors

## 0.53.5

### Patch Changes

- [#1356](https://github.com/RocketChat/fuselage/pull/1356) [`fb710526b`](https://github.com/RocketChat/fuselage/commit/fb710526ba7a0adfe9356ae4518da10879f824ef) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): remove margins from `ButtonGroup` first and last items

## 0.53.4

### Patch Changes

- [#1354](https://github.com/RocketChat/fuselage/pull/1354) [`d0c9e107f`](https://github.com/RocketChat/fuselage/commit/d0c9e107f1e787755c2a6358cab1ed45971fd5d8) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix(fuselage): Remove `option` role from `Autocomplete` Options component

- [#1352](https://github.com/RocketChat/fuselage/pull/1352) [`34b047478`](https://github.com/RocketChat/fuselage/commit/34b047478f97c3e1bb94d801f212be41ffbe2cbb) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): MessageReactions missing border color

## 0.53.3

### Patch Changes

- Updated dependencies [[`bfe0abfb0`](https://github.com/RocketChat/fuselage/commit/bfe0abfb0bc2f828a0b6675f4719509d978a0a0f)]:
  - @rocket.chat/fuselage-tokens@0.33.1

## 0.53.2

### Patch Changes

- [#1344](https://github.com/RocketChat/fuselage/pull/1344) [`8f67c5d20`](https://github.com/RocketChat/fuselage/commit/8f67c5d20939258bf4f09ee8d6ca36b68496c7ac) Thanks [@dougfabris](https://github.com/dougfabris)! - fix: wrong `MessageMetrics` export

## 0.53.1

### Patch Changes

- [#1342](https://github.com/RocketChat/fuselage/pull/1342) [`71c221684`](https://github.com/RocketChat/fuselage/commit/71c22168458c51975b32170a53c4a835124bec2b) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): MessageMetrics props types

## 0.53.0

### Minor Changes

- [#1338](https://github.com/RocketChat/fuselage/pull/1338) [`ea37a3110`](https://github.com/RocketChat/fuselage/commit/ea37a3110670e507c1a33c0793b6cef1b5ff1215) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Accept disable button prop on CodeSnippet component

## 0.52.0

### Minor Changes

- [#1331](https://github.com/RocketChat/fuselage/pull/1331) [`bd17e9c59`](https://github.com/RocketChat/fuselage/commit/bd17e9c59696f26bf59f7f389f08f3185a780c65) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): MessageReactions focus state

### Patch Changes

- [#1335](https://github.com/RocketChat/fuselage/pull/1335) [`cef61fd9f`](https://github.com/RocketChat/fuselage/commit/cef61fd9f0e2139f54036809b11782de09b9d025) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): show `AutoComplete` placeholder

## 0.51.3

### Patch Changes

- [#1327](https://github.com/RocketChat/fuselage/pull/1327) [`350eaa1ac`](https://github.com/RocketChat/fuselage/commit/350eaa1ac73a4dc66f1b6787df475c52389f96b6) Thanks [@csuadev](https://github.com/csuadev)! - fix(fuselage): Add missing renderItem property on PaginatedSelect component to allow options customization.

- [#1328](https://github.com/RocketChat/fuselage/pull/1328) [`6eecf95fb`](https://github.com/RocketChat/fuselage/commit/6eecf95fb1f7e77032de801033134eaed3e4501f) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): add missing `Bubble` gap

## 0.51.2

### Patch Changes

- [#1322](https://github.com/RocketChat/fuselage/pull/1322) [`f67ac5dc0`](https://github.com/RocketChat/fuselage/commit/f67ac5dc0a02ce47468a640d08e8ba373eca3d51) Thanks [@csuadev](https://github.com/csuadev)! - fix(fuselage): Added missing render property from PaginatedMultiselect on PaginatedMultiSelectFiltered component to allow rendering items on it.

## 0.51.1

### Patch Changes

- [#1324](https://github.com/RocketChat/fuselage/pull/1324) [`8f4502968`](https://github.com/RocketChat/fuselage/commit/8f450296822ee8a087831683828f513c2156b279) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Avoid duplicated alert on ToastBar

- [#1323](https://github.com/RocketChat/fuselage/pull/1323) [`9ccc4e79f`](https://github.com/RocketChat/fuselage/commit/9ccc4e79f76c1ef2b182065883bd66a91860bc96) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(icons): New circle-unfilled

## 0.51.0

### Minor Changes

- [#1319](https://github.com/RocketChat/fuselage/pull/1319) [`b37dd11c9`](https://github.com/RocketChat/fuselage/commit/b37dd11c9bd0fc4dbdda5ab5e623dfc46c8d8647) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add forwardRef on Contextualbar

### Patch Changes

- [#1320](https://github.com/RocketChat/fuselage/pull/1320) [`06b1d5701`](https://github.com/RocketChat/fuselage/commit/06b1d57015c59fbba95c8986fe054c2b3336f73f) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `ToastBar` remove close button from content alert

## 0.50.1

### Patch Changes

- [#1317](https://github.com/RocketChat/fuselage/pull/1317) [`410a12131`](https://github.com/RocketChat/fuselage/commit/410a1213140b6dbfccdd75c9dfcf4b90938bf51d) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): remove margin inline end from bubble icon

## 0.50.0

### Minor Changes

- [#1311](https://github.com/RocketChat/fuselage/pull/1311) [`aff73a3cb`](https://github.com/RocketChat/fuselage/commit/aff73a3cbbbc80dbd2045c3644cc787f1ca5eb4e) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add focus state on `MessgeHighlight`

### Patch Changes

- [#1310](https://github.com/RocketChat/fuselage/pull/1310) [`564174632`](https://github.com/RocketChat/fuselage/commit/564174632ccda751555a1e4128c3b897bbc1b86f) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `MessageToolbarWrapper` visibility

- [#1312](https://github.com/RocketChat/fuselage/pull/1312) [`91fe5c9d3`](https://github.com/RocketChat/fuselage/commit/91fe5c9d3600404a11529018c01907edb00e4c05) Thanks [@csuadev](https://github.com/csuadev)! - Change border color on Accordion component that was affecting dark mode, requested by design.

- [#1314](https://github.com/RocketChat/fuselage/pull/1314) [`75305d76e`](https://github.com/RocketChat/fuselage/commit/75305d76e336f635efc855f7f6545605f873126c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `Contextualbar` elements syntax

## 0.49.0

### Minor Changes

- [#1289](https://github.com/RocketChat/fuselage/pull/1289) [`a40d471bd`](https://github.com/RocketChat/fuselage/commit/a40d471bdf71babf652f5df3108a05d92f08d975) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): new `PaletteStyleTag` component

### Patch Changes

- Updated dependencies [[`a40d471bd`](https://github.com/RocketChat/fuselage/commit/a40d471bdf71babf652f5df3108a05d92f08d975)]:
  - @rocket.chat/fuselage-tokens@0.33.0

## 0.48.0

### Minor Changes

- [#1303](https://github.com/RocketChat/fuselage/pull/1303) [`168ff5b12`](https://github.com/RocketChat/fuselage/commit/168ff5b12a6ce1ddf3ba6a881d3634326516faee) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Adds `Tag` focus state

## 0.47.1

### Patch Changes

- [#1291](https://github.com/RocketChat/fuselage/pull/1291) [`7d61a2677`](https://github.com/RocketChat/fuselage/commit/7d61a26778253cf2e022a7d9422fdbe3aaedd9f2) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `MessageNameContainer` missing forwardRef

## 0.47.0

### Minor Changes

- [#1287](https://github.com/RocketChat/fuselage/pull/1287) [`2863143ae`](https://github.com/RocketChat/fuselage/commit/2863143aee7e57df16d19ca86659a59800363b24) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Popover

### Patch Changes

- [#1280](https://github.com/RocketChat/fuselage/pull/1280) [`8b8d43b74`](https://github.com/RocketChat/fuselage/commit/8b8d43b74da69094ea026aa041f8313be5c896b4) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): MessageSystem time fontScale

- [#1288](https://github.com/RocketChat/fuselage/pull/1288) [`7390c0205`](https://github.com/RocketChat/fuselage/commit/7390c02057d52d3e62206667c5c26e0aedf70f26) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Prevent focus state on clicking in Messages

## 0.46.0

### Minor Changes

- [#1278](https://github.com/RocketChat/fuselage/pull/1278) [`7ed164c23`](https://github.com/RocketChat/fuselage/commit/7ed164c233fa6c511daa3951daa8c7af0c10bc86) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): new `Bubble` variations

## 0.45.0

### Minor Changes

- [#1277](https://github.com/RocketChat/fuselage/pull/1277) [`775236cb4`](https://github.com/RocketChat/fuselage/commit/775236cb4f391194183a96df48ea241b1429dab6) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add forwardRef in MessageToolbar

### Patch Changes

- [#1275](https://github.com/RocketChat/fuselage/pull/1275) [`7451ecae5`](https://github.com/RocketChat/fuselage/commit/7451ecae56d9f4a73f00ca4b212e33260cf7a81b) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): change `card-horizontal` row gap

- [#1270](https://github.com/RocketChat/fuselage/pull/1270) [`3469b7798`](https://github.com/RocketChat/fuselage/commit/3469b7798242b1925ac243cdf3268d4d7d7c3597) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): normalize links

## 0.44.2

### Patch Changes

- [#1273](https://github.com/RocketChat/fuselage/pull/1273) [`48363f168`](https://github.com/RocketChat/fuselage/commit/48363f168a67ec5fa2c3999a3a53e55d0cd84078) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Add flexGrow for stretch variation

## 0.44.1

### Patch Changes

- [#1271](https://github.com/RocketChat/fuselage/pull/1271) [`7cbad7df4`](https://github.com/RocketChat/fuselage/commit/7cbad7df405439c7b1bd3050bafce15e6b8ceff9) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): `ButtonGroup` missing `className` exposure

## 0.44.0

### Minor Changes

- [#1264](https://github.com/RocketChat/fuselage/pull/1264) [`119f80664`](https://github.com/RocketChat/fuselage/commit/119f806649869b1d73bd0f774f7de629cc13bc31) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Add Message focus style

- [`971f07aae`](https://github.com/RocketChat/fuselage/commit/971f07aae4076481fd6b7d37c417d9b00972bc4a) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Avoid `Box` usage on `ButtonGroup`

## 0.43.0

### Minor Changes

- [#1263](https://github.com/RocketChat/fuselage/pull/1263) [`9020c0ee8`](https://github.com/RocketChat/fuselage/commit/9020c0ee87eeb4c903091b0e03ab9802c39591f0) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): new `Bubble` component

- [#1221](https://github.com/RocketChat/fuselage/pull/1221) [`769e5ea43`](https://github.com/RocketChat/fuselage/commit/769e5ea43fa7c83f988d7dfb042aeafaf66e1ad5) Thanks [@VanshulB](https://github.com/VanshulB)! - Add missing message body additional styles to `MessageBody`

### Patch Changes

- [#1244](https://github.com/RocketChat/fuselage/pull/1244) [`9be609744`](https://github.com/RocketChat/fuselage/commit/9be609744856f49b8971fb7aa45316ec7fd2463f) Thanks [@tassoevan](https://github.com/tassoevan)! - Deprecate `useMutableCallback` in favor of `useEffectEvent`

## 0.42.0

### Minor Changes

- [#1087](https://github.com/RocketChat/fuselage/pull/1087) [`4cd95535b`](https://github.com/RocketChat/fuselage/commit/4cd95535b6c384af6cb56ce98e2045dbe65ef9de) Thanks [@ggazzo](https://github.com/ggazzo)! - feat(fuselage): Adds detached prop to render Menu on the document body

## 0.41.0

### Minor Changes

- [#1249](https://github.com/RocketChat/fuselage/pull/1249) [`55fb265df`](https://github.com/RocketChat/fuselage/commit/55fb265df90f0a4ad309482fc2e16f111fddae9d) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): `FramedIcon` new component

### Patch Changes

- [#1255](https://github.com/RocketChat/fuselage/pull/1255) [`84b486f63`](https://github.com/RocketChat/fuselage/commit/84b486f63c12de17d9ed4c316b58e86c3f1a884e) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `FramedIcon` HTMLAttributes props

## 0.40.0

### Minor Changes

- [#1247](https://github.com/RocketChat/fuselage/pull/1247) [`f9dc8b2a2`](https://github.com/RocketChat/fuselage/commit/f9dc8b2a28fd60bdfc3fe5a3bc49b4b863dd56c9) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): add `Card` hero variant

## 0.39.0

### Minor Changes

- [#1242](https://github.com/RocketChat/fuselage/pull/1242) [`f659bae77`](https://github.com/RocketChat/fuselage/commit/f659bae771f38e09e85b39bb5343ffd24ac6430b) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): `CardGrid` component

### Patch Changes

- [#1238](https://github.com/RocketChat/fuselage/pull/1238) [`286b30c1d`](https://github.com/RocketChat/fuselage/commit/286b30c1db31a3c81612b2089b69812f2a796aca) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): FieldLabel margins and paddings

## 0.38.4

### Patch Changes

- [#1240](https://github.com/RocketChat/fuselage/pull/1240) [`617e8817b`](https://github.com/RocketChat/fuselage/commit/617e8817b5d0e7974d8a8d2e52a9b3f2ecb6fa6e) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `CardGroup` wrap margins

## 0.38.3

### Patch Changes

- [#1239](https://github.com/RocketChat/fuselage/pull/1239) [`0245820b5`](https://github.com/RocketChat/fuselage/commit/0245820b5f325ff0243d9a97db5ad7d4d373d6fe) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `CardControls` alignment

## 0.38.2

### Patch Changes

- [#1232](https://github.com/RocketChat/fuselage/pull/1232) [`6d5778611`](https://github.com/RocketChat/fuselage/commit/6d577861193b7675d16ad415e36d53681a99392f) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `Card` spacing

## 0.38.1

### Patch Changes

- [#1222](https://github.com/RocketChat/fuselage/pull/1222) [`ab9e4bf83`](https://github.com/RocketChat/fuselage/commit/ab9e4bf83d01cffb11b3ab803838770040bd2f2a) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Handle `onBlur` prop on AutoComplete

## 0.38.0

### Minor Changes

- [#1220](https://github.com/RocketChat/fuselage/pull/1220) [`b0de1ec7e`](https://github.com/RocketChat/fuselage/commit/b0de1ec7effbd6fd4bd7fcbb71920c4186da45a7) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): update `SidebarItem` highlighted weight

- [#1214](https://github.com/RocketChat/fuselage/pull/1214) [`68674c502`](https://github.com/RocketChat/fuselage/commit/68674c502014e31b15cb81ab85d62677814a60fd) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): create `LabelInfo` component

## 0.37.1

### Patch Changes

- [#1210](https://github.com/RocketChat/fuselage/pull/1210) [`a95b2f7b3`](https://github.com/RocketChat/fuselage/commit/a95b2f7b3ed2fa7cc325898dbf8555e1976dc308) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): add `Callout` missing background-color

## 0.37.0

### Minor Changes

- [#1205](https://github.com/RocketChat/fuselage/pull/1205) [`5a6d05c30`](https://github.com/RocketChat/fuselage/commit/5a6d05c3005cfe24b04b3511bbe945d23de0a6b1) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): add loading state to `Button`

### Patch Changes

- [#1206](https://github.com/RocketChat/fuselage/pull/1206) [`ec378a6bc`](https://github.com/RocketChat/fuselage/commit/ec378a6bc40cc2d209d753a2fbb05b1f814ca2f0) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): change `Callout` text color

## 0.36.0

### Minor Changes

- [#1198](https://github.com/RocketChat/fuselage/pull/1198) [`e64ef6805`](https://github.com/RocketChat/fuselage/commit/e64ef680517a69d4d370c008698a470002960916) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): New `surface-sidebar` token

## 0.35.0

### Minor Changes

- [#1199](https://github.com/RocketChat/fuselage/pull/1199) [`2b4f0079c`](https://github.com/RocketChat/fuselage/commit/2b4f0079cae052e21a2000fb40922dc37e0aabdb) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): change `link:active` color

- [#1128](https://github.com/RocketChat/fuselage/pull/1128) [`6db5cb214`](https://github.com/RocketChat/fuselage/commit/6db5cb2141bf42c9622c5846701e5b26392a1ada) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage, fuselage-tokens): Update primitive tokens

- [#1203](https://github.com/RocketChat/fuselage/pull/1203) [`da8cf6a97`](https://github.com/RocketChat/fuselage/commit/da8cf6a97c89263c020198e0c01aba27f57941d4) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - feat(fuselage): Add `renderItem` prop to the `PaginatedMultiSelect` component

### Patch Changes

- [#1202](https://github.com/RocketChat/fuselage/pull/1202) [`a7ec3d9d3`](https://github.com/RocketChat/fuselage/commit/a7ec3d9d301a4092f6524337d88857d0c3372009) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): `SidebarItem` margins

- Updated dependencies [[`6db5cb214`](https://github.com/RocketChat/fuselage/commit/6db5cb2141bf42c9622c5846701e5b26392a1ada)]:
  - @rocket.chat/fuselage-tokens@0.32.0

## 0.34.0

### Minor Changes

- [#1196](https://github.com/RocketChat/fuselage/pull/1196) [`a1c679732`](https://github.com/RocketChat/fuselage/commit/a1c67973288a3383332639a5d49c7fce12c94b5e) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): change `SidebarItem` focus color

- [#1194](https://github.com/RocketChat/fuselage/pull/1194) [`34e442115`](https://github.com/RocketChat/fuselage/commit/34e442115f34da3f5843d48ffe711766074f707c) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): `Callout` visual changes

- [#1190](https://github.com/RocketChat/fuselage/pull/1190) [`c2afab784`](https://github.com/RocketChat/fuselage/commit/c2afab78473f2068d695a3d7f018531b5b7fb058) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Added a new property "addon" and updated colors from grey to white.

- [#1195](https://github.com/RocketChat/fuselage/pull/1195) [`9ce0dd4fb`](https://github.com/RocketChat/fuselage/commit/9ce0dd4fb871812673efac7f7bd29395f6e4ef70) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage): option to use `Tag` as link

### Patch Changes

- [#1191](https://github.com/RocketChat/fuselage/pull/1191) [`44f851599`](https://github.com/RocketChat/fuselage/commit/44f85159922eb514e3c9a5400c22071b7d8ed5e8) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): `ContextualbarAction` size

- [#1193](https://github.com/RocketChat/fuselage/pull/1193) [`6df7d7abf`](https://github.com/RocketChat/fuselage/commit/6df7d7abf63e522c92bd4004f05d49135aa09b33) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Remove underline prevention on anchor elements

## 0.33.0

### Minor Changes

- [#1186](https://github.com/RocketChat/fuselage/pull/1186) [`8f2c2adeb`](https://github.com/RocketChat/fuselage/commit/8f2c2adebc54a7a211cacae9fdbbb3d28d75ece0) Thanks [@juliajforesti](https://github.com/juliajforesti)! - chore(fuselage): change button focus shadow colors

### Patch Changes

- [#1179](https://github.com/RocketChat/fuselage/pull/1179) [`5f60cfd3c`](https://github.com/RocketChat/fuselage/commit/5f60cfd3c67e5c3d77cfc54c9b4f1e273ca2a135) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Fixed tooltip not being displayed on `PaginatedSelect` options

## 0.32.2

### Patch Changes

- [#1173](https://github.com/RocketChat/fuselage/pull/1173) [`dfe36764d`](https://github.com/RocketChat/fuselage/commit/dfe36764decaa54a6044102d7e0df18f4b343b7c) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): improve focus state color

- [#1178](https://github.com/RocketChat/fuselage/pull/1178) [`0a104a02e`](https://github.com/RocketChat/fuselage/commit/0a104a02e50a4bb3218b1c54c74ac38ae9489498) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): className prop drilling improvements on `CheckBox`, `ToggleSwitch` and `RadioButton`

## 0.32.1

### Patch Changes

- [#1169](https://github.com/RocketChat/fuselage/pull/1169) [`2c25e7575`](https://github.com/RocketChat/fuselage/commit/2c25e7575c76c44db33a63c17c437b09ab286d19) Thanks [@tassoevan](https://github.com/tassoevan)! - Memory leak in `PaginatedMultiSelect`

- [`a97c7f086`](https://github.com/RocketChat/fuselage/commit/a97c7f08633e6e36a39c8933b530f9acacb83af0) Thanks [@dougfabris](https://github.com/dougfabris)! - chore: resolve-workspace-deps to publish pkg versions

- [`387c4016c`](https://github.com/RocketChat/fuselage/commit/387c4016cd91163da3e8add47aeca34f4e17f3c3) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): RadioButton a11y best practices improvement

- [#1168](https://github.com/RocketChat/fuselage/pull/1168) [`0ce79189d`](https://github.com/RocketChat/fuselage/commit/0ce79189d4e112d963f0d7650f7864f26539c063) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage): AutoComplete a11y best practices improvement

## 0.32.0

### Minor Changes

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Field deprecation message

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Button size

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): OptionInput margins and alignment

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): AudioPlayer: Infinity duration audio files crashing

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): css theme

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): MessageReactionAction icon size

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): prevent button-disabled click animation

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): IconButton with badge click-animation

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): change FieldLabel typography

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage): Remove unnecessary aria-label fallback in `IconButton

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): ToggleSwitch best practices adjustments

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Modal a11y improvements

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Table background-color

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): color a11y report changes

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): button click animation

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Checkbox best practices adjustments

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Fix Accordion a11y

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Avatar a11y improvements

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Prop to keep MessageToolbox visible.

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - chore(fuselage): Field & Label best practices adjustments

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.31.0](https://github.com/RocketChat/fuselage/compare/v0.30.1...v0.31.0) (2021-12-28)

### Bug Fixes

- docker image version ([8f181cf](https://github.com/RocketChat/fuselage/commit/8f181cf5a96084d7abd9ea94efd46cc50840c798))
- **fuselage:** Chip missing styles ([#568](https://github.com/RocketChat/fuselage/issues/568)) ([e1b8963](https://github.com/RocketChat/fuselage/commit/e1b8963861abbb5a98996d48482e47c5f383f887))
- **fuselage:** States Component Font Style ([#579](https://github.com/RocketChat/fuselage/issues/579)) ([4322376](https://github.com/RocketChat/fuselage/commit/432237670f77dfcf391d9bbf6a6f2d30e0f9ba05))

### Features

- Empty state variations Logic ([#598](https://github.com/RocketChat/fuselage/issues/598)) ([06ee58c](https://github.com/RocketChat/fuselage/commit/06ee58c30bf360072632f7875d0bfee184c8ce4c))
- **fuselage:** Component Dropdown ([#594](https://github.com/RocketChat/fuselage/issues/594)) ([31314b3](https://github.com/RocketChat/fuselage/commit/31314b3a7d29446a23307495e919de9aa3a4e8d0))
- **fuselage:** Empty State Component ([#572](https://github.com/RocketChat/fuselage/issues/572)) ([aa22b55](https://github.com/RocketChat/fuselage/commit/aa22b55ddb57b046411d0cd08468e47e56158f38))
- **fuselage:** Message preview component ([#553](https://github.com/RocketChat/fuselage/issues/553)) ([f8bd0ad](https://github.com/RocketChat/fuselage/commit/f8bd0ad637c0d2edad47b3c2384dac9c84e8d4fd))
- **fuselage:** Replace typography of Message's user name and Banner's title ([#577](https://github.com/RocketChat/fuselage/issues/577)) ([6af2dba](https://github.com/RocketChat/fuselage/commit/6af2dbabc90d2e2f1598cbbd113ecc3ea82adfc0))
- **icons:** New icons ([#596](https://github.com/RocketChat/fuselage/issues/596)) ([c54702b](https://github.com/RocketChat/fuselage/commit/c54702bc4a36e599f5ce84850c4f0ad0ebe29c27))
- Message Preview ([#587](https://github.com/RocketChat/fuselage/issues/587)) ([e69dad3](https://github.com/RocketChat/fuselage/commit/e69dad3a6619e98ff70bcd1cb68567a159187336))
- New hooks for element size tracking ([#413](https://github.com/RocketChat/fuselage/issues/413)) ([8ca682c](https://github.com/RocketChat/fuselage/commit/8ca682c636d2e4813f7d346cb881513382be63cf))

# [0.30.0](https://github.com/RocketChat/fuselage/compare/v0.29.0...v0.30.0) (2021-10-06)

### Bug Fixes

- SelectFilter style ([1f7e745](https://github.com/RocketChat/fuselage/commit/1f7e745c238c2082783216a2c8725c9f418ae2cc))
- **fuselage:** Remove Field margin ([#543](https://github.com/RocketChat/fuselage/issues/543)) ([0cc10e1](https://github.com/RocketChat/fuselage/commit/0cc10e1b86bcf14a9ae590537a3d8e460b39b167))
- **jest:** Adjust jest and ts-jest dependencies ([#547](https://github.com/RocketChat/fuselage/issues/547)) ([91a4fa1](https://github.com/RocketChat/fuselage/commit/91a4fa1365394001afe1bd46480bda3bafed5505))

### Features

- **icons:** Update/Add icons (phone-in&out, dialpad, phone-disabled) ([#533](https://github.com/RocketChat/fuselage/issues/533)) ([2f3ae02](https://github.com/RocketChat/fuselage/commit/2f3ae02a6fc92d92e99e5be56a63670dda494e00))

# [0.29.0](https://github.com/RocketChat/fuselage/compare/v0.28.0...v0.29.0) (2021-08-31)

### Bug Fixes

- modal styles ([de15810](https://github.com/RocketChat/fuselage/commit/de158102f711658cdda8899a74cbefdff29fa48a))

### Features

- **icons:** New icons ([#511](https://github.com/RocketChat/fuselage/issues/511)) ([1fa7748](https://github.com/RocketChat/fuselage/commit/1fa774819edea5b4bda9e58a6b272745c7c6ad57))
- **onboarding-ui:** Request trial form ([#505](https://github.com/RocketChat/fuselage/issues/505)) ([4c1bd35](https://github.com/RocketChat/fuselage/commit/4c1bd35324903badee9fec79e878ab045f7d5897))

# [0.28.0](https://github.com/RocketChat/fuselage/compare/v0.27.0...v0.28.0) (2021-07-30)

### Bug Fixes

- Add Tab.Item definition ([#503](https://github.com/RocketChat/fuselage/issues/503)) ([9a7f3d5](https://github.com/RocketChat/fuselage/commit/9a7f3d5a357bb9bea1f5cf85c50d90398f916bee))
- Forwarding ref in Select components ([#492](https://github.com/RocketChat/fuselage/issues/492)) ([6c360bd](https://github.com/RocketChat/fuselage/commit/6c360bd040da19dc331b7fb8d208418a5b51f916))
- Missing Sidebar type ([#506](https://github.com/RocketChat/fuselage/issues/506)) ([78f202d](https://github.com/RocketChat/fuselage/commit/78f202d5b84f1bc7fe638070ece020126dcdd686))
- Sidebar item icon styles ([#481](https://github.com/RocketChat/fuselage/issues/481)) ([86b333a](https://github.com/RocketChat/fuselage/commit/86b333a790563c9178712e5f1240d36fa0fb5be5))
- **fuselage:** No preventDefault on PaginatedSelect ([#490](https://github.com/RocketChat/fuselage/issues/490)) ([0ffb736](https://github.com/RocketChat/fuselage/commit/0ffb736b1cc1c9a6d7897fbcf89baf42573c6c33))
- Table props ([#484](https://github.com/RocketChat/fuselage/issues/484)) ([67b6f27](https://github.com/RocketChat/fuselage/commit/67b6f2757c551b9b455a5babd51e0bc89f12ed71))

### Features

- **onboarding-ui:** Administrator information form and Organization information form ([#489](https://github.com/RocketChat/fuselage/issues/489)) ([b289f68](https://github.com/RocketChat/fuselage/commit/b289f68676954b91c792d8d97680314178bf2c60))
- **onboarding-ui:** Common components ([#478](https://github.com/RocketChat/fuselage/issues/478)) ([d7511ab](https://github.com/RocketChat/fuselage/commit/d7511ab435bae8c35e02071832c9a615078a83d5))
- **onboarding-ui:** Self-hosted registration ([#501](https://github.com/RocketChat/fuselage/issues/501)) ([e47d579](https://github.com/RocketChat/fuselage/commit/e47d579938f1cb670e787b27402ece214e7d37e9))
- styled API; monorepo grooming ([#482](https://github.com/RocketChat/fuselage/issues/482)) ([1b6b70c](https://github.com/RocketChat/fuselage/commit/1b6b70cf67ec16927b1566adc2350295a8927223))

# [0.27.0](https://github.com/RocketChat/fuselage/compare/v0.26.0...v0.27.0) (2021-06-28)

### Bug Fixes

- Default-export typings for Position and PositionAnimated ([88fb952](https://github.com/RocketChat/fuselage/commit/88fb952da8caa9ab70c37ecf6ec09af5774ddd0b))
- endReached prop in \_Options of PaginatedSelectFiltered Component ([#475](https://github.com/RocketChat/fuselage/issues/475)) ([81ec00f](https://github.com/RocketChat/fuselage/commit/81ec00f11c7016f25728bf394ac00686f5d6729d))
- Export correctly props and types from PositionAnimated and Tile components ([#467](https://github.com/RocketChat/fuselage/issues/467)) ([67a86ec](https://github.com/RocketChat/fuselage/commit/67a86ece971d729085f6969eb063e17323fe59e3))
- Export MultiSelect component in .d.ts file ([#473](https://github.com/RocketChat/fuselage/issues/473)) ([dbdbf58](https://github.com/RocketChat/fuselage/commit/dbdbf587821e8d86fed5ce17b75e3f8c95a5822f))
- Menu component and options.label prop type ([#476](https://github.com/RocketChat/fuselage/issues/476)) ([dea7a16](https://github.com/RocketChat/fuselage/commit/dea7a16d1feb5ccc16b0cb9096842f275dc1cdc3))
- **eslint:** Add missing ESLint rule for TypeScript ([#470](https://github.com/RocketChat/fuselage/issues/470)) ([cc0d498](https://github.com/RocketChat/fuselage/commit/cc0d4989bf37f7602d1d58d051824f1dd6c096b3))
- **fuselage:** Fuselage production build ([#477](https://github.com/RocketChat/fuselage/issues/477)) ([228878c](https://github.com/RocketChat/fuselage/commit/228878cdbf260e2929b5527fb84c936fbc03b772))
- PositionAnimated exported type ([#466](https://github.com/RocketChat/fuselage/issues/466)) ([472fb1e](https://github.com/RocketChat/fuselage/commit/472fb1e03a48ee964226644221267ccbb527ab1f))
- Typings for Position and PositionAnimated properly exported ([#465](https://github.com/RocketChat/fuselage/issues/465)) ([f05c126](https://github.com/RocketChat/fuselage/commit/f05c12641d1e8ec35a8a428571e938d6ad7369a7))
- Typings for RadioButton ([#464](https://github.com/RocketChat/fuselage/issues/464)) ([3e36605](https://github.com/RocketChat/fuselage/commit/3e36605ac1518ac2adc080f14dd07f6b830fdb6b))

### Features

- onboarding-ui package ([#463](https://github.com/RocketChat/fuselage/issues/463)) ([ea0a6c2](https://github.com/RocketChat/fuselage/commit/ea0a6c25ae1a719103dce742a18c54ab4f3d6442))
- Visibility toggle for PasswordInput ([#377](https://github.com/RocketChat/fuselage/issues/377)) ([5ef1bec](https://github.com/RocketChat/fuselage/commit/5ef1bec606e626704235cadfdb9bb7d424f8e481))

# [0.26.0](https://github.com/RocketChat/fuselage/compare/v0.25.0...v0.26.0) (2021-05-28)

### Bug Fixes

- **fuselage:** fix duplicated values on paginated multi select ([#456](https://github.com/RocketChat/fuselage/issues/456)) ([5fbde6d](https://github.com/RocketChat/fuselage/commit/5fbde6de715478d9a5c5507d9e9374e1e937c349))

### Features

- **fuselage:** Message Template ([#458](https://github.com/RocketChat/fuselage/issues/458)) ([2b5308e](https://github.com/RocketChat/fuselage/commit/2b5308e2ade69e9b2aa5b419f5531a9cebc5366a))

# [0.25.0](https://github.com/RocketChat/fuselage/compare/v0.24.0...v0.25.0) (2021-05-19)

### Bug Fixes

- **fuselage:** fix duplicated values on paginated multi select ([#456](https://github.com/RocketChat/fuselage/issues/456)) ([4518a4e](https://github.com/RocketChat/fuselage/commit/4518a4e661cb525d957f6140d59a641a50fc7b20))
- cd.yml ([53d44c0](https://github.com/RocketChat/fuselage/commit/53d44c014d796b749e60c0f3a72f205fbce04624))
- Tag's border-radius ([#452](https://github.com/RocketChat/fuselage/issues/452)) ([177936e](https://github.com/RocketChat/fuselage/commit/177936e72c2e136e7d021deb2f778fec71c23355))

### Features

- **fuselage:** New paginated Selects/Options ([a7f9c9a](https://github.com/RocketChat/fuselage/commit/a7f9c9a64513a82013a902174d2195a0e26621ce))
- [@rocket](https://github.com/rocket).chat/message-parser ([#443](https://github.com/RocketChat/fuselage/issues/443)) ([4722cdf](https://github.com/RocketChat/fuselage/commit/4722cdff46f5987f335d989be59649c7652bb12a))

# [0.24.0](https://github.com/RocketChat/fuselage/compare/v0.23.0...v0.24.0) (2021-04-28)

### Bug Fixes

- Add more props to Throbber type definition ([#429](https://github.com/RocketChat/fuselage/issues/429)) ([2516d42](https://github.com/RocketChat/fuselage/commit/2516d42bcf9c87ed5d51bdfbe149b1ef65d61ab0))
- Change highlighted style ([#422](https://github.com/RocketChat/fuselage/issues/422)) ([245de4f](https://github.com/RocketChat/fuselage/commit/245de4f0777dc6143e6faf50a1d398d359f247b0))
- Hollow shapes for status ([#430](https://github.com/RocketChat/fuselage/issues/430)) ([bc29d2d](https://github.com/RocketChat/fuselage/commit/bc29d2de260439263cba413ada13bb77f6b557c9))
- Modal close button size ([#420](https://github.com/RocketChat/fuselage/issues/420)) ([6279f69](https://github.com/RocketChat/fuselage/commit/6279f69af48329bb6908a9f428b942b1f961c892))
- MultiSelect close on click when opened ([#418](https://github.com/RocketChat/fuselage/issues/418)) ([1e4b30b](https://github.com/RocketChat/fuselage/commit/1e4b30bac334e7ecc10840be84c69c015660f29c))
- Pagination and Select prop types ([#436](https://github.com/RocketChat/fuselage/issues/436)) ([0461f41](https://github.com/RocketChat/fuselage/commit/0461f41c8676c4d90ecc28a26939b206802721e0))
- Prefer null over undefined on BoxTransforms ([#426](https://github.com/RocketChat/fuselage/issues/426)) ([9cba6b8](https://github.com/RocketChat/fuselage/commit/9cba6b802b0250d0d6704bfccc96bd7ca62cc5e6))
- Remove reference to inexistent interface ([#424](https://github.com/RocketChat/fuselage/issues/424)) ([dcf43c2](https://github.com/RocketChat/fuselage/commit/dcf43c232fd9b01161b76883b85a01356c80e774))
- Select option don't toggle on clicking the close icon ([#417](https://github.com/RocketChat/fuselage/issues/417)) ([4401d94](https://github.com/RocketChat/fuselage/commit/4401d94be1f93e192f89c433efb53ba3b1840fc4))
- Set highlighted class to Sidebar.Item.Icon ([#433](https://github.com/RocketChat/fuselage/issues/433)) ([b550f49](https://github.com/RocketChat/fuselage/commit/b550f4944a11aae34608d0e7dc112de21594eaa3))
- Status bullet sizing ([#440](https://github.com/RocketChat/fuselage/issues/440)) ([f70156e](https://github.com/RocketChat/fuselage/commit/f70156ed3adc534865c841e19f115704232d860f))
- Tabs design update ([#427](https://github.com/RocketChat/fuselage/issues/427)) ([a34c7cd](https://github.com/RocketChat/fuselage/commit/a34c7cd9a873b4568bd3e099155c32f743e5c599))
- Typings for ProgressBar ([#438](https://github.com/RocketChat/fuselage/issues/438)) ([6ea5648](https://github.com/RocketChat/fuselage/commit/6ea56486164a01b100b5941976902341daeb61dd))

### Features

- [@rocket](https://github.com/rocket).chat/string-helpers ([#431](https://github.com/RocketChat/fuselage/issues/431)) ([2509d6a](https://github.com/RocketChat/fuselage/commit/2509d6acdbe5ec8b216e8d4430373797c5f5dfe2))
- Tabs Design Margin ([#437](https://github.com/RocketChat/fuselage/issues/437)) ([c92386f](https://github.com/RocketChat/fuselage/commit/c92386f6eee7cbe2b1df8053369f7856b74d8c95))

# [0.23.0](https://github.com/RocketChat/fuselage/compare/v0.22.0...v0.23.0) (2021-04-01)

### Bug Fixes

- **npm:** Wrong paths in "files" field of package.json ([6d3c811](https://github.com/RocketChat/fuselage/commit/6d3c811f6fd747de7f47aff145902d88476272ee))
- Add more type definitions ([#415](https://github.com/RocketChat/fuselage/issues/415)) ([96bb6ae](https://github.com/RocketChat/fuselage/commit/96bb6ae27dfc51b344bf229c5adf121ec0a069af))
- Broken stories for AutoComplete ([#368](https://github.com/RocketChat/fuselage/issues/368)) ([8b6d35e](https://github.com/RocketChat/fuselage/commit/8b6d35e3a36573931010411f733cf46a8e82579b))
- Speech balloon icon aliases ([#414](https://github.com/RocketChat/fuselage/issues/414)) ([5a0fa7c](https://github.com/RocketChat/fuselage/commit/5a0fa7c43359178005d4b05d60781f6613671e9e))

### Features

- Add Modal Icon to Modal Component ([#410](https://github.com/RocketChat/fuselage/issues/410)) ([c6a8b3e](https://github.com/RocketChat/fuselage/commit/c6a8b3e0423f1f9e2ee0d44b9d36de1ea0e6f875))
- New icon: pause-unfilled ([#416](https://github.com/RocketChat/fuselage/issues/416)) ([ba0eb1c](https://github.com/RocketChat/fuselage/commit/ba0eb1c39fb29d3b62e3e3312cd0916c8c7fac2d))
- New icons ([#407](https://github.com/RocketChat/fuselage/issues/407)) ([9e708b4](https://github.com/RocketChat/fuselage/commit/9e708b42a0a3003669e1c5e76dce84b8ef563e21))
- New tag style and stories ([#419](https://github.com/RocketChat/fuselage/issues/419)) ([04bdb39](https://github.com/RocketChat/fuselage/commit/04bdb39840beab20f80a45a49605c8a2f361f458))

# [0.22.0](https://github.com/RocketChat/fuselage/compare/v0.21.0...v0.22.0) (2021-02-26)

### Bug Fixes

- Remove development mode warnings ([#398](https://github.com/RocketChat/fuselage/issues/398)) ([80e77dc](https://github.com/RocketChat/fuselage/commit/80e77dcad1d7a26e11164301fccda93ca0c3af6d))
- Sidebar menu cropped in extended mode ([#400](https://github.com/RocketChat/fuselage/issues/400)) ([8e06c60](https://github.com/RocketChat/fuselage/commit/8e06c6024be032af64ae42d733f878a0fdca326e))
- withRichContent prop split to fit in different contexts ([#401](https://github.com/RocketChat/fuselage/issues/401)) ([22ca229](https://github.com/RocketChat/fuselage/commit/22ca22992caffc398e3bd0fbf1c7b873c141a6df))

### Features

- [@rocket](https://github.com/rocket).chat/memo ([#380](https://github.com/RocketChat/fuselage/issues/380)) ([2425c04](https://github.com/RocketChat/fuselage/commit/2425c045743ba1a4a5443a1d341e615363930ef6))
- Added new icons ([#391](https://github.com/RocketChat/fuselage/issues/391)) ([9436d1c](https://github.com/RocketChat/fuselage/commit/9436d1cc99f64ab0c90bccf77840295f9a744f7f))
- Basic TypeScript support ([#402](https://github.com/RocketChat/fuselage/issues/402)) ([79405d3](https://github.com/RocketChat/fuselage/commit/79405d3a25bfeed29293cb68d67a8c4f0467c490))

# [0.21.0](https://github.com/RocketChat/fuselage/compare/v0.20.3...v0.21.0) (2021-01-31)

### Bug Fixes

- AvatarProps declaration ([#361](https://github.com/RocketChat/fuselage/issues/361)) ([6324875](https://github.com/RocketChat/fuselage/commit/6324875c68e0b7b11536e3b766c27eb8e301fe52))
- Change option styles ([#358](https://github.com/RocketChat/fuselage/issues/358)) ([c479d70](https://github.com/RocketChat/fuselage/commit/c479d7041710e04fe8a9d8e766720ec206464e89))
- Pass appId and blockId from blocks to elements ([#366](https://github.com/RocketChat/fuselage/issues/366)) ([8a1b552](https://github.com/RocketChat/fuselage/commit/8a1b552f8dbc3a9b321d888f4a7e9dc9af2922cf))
- sidebar-item\_\_menu-wraper opacity on IE ([#381](https://github.com/RocketChat/fuselage/issues/381)) ([3038b15](https://github.com/RocketChat/fuselage/commit/3038b15002d6df3d184a2dac2a97f5a3d0aa50f4))
- Temporary fix for auto complete ([#364](https://github.com/RocketChat/fuselage/issues/364)) ([218a8b3](https://github.com/RocketChat/fuselage/commit/218a8b30c42c7a2321f2de3d0cc081131e890834))
- Update Fuselage typings ([#355](https://github.com/RocketChat/fuselage/issues/355)) ([85f9fa1](https://github.com/RocketChat/fuselage/commit/85f9fa13f818703bce1100ad706a66d703c0b0ba))

### Features

- Built modules for design tokens ([#356](https://github.com/RocketChat/fuselage/issues/356)) ([f9c3449](https://github.com/RocketChat/fuselage/commit/f9c344953b8161a4385cab3a3dcc8b6a7210446f))
- linear_scale element ([#365](https://github.com/RocketChat/fuselage/issues/365)) ([43a4c54](https://github.com/RocketChat/fuselage/commit/43a4c54ed10d096ef2259ddcd30c3bbd97ae866a))

## [0.20.3](https://github.com/RocketChat/fuselage/compare/v0.20.2...v0.20.3) (2021-01-29)

### Bug Fixes

- sidebar-item\_\_menu-wraper opacity on IE ([#381](https://github.com/RocketChat/fuselage/issues/381)) ([e818b5c](https://github.com/RocketChat/fuselage/commit/e818b5cd99b1749997d6f487517c29722c77a23a))

## [0.20.2](https://github.com/RocketChat/fuselage/compare/v0.20.1...v0.20.2) (2021-01-27)

**Note:** Version bump only for package @rocket.chat/fuselage

## [0.20.1](https://github.com/RocketChat/fuselage/compare/v0.20.0...v0.20.1) (2020-12-22)

### Bug Fixes

- Clip icon ([#354](https://github.com/RocketChat/fuselage/issues/354)) ([a688d7c](https://github.com/RocketChat/fuselage/commit/a688d7c6e5ab870c5172c0db81b62dd5b7c6d9fc))

# [0.20.0](https://github.com/RocketChat/fuselage/compare/v0.19.0...v0.20.0) (2020-12-21)

### Bug Fixes

- ActionButton not accepting children ([#345](https://github.com/RocketChat/fuselage/issues/345)) ([92c67d8](https://github.com/RocketChat/fuselage/commit/92c67d86ef975b18ad1ed48161b323072b465943))
- Badge and Tag Style ([#343](https://github.com/RocketChat/fuselage/issues/343)) ([bb534df](https://github.com/RocketChat/fuselage/commit/bb534df611d8e16bd1e4a6263865d7373d6953ef))
- Divider types ([#350](https://github.com/RocketChat/fuselage/issues/350)) ([911be2b](https://github.com/RocketChat/fuselage/commit/911be2b234594a3ee3e7993f2f66b8e7cf20dc45))
- Flex-shrink on fields ([#334](https://github.com/RocketChat/fuselage/issues/334)) ([28c621e](https://github.com/RocketChat/fuselage/commit/28c621ec039038b467ce1461e75219cdd4123d24))
- Removed animation by default, Sidebar padding, and Radio RTL ([#336](https://github.com/RocketChat/fuselage/issues/336)) ([63bcc18](https://github.com/RocketChat/fuselage/commit/63bcc183903436f2e2b41436a46d5eeb651f0572))
- Sidebar Header height ([#344](https://github.com/RocketChat/fuselage/issues/344)) ([273e8cf](https://github.com/RocketChat/fuselage/commit/273e8cf81bcc1eb4229a129083c04f4b335a7d22))

### Features

- Add maxHeight prop for Menu Options ([#352](https://github.com/RocketChat/fuselage/issues/352)) ([eb400be](https://github.com/RocketChat/fuselage/commit/eb400be69499a0be41ff29511ef392361d04d8b7))
- Fuselage typings ([#348](https://github.com/RocketChat/fuselage/issues/348)) ([24da5e7](https://github.com/RocketChat/fuselage/commit/24da5e75a62c8358cef61eb31ad335234be6fa8f))
- Update and expose logical properties plugin for Stylis ([#333](https://github.com/RocketChat/fuselage/issues/333)) ([3311ee9](https://github.com/RocketChat/fuselage/commit/3311ee9b3868267d19de14ddcbbe2dcf89739e1b))

### Performance Improvements

- Modal ([#349](https://github.com/RocketChat/fuselage/issues/349)) ([f77ae41](https://github.com/RocketChat/fuselage/commit/f77ae41fa42fee2a55779837b1c01cba912921fc))
- Remove Box from Option ([#347](https://github.com/RocketChat/fuselage/issues/347)) ([d0d0d82](https://github.com/RocketChat/fuselage/commit/d0d0d82aa22a7162ac509c57a869a451b5e67070))

# [0.19.0](https://github.com/RocketChat/fuselage/compare/v0.18.0...v0.19.0) (2020-11-28)

### Bug Fixes

- Avatar x40 ([#331](https://github.com/RocketChat/fuselage/issues/331)) ([a9cefbb](https://github.com/RocketChat/fuselage/commit/a9cefbb7d3580598a824b4d4e5f9c79aa7158219))
- Fix object-fit for image element in Avatar component ([#335](https://github.com/RocketChat/fuselage/issues/335)) ([a024b83](https://github.com/RocketChat/fuselage/commit/a024b831fad78e9c15d65f6985088c0514bed312))

### Features

- Remove Box from Avatar component ([#326](https://github.com/RocketChat/fuselage/issues/326)) ([0bc99a3](https://github.com/RocketChat/fuselage/commit/0bc99a325cbc963d9544e304a3f6f29e0089a976))

# [0.18.0](https://github.com/RocketChat/fuselage/compare/v0.17.3...v0.18.0) (2020-11-16)

### Bug Fixes

- Set a conservative output.environment on Webpack bundles ([#330](https://github.com/RocketChat/fuselage/issues/330)) ([62bf728](https://github.com/RocketChat/fuselage/commit/62bf728d3541d8d7ee72420347f2351359fb5df7))
- Undo bad merge conflict ([#329](https://github.com/RocketChat/fuselage/issues/329)) ([aa9eb3b](https://github.com/RocketChat/fuselage/commit/aa9eb3be3914d5bebc5fdca27c94af0d586eeb19))

### Features

- Menu burger ([#327](https://github.com/RocketChat/fuselage/issues/327)) ([f85c0b3](https://github.com/RocketChat/fuselage/commit/f85c0b3e5016ce08a278ffb2a8b987eeda31a767))
- Remove Box dependence from Tag and Badge components ([#315](https://github.com/RocketChat/fuselage/issues/315)) ([4218e51](https://github.com/RocketChat/fuselage/commit/4218e5108264ef830175b5e5f6bc1114d0367d93))

## [0.17.3](https://github.com/RocketChat/fuselage/compare/v0.17.2...v0.17.3) (2020-11-16)

### Bug Fixes

- Set a conservative output.environment on Webpack bundles ([#330](https://github.com/RocketChat/fuselage/issues/330)) ([85d4a3a](https://github.com/RocketChat/fuselage/commit/85d4a3a5fd6881b07e97fb690d31baef405cfa69))

## [0.17.2](https://github.com/RocketChat/fuselage/compare/v0.17.1...v0.17.2) (2020-10-28)

### Bug Fixes

- Sidebar menu transition ([#313](https://github.com/RocketChat/fuselage/issues/313)) ([726fe3d](https://github.com/RocketChat/fuselage/commit/726fe3d6aaad3453df6688ce8f501a09133d1b26))

## [0.17.1](https://github.com/RocketChat/fuselage/compare/v0.17.0...v0.17.1) (2020-10-26)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.17.0](https://github.com/RocketChat/fuselage/compare/v0.16.0...v0.17.0) (2020-10-25)

### Bug Fixes

- Button ghost background var ([#310](https://github.com/RocketChat/fuselage/issues/310)) ([872f325](https://github.com/RocketChat/fuselage/commit/872f32544167511b8ae5ca86b9b8097c072b7a58))
- change Icon size for action buttons ([#299](https://github.com/RocketChat/fuselage/issues/299)) ([2f47611](https://github.com/RocketChat/fuselage/commit/2f476113cfa86e68181c609cf92724cdeb04cba2))
- Disable :focus-visible for the time being ([#295](https://github.com/RocketChat/fuselage/issues/295)) ([6b115eb](https://github.com/RocketChat/fuselage/commit/6b115eb16b33fd38892188769c95aa213fbacdb9))
- Fuselage: word-break Tooltip ([#290](https://github.com/RocketChat/fuselage/issues/290)) ([1c1ae6e](https://github.com/RocketChat/fuselage/commit/1c1ae6e27da65688e7f69d43ceb19cbf55a65bcf))
- Menu transition ([#297](https://github.com/RocketChat/fuselage/issues/297)) ([074d7d7](https://github.com/RocketChat/fuselage/commit/074d7d705908bbd3f1915e3390745f1aea3e57c8))
- Sidebar - Missing subcomponents ([#292](https://github.com/RocketChat/fuselage/issues/292)) ([9ccb237](https://github.com/RocketChat/fuselage/commit/9ccb237a6e8759a036cdbabb01d52ac9650b5e9f))
- Sidebar item menu position ([#293](https://github.com/RocketChat/fuselage/issues/293)) ([0fead45](https://github.com/RocketChat/fuselage/commit/0fead455c72289d261b2ed065af1235318ac07a8))
- Sidebar item menu: paddings ([#294](https://github.com/RocketChat/fuselage/issues/294)) ([d8095e6](https://github.com/RocketChat/fuselage/commit/d8095e69df0131b7b84b2bb96c032bc199eac647))
- Sidebar Item wrapper ([#291](https://github.com/RocketChat/fuselage/issues/291)) ([9fa3bf0](https://github.com/RocketChat/fuselage/commit/9fa3bf032a2feaf28144b67b270c47b6d1c9b7ff))
- Sidebar menu positioning ([#296](https://github.com/RocketChat/fuselage/issues/296)) ([5aa2a74](https://github.com/RocketChat/fuselage/commit/5aa2a747cc3fae4ec06135bc14bbfad8312e13c4))
- Sidebar wrapper ([#302](https://github.com/RocketChat/fuselage/issues/302)) ([b0ca72e](https://github.com/RocketChat/fuselage/commit/b0ca72eb9753e959086c93e31084743b7c09fdda))
- Use dir attribute from documentElement ([#304](https://github.com/RocketChat/fuselage/issues/304)) ([f574b8c](https://github.com/RocketChat/fuselage/commit/f574b8c6b2ad09ad5fafa696ad539297bd782758))

### Features

- Add id attribute to style tag ([#307](https://github.com/RocketChat/fuselage/issues/307)) ([ca301a6](https://github.com/RocketChat/fuselage/commit/ca301a6b96f82df835a3513fd795c8394b1a97cb))
- Added login icon, added badge wrapper ([#303](https://github.com/RocketChat/fuselage/issues/303)) ([70ae09c](https://github.com/RocketChat/fuselage/commit/70ae09c0d5f53d492a1367ad7097da3323be386f))
- Focus-within polyfill ([#306](https://github.com/RocketChat/fuselage/issues/306)) ([42d4147](https://github.com/RocketChat/fuselage/commit/42d41478678d74c730df9bcb30ab76e6b27314f1))
- StatusBullet ([#301](https://github.com/RocketChat/fuselage/issues/301)) ([4b0c9ca](https://github.com/RocketChat/fuselage/commit/4b0c9ca67d578a780d63c323fd5aef498d4131d0))
- Tiny and Mini Button variations ([#298](https://github.com/RocketChat/fuselage/issues/298)) ([61aca91](https://github.com/RocketChat/fuselage/commit/61aca9145c55347f3bb563159ebff61415fb1db5))

# [0.16.0](https://github.com/RocketChat/fuselage/compare/v0.15.1...v0.16.0) (2020-09-30)

### Bug Fixes

- Sidebar ([#288](https://github.com/RocketChat/fuselage/issues/288)) ([175cb7b](https://github.com/RocketChat/fuselage/commit/175cb7b4011f130035c02d9e541b67c04dfe5c30))

### Features

- Progress Bar ([#287](https://github.com/RocketChat/fuselage/issues/287)) ([74b8636](https://github.com/RocketChat/fuselage/commit/74b8636d7793bdb3b650f1fe06e3956dbf8eb42b))
- Sass helper to box-shadow inset ([#289](https://github.com/RocketChat/fuselage/issues/289)) ([32e8f9f](https://github.com/RocketChat/fuselage/commit/32e8f9f337f2ec7fb25d2449635dca7f3af309ec))

## [0.15.1](https://github.com/RocketChat/fuselage/compare/v0.15.0...v0.15.1) (2020-09-22)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.15.0](https://github.com/RocketChat/fuselage/compare/v0.14.1...v0.15.0) (2020-09-17)

### Bug Fixes

- Divider variable color ([#285](https://github.com/RocketChat/fuselage/issues/285)) ([16e2f49](https://github.com/RocketChat/fuselage/commit/16e2f49d9adc26f1c1c2099ad417a5bcd37b1d5e))

### Features

- Sidebar Item ([#284](https://github.com/RocketChat/fuselage/issues/284)) ([44f8198](https://github.com/RocketChat/fuselage/commit/44f8198473f9d6385615aed59b855562dd3c784a))
- Success Button ([#283](https://github.com/RocketChat/fuselage/issues/283)) ([d35f7b3](https://github.com/RocketChat/fuselage/commit/d35f7b3e92890e8915a0379f2dbbd6b596512f5b))

## [0.14.1](https://github.com/RocketChat/fuselage/compare/v0.14.0...v0.14.1) (2020-08-22)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.14.0](https://github.com/RocketChat/fuselage/compare/v0.13.2...v0.14.0) (2020-08-18)

**Note:** Version bump only for package @rocket.chat/fuselage

## [0.13.2](https://github.com/RocketChat/fuselage/compare/v0.13.1...v0.13.2) (2020-07-24)

**Note:** Version bump only for package @rocket.chat/fuselage

## [0.13.1](https://github.com/RocketChat/fuselage/compare/v0.13.0...v0.13.1) (2020-07-17)

### Bug Fixes

- Loosen x-measures parsing ([#266](https://github.com/RocketChat/fuselage/issues/266)) ([b1c6ef4](https://github.com/RocketChat/fuselage/commit/b1c6ef42aa909f4063647f3051ee4b23497f6d57))
- Select mutations and ui-kit alerts ([#263](https://github.com/RocketChat/fuselage/issues/263)) ([661398d](https://github.com/RocketChat/fuselage/commit/661398dfdeaf827dadc46d24a7382d69f43f9742))

# [0.13.0](https://github.com/RocketChat/fuselage/compare/v0.12.0...v0.13.0) (2020-07-14)

### Features

- usePosition ([#259](https://github.com/RocketChat/fuselage/issues/259)) ([b395d8c](https://github.com/RocketChat/fuselage/commit/b395d8c2e619d2ba26c5cfbee77275d0fbf9526a))

# [0.12.0](https://github.com/RocketChat/fuselage/compare/v0.11.0...v0.12.0) (2020-07-14)

### Bug Fixes

- Options Styles ([#260](https://github.com/RocketChat/fuselage/issues/260)) ([410387e](https://github.com/RocketChat/fuselage/commit/410387eb6a049e68f6f6f7391a7e0919c0bdf2ec))

### Features

- Margins not only for Box ([#256](https://github.com/RocketChat/fuselage/issues/256)) ([94e71a8](https://github.com/RocketChat/fuselage/commit/94e71a80eb37d5145c1d1b2f532d23a782fee07b))

# [0.11.0](https://github.com/RocketChat/fuselage/compare/v0.10.0...v0.11.0) (2020-07-11)

### Bug Fixes

- Box className prop ([#254](https://github.com/RocketChat/fuselage/issues/254)) ([5adc7b8](https://github.com/RocketChat/fuselage/commit/5adc7b8a907eca67bef5e26309c92561f6d8020a))

# [0.10.0](https://github.com/RocketChat/fuselage/compare/v0.9.0...v0.10.0) (2020-06-20)

### Bug Fixes

- Export useModalStack hook ([#242](https://github.com/RocketChat/fuselage/issues/242)) ([f5d567e](https://github.com/RocketChat/fuselage/commit/f5d567e))
- Missing legacy icons ([#238](https://github.com/RocketChat/fuselage/issues/238)) ([1d74390](https://github.com/RocketChat/fuselage/commit/1d74390))
- ModalContainer crash ([034eb1a](https://github.com/RocketChat/fuselage/commit/034eb1a))

### Features

- Updated icons ([#188](https://github.com/RocketChat/fuselage/issues/188)) ([184e8ed](https://github.com/RocketChat/fuselage/commit/184e8ed))

### Performance Improvements

- Generated classNames from props ([#230](https://github.com/RocketChat/fuselage/issues/230)) ([8df14cb](https://github.com/RocketChat/fuselage/commit/8df14cb))
- Keyed children ([#231](https://github.com/RocketChat/fuselage/issues/231)) ([8b63483](https://github.com/RocketChat/fuselage/commit/8b63483))

# [0.9.0](https://github.com/RocketChat/fuselage/compare/v0.8.0...v0.9.0) (2020-05-21)

### Bug Fixes

- Added z-index backdrop and options to avatar and backdrop ([#210](https://github.com/RocketChat/fuselage/issues/210)) ([96f0d17](https://github.com/RocketChat/fuselage/commit/96f0d172f4ea1e84bc765a74b5db53d8f447ce7a))
- Avatar sizes ([#202](https://github.com/RocketChat/fuselage/issues/202)) ([7ff3fd9](https://github.com/RocketChat/fuselage/commit/7ff3fd91ce7f075e41c473b18077f63011ee2a30))
- Change the small button size ([#234](https://github.com/RocketChat/fuselage/issues/234)) ([6dc44de](https://github.com/RocketChat/fuselage/commit/6dc44def0de746bb4412f97cb72a676715e19742))
- className prop type in Box ([#220](https://github.com/RocketChat/fuselage/issues/220)) ([f9e1a1f](https://github.com/RocketChat/fuselage/commit/f9e1a1f413035b9af9bdebd8b4d3f3944440affa))
- CSS custom property name interpolation ([#216](https://github.com/RocketChat/fuselage/issues/216)) ([66453b6](https://github.com/RocketChat/fuselage/commit/66453b60c9ec46b80782456fdd695e82d87d7dec))
- Deprecation warnings ([#227](https://github.com/RocketChat/fuselage/issues/227)) ([46322a8](https://github.com/RocketChat/fuselage/commit/46322a8e2781b4293adc7fdf4fcffae20f0d170f))
- Position component ([#217](https://github.com/RocketChat/fuselage/issues/217)) ([81940ec](https://github.com/RocketChat/fuselage/commit/81940ecd6713eec2ffd41ac1aa592e345e694815))
- Table header divisor ([#233](https://github.com/RocketChat/fuselage/issues/233)) ([373534c](https://github.com/RocketChat/fuselage/commit/373534c1bdf9653bea9959029a7fc1e662d41693))

### Features

- elevation prop ([#219](https://github.com/RocketChat/fuselage/issues/219)) ([fb28ee3](https://github.com/RocketChat/fuselage/commit/fb28ee3466b4f3f837bbe5cf25a18e0ad80ce4c4))
- Kebab Menu w/ popover ([#211](https://github.com/RocketChat/fuselage/issues/211)) ([0e4a50d](https://github.com/RocketChat/fuselage/commit/0e4a50d2570dcf2a5fde09a70a5960832172aa77))
- New Box props ([#213](https://github.com/RocketChat/fuselage/issues/213)) ([b593875](https://github.com/RocketChat/fuselage/commit/b593875f3561e334412f9d7e2fbe81007ed8098e))

### Performance Improvements

- Replace `mem` with a simpler memoization decorator ([#229](https://github.com/RocketChat/fuselage/issues/229)) ([2de0703](https://github.com/RocketChat/fuselage/commit/2de07032b5175153f881408726fc9413804094b6))

### Reverts

- Revert "Fix flex content (#225)" (#226) ([fc246f2](https://github.com/RocketChat/fuselage/commit/fc246f2c684d52af82f09aeffe5d0b46e0b9910e)), closes [#225](https://github.com/RocketChat/fuselage/issues/225) [#226](https://github.com/RocketChat/fuselage/issues/226)

# [0.8.0](https://github.com/RocketChat/fuselage/compare/v0.7.1...v0.8.0) (2020-04-22)

### Bug Fixes

- Add missing Box prop types ([#204](https://github.com/RocketChat/fuselage/issues/204)) ([5ab9f6a](https://github.com/RocketChat/fuselage/commit/5ab9f6a001738ae6eedd9f593ff52ac58f23a4df))
- Badge and Tag rendering a span ([#208](https://github.com/RocketChat/fuselage/issues/208)) ([d8a5ed2](https://github.com/RocketChat/fuselage/commit/d8a5ed2a1afaa9e58bea307dab7d42b1593bab2b))
- Center Throbber circles ([#198](https://github.com/RocketChat/fuselage/issues/198)) ([be0aa60](https://github.com/RocketChat/fuselage/commit/be0aa603e209c96029d2232ad7d2b79c13ba628d))
- Selection button props split between container and input elements ([#207](https://github.com/RocketChat/fuselage/issues/207)) ([19cc1df](https://github.com/RocketChat/fuselage/commit/19cc1dfc9d58a539f6bb6b98e67c933378e07bfd))
- Update Callout to allow empty children ([#200](https://github.com/RocketChat/fuselage/issues/200)) ([58bdc4e](https://github.com/RocketChat/fuselage/commit/58bdc4ecdab445709b62e16917b922eeebb74d98))

### Features

- Refactor static styles ([#201](https://github.com/RocketChat/fuselage/issues/201)) ([e1bdc65](https://github.com/RocketChat/fuselage/commit/e1bdc655a0dfe0f88261d3fab84c2e42c2ad581e))

## [0.7.1](https://github.com/RocketChat/fuselage/compare/v0.7.0...v0.7.1) (2020-04-01)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.7.0](https://github.com/RocketChat/fuselage/compare/v0.6.2...v0.7.0) (2020-04-01)

### Bug Fixes

- Padding props ([#187](https://github.com/RocketChat/fuselage/issues/187)) ([ef1d4e3](https://github.com/RocketChat/fuselage/commit/ef1d4e3e65ffdc131f3c3ba52a196d42b2dd400f))

### Features

- Custom prop types and more props to Box ([#181](https://github.com/RocketChat/fuselage/issues/181)) ([119e815](https://github.com/RocketChat/fuselage/commit/119e815ac9a0b85c1649c53bab62390b25aae4b3))

## [0.6.2](https://github.com/RocketChat/fuselage/compare/v0.6.1...v0.6.2) (2020-03-31)

### Bug Fixes

- Table padding, hover status ([#185](https://github.com/RocketChat/fuselage/issues/185)) ([70138bc](https://github.com/RocketChat/fuselage/commit/70138bcc258a3112dc3264562cddb90d05b95859))

## [0.6.1](https://github.com/RocketChat/fuselage/compare/v0.6.0...v0.6.1) (2020-03-24)

### Bug Fixes

- outline input and Select text wrapping ([#177](https://github.com/RocketChat/fuselage/issues/177)) ([4168cf2](https://github.com/RocketChat/fuselage/commit/4168cf265cac67dbabd7defb9545a03485c26ac2))
- Select placeholder and story ([#179](https://github.com/RocketChat/fuselage/issues/179)) ([e05e926](https://github.com/RocketChat/fuselage/commit/e05e926c82e92f5abcf0a64fb1f7d52ac834e33a))

### Reverts

- Revert "chore: Refactor button, add missing variants. (#120)" (#178) ([e3d7d7d](https://github.com/RocketChat/fuselage/commit/e3d7d7d14212c852d5a587accc65e9402504f6fb)), closes [#120](https://github.com/RocketChat/fuselage/issues/120) [#178](https://github.com/RocketChat/fuselage/issues/178)

# [0.6.0](https://github.com/RocketChat/fuselage/compare/v0.5.0...v0.6.0) (2020-03-20)

### Bug Fixes

- Improve tag/badge style ([#173](https://github.com/RocketChat/fuselage/issues/173)) ([50a074b](https://github.com/RocketChat/fuselage/commit/50a074bc53bfdfa86e643b1d408d73ac7f32af0a))

### Features

- add stack avatar ([#174](https://github.com/RocketChat/fuselage/issues/174)) ([406554b](https://github.com/RocketChat/fuselage/commit/406554b7a31d96b60133126c649a6857c0471c08))

# [0.5.0](https://github.com/RocketChat/fuselage/compare/v0.4.1...v0.5.0) (2020-03-20)

### Bug Fixes

- Empty space before SelectFiltered placeholder ([#171](https://github.com/RocketChat/fuselage/issues/171)) ([26ab2b5](https://github.com/RocketChat/fuselage/commit/26ab2b5788482b5be3604a52a0dfe48e56cb9166))

### Features

- Focus visible ([#165](https://github.com/RocketChat/fuselage/issues/165)) ([0801f28](https://github.com/RocketChat/fuselage/commit/0801f280b159f9b2d500fc3de57eb422a8b13e5e))
- Tags and Badges ([#167](https://github.com/RocketChat/fuselage/issues/167)) ([b739cde](https://github.com/RocketChat/fuselage/commit/b739cdec895800fc478b86cd8ed0261453d3e490))
- Tooltip component ([#121](https://github.com/RocketChat/fuselage/issues/121)) ([374c279](https://github.com/RocketChat/fuselage/commit/374c2797c4b7d7fb6fe894780b98a88a971e7db7))

## [0.4.1](https://github.com/RocketChat/fuselage/compare/v0.4.0...v0.4.1) (2020-03-16)

### Bug Fixes

- Build [@rocket](https://github.com/rocket).chat/css-in-js as ES module ([#166](https://github.com/RocketChat/fuselage/issues/166)) ([910c85c](https://github.com/RocketChat/fuselage/commit/910c85c9ca7a65b8dc53e9d137cdc7b3f17e3410))
- filteredOptions for options ([#169](https://github.com/RocketChat/fuselage/issues/169)) ([8cb685f](https://github.com/RocketChat/fuselage/commit/8cb685ff477a6eeb00d7db1efda09c02eb1794f8))
- Select arrow position for empty selects ([#157](https://github.com/RocketChat/fuselage/issues/157)) ([4ef17e0](https://github.com/RocketChat/fuselage/commit/4ef17e0599aa4afc6219215321609fb837fb1f4b))

# [0.4.0](https://github.com/RocketChat/fuselage/compare/v0.3.0...v0.4.0) (2020-03-10)

### Bug Fixes

- Changed accordion item title proptype ([#151](https://github.com/RocketChat/fuselage/issues/151)) ([b80647c](https://github.com/RocketChat/fuselage/commit/b80647c9c3502fb2eed51204d4878b3acecf6f0c))
- Display name and prop types of Throbber component ([#148](https://github.com/RocketChat/fuselage/issues/148)) ([cd0122b](https://github.com/RocketChat/fuselage/commit/cd0122be08fa3d4ddf550f02a12153ede3678e14))

### Features

- Added callback prop for scroll position ([#155](https://github.com/RocketChat/fuselage/issues/155)) ([bb61e34](https://github.com/RocketChat/fuselage/commit/bb61e3465daafcc5295b80254e81a12e8df34847))

### Performance Improvements

- Avoid re-renders due to PropsContext ([#154](https://github.com/RocketChat/fuselage/issues/154)) ([da88341](https://github.com/RocketChat/fuselage/commit/da88341ffc26f3e828afe90e22c8d69a21bc2b1c))

# [0.3.0](https://github.com/RocketChat/fuselage/compare/v0.2.0...v0.3.0) (2020-02-17)

### Features

- Loading Component ([#147](https://github.com/RocketChat/fuselage/issues/147)) ([8d4e9df](https://github.com/RocketChat/fuselage/commit/8d4e9df810d725a80be3652ba4f851f896fc6f64))

# [0.2.0](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.30...v0.2.0) (2020-02-13)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.30](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.29...v0.2.0-alpha.30) (2020-02-12)

### Bug Fixes

- Safari not triggering buttons anchors ([#146](https://github.com/RocketChat/fuselage/issues/146)) ([2cb5aaa](https://github.com/RocketChat/fuselage/commit/2cb5aaaf4c71e277a0a8ea556a8b9efbb3e58620))

# [0.2.0-alpha.29](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.28...v0.2.0-alpha.29) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.28](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.27...v0.2.0-alpha.28) (2020-02-10)

### Bug Fixes

- placeholder transition ([#144](https://github.com/RocketChat/fuselage/issues/144)) ([4ce91d1](https://github.com/RocketChat/fuselage/commit/4ce91d179ece15d9014b93eb878b644e79850f56))

# [0.2.0-alpha.26](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.25...v0.2.0-alpha.26) (2020-02-10)

### Bug Fixes

- Select autofocus ([#141](https://github.com/RocketChat/fuselage/issues/141)) ([25849ee](https://github.com/RocketChat/fuselage/commit/25849eed55e4edbf26f54ae4a72c71c1d528e850))

# [0.2.0-alpha.25](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.24...v0.2.0-alpha.25) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.24](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.23...v0.2.0-alpha.24) (2020-02-09)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.23](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.22...v0.2.0-alpha.23) (2020-02-07)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.22](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.21...v0.2.0-alpha.22) (2020-02-07)

### Bug Fixes

- Select/MultiSelect focus submitting form ([#134](https://github.com/RocketChat/fuselage/issues/134)) ([630e622](https://github.com/RocketChat/fuselage/commit/630e622d8535fcaa06a8a736c6e0d273b450b739))
- UIKit stopPropagation ([#137](https://github.com/RocketChat/fuselage/issues/137)) ([86939ea](https://github.com/RocketChat/fuselage/commit/86939eaae182d6554879468745780d83bc977b9e))

# [0.2.0-alpha.21](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.20...v0.2.0-alpha.21) (2020-02-05)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.20](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.19...v0.2.0-alpha.20) (2020-02-01)

### Bug Fixes

- Modal background ([#126](https://github.com/RocketChat/fuselage/issues/126)) ([10b7202](https://github.com/RocketChat/fuselage/commit/10b72027cbb72d595d9aab8ffd37471eb7b8dac1))
- Modal's margins and AnimatedVisibility initial state ([#128](https://github.com/RocketChat/fuselage/issues/128)) ([4357f82](https://github.com/RocketChat/fuselage/commit/4357f82250cad21a72b9a3332c0a31f4874e302a))
- Remove visibilty on transition ([#129](https://github.com/RocketChat/fuselage/issues/129)) ([90c5301](https://github.com/RocketChat/fuselage/commit/90c5301a0067d00c73a249ca2c9d45206cb7ac05))

# [0.2.0-alpha.19](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.18...v0.2.0-alpha.19) (2020-01-13)

### Bug Fixes

- InputBox sizing ([#124](https://github.com/RocketChat/fuselage/issues/124)) ([eb82e74](https://github.com/RocketChat/fuselage/commit/eb82e74784bf67655e07be4443672ed2e5a38728))
- Position of inputs on selection buttons ([#123](https://github.com/RocketChat/fuselage/issues/123)) ([e446c89](https://github.com/RocketChat/fuselage/commit/e446c89d3a0c80e01266c373242d1197ba2950dc))

### Features

- Position, Modal, Options components ([#116](https://github.com/RocketChat/fuselage/issues/116)) ([af1916a](https://github.com/RocketChat/fuselage/commit/af1916a22c677939adda04fe417dafe406292762)), closes [#117](https://github.com/RocketChat/fuselage/issues/117)

# [0.2.0-alpha.18](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.17...v0.2.0-alpha.18) (2019-12-31)

### Bug Fixes

- Grid gutter ([#104](https://github.com/RocketChat/fuselage/issues/104)) ([8e7b5e4](https://github.com/RocketChat/fuselage/commit/8e7b5e41a0a6ac0be208e5c21b686cad5249ad19))
- Update Callout margins; allow Callout without title ([#106](https://github.com/RocketChat/fuselage/issues/106)) ([984a76f](https://github.com/RocketChat/fuselage/commit/984a76fda49bda82c363e9d945000a60f41f1046))

### Features

- Pagination component ([#103](https://github.com/RocketChat/fuselage/issues/103)) ([56fe9cf](https://github.com/RocketChat/fuselage/commit/56fe9cf0bf2e77ead4bff74a76e0b7b7fb9368f6))
- UI Kit ([#95](https://github.com/RocketChat/fuselage/issues/95)) ([6d4162b](https://github.com/RocketChat/fuselage/commit/6d4162bb8c121b1e89f8c818e7106bce49f09c27)), closes [#94](https://github.com/RocketChat/fuselage/issues/94) [#109](https://github.com/RocketChat/fuselage/issues/109) [#108](https://github.com/RocketChat/fuselage/issues/108) [#111](https://github.com/RocketChat/fuselage/issues/111)

# [0.2.0-alpha.17](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.16...v0.2.0-alpha.17) (2019-12-04)

### Bug Fixes

- Remove FieldGroup minimum width ([#93](https://github.com/RocketChat/fuselage/issues/93)) ([e116296](https://github.com/RocketChat/fuselage/commit/e116296f1f7e7ae6d4a7b761bdc2cac529d28854))

### Features

- Add prototype of Tabs component ([#101](https://github.com/RocketChat/fuselage/issues/101)) ([38ad447](https://github.com/RocketChat/fuselage/commit/38ad447fbf4e9207025d8756a95fce174b56868c))
- Cascading styles ([#97](https://github.com/RocketChat/fuselage/issues/97)) ([b21cd54](https://github.com/RocketChat/fuselage/commit/b21cd54478b6fca4190c25c3ab99beb77cdec67d))
- Flex components ([#99](https://github.com/RocketChat/fuselage/issues/99)) ([948d0ea](https://github.com/RocketChat/fuselage/commit/948d0ea801b59751fa06f2c2fb25c84d172b73c7))
- Grid ([#100](https://github.com/RocketChat/fuselage/issues/100)) ([baca6bf](https://github.com/RocketChat/fuselage/commit/baca6bf1c46742efc0171b1825918f4c907d036c))
- Level component ([#102](https://github.com/RocketChat/fuselage/issues/102)) ([2abd0d9](https://github.com/RocketChat/fuselage/commit/2abd0d9547528de3dd9e2f8c539966faf9a9da2d))
- Scrollable ([#98](https://github.com/RocketChat/fuselage/issues/98)) ([2eecec6](https://github.com/RocketChat/fuselage/commit/2eecec6c53c198fd16ff1fa089aa98974ecb2816))

# [0.2.0-alpha.16](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.15...v0.2.0-alpha.16) (2019-11-12)

### Bug Fixes

- Miscellaneous issues ([#90](https://github.com/RocketChat/fuselage/issues/90)) ([8e6e89a](https://github.com/RocketChat/fuselage/commit/8e6e89a43bdacf3626bf85599aecb370d615420d))

# [0.2.0-alpha.15](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.14...v0.2.0-alpha.15) (2019-11-05)

### Bug Fixes

- Performance issues in development environment ([#89](https://github.com/RocketChat/fuselage/issues/89)) ([a95931d](https://github.com/RocketChat/fuselage/commit/a95931d91832e242a178936fdb6593cb5d317837))

# [0.2.0-alpha.14](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.13...v0.2.0-alpha.14) (2019-10-28)

### Features

- Tile component ([#85](https://github.com/RocketChat/fuselage/issues/85)) ([a22d21f](https://github.com/RocketChat/fuselage/commit/a22d21fbf79feecb8cb2440cd8e32523a5109d8b))

# [0.2.0-alpha.13](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.12...v0.2.0-alpha.13) (2019-10-25)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.12](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.11...v0.2.0-alpha.12) (2019-10-24)

### Bug Fixes

- Accordion.Item accessibility issues ([#78](https://github.com/RocketChat/fuselage/issues/78)) ([2a283c1](https://github.com/RocketChat/fuselage/commit/2a283c1cef4d6f9738c96b473236d0b52dca1f5e))

# [0.2.0-alpha.11](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.10...v0.2.0-alpha.11) (2019-10-22)

### Features

- Accordion.Item pointer interactions and new variants ([#77](https://github.com/RocketChat/fuselage/issues/77)) ([884d10a](https://github.com/RocketChat/fuselage/commit/884d10a071e51e954208671ef3ebc5b11700f36c))

# [0.2.0-alpha.10](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.9...v0.2.0-alpha.10) (2019-10-18)

### Bug Fixes

- InputControl width ([#75](https://github.com/RocketChat/fuselage/issues/75)) ([d0b4e58](https://github.com/RocketChat/fuselage/commit/d0b4e584a6033988930a82e363e1467e86ae8dc6))

# [0.2.0-alpha.9](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.8...v0.2.0-alpha.9) (2019-10-17)

### Bug Fixes

- Bundle errors ([#72](https://github.com/RocketChat/fuselage/issues/72)) ([77f5c12](https://github.com/RocketChat/fuselage/commit/77f5c12e1be3d0e191e0a2cb87a286630064ce46))
- Explicit publish config ([#70](https://github.com/RocketChat/fuselage/issues/70)) ([21f9389](https://github.com/RocketChat/fuselage/commit/21f938991a58544c349e79b4e35284a4e51eb61b))

### Features

- Accordion component ([#68](https://github.com/RocketChat/fuselage/issues/68)) ([4409518](https://github.com/RocketChat/fuselage/commit/440951854c3760e0dfdf53b5ff1da4a511d55cf4))
- Callout component ([#69](https://github.com/RocketChat/fuselage/issues/69)) ([2bdece1](https://github.com/RocketChat/fuselage/commit/2bdece17739397a2ffcb13cd74e70934fb0286be))

# [0.2.0-alpha.8](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.7...v0.2.0-alpha.8) (2019-10-16)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.7](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.6...v0.2.0-alpha.7) (2019-10-14)

### Features

- [@rocket](https://github.com/rocket).chat/fuselage-hooks package ([#65](https://github.com/RocketChat/fuselage/issues/65)) ([7244533](https://github.com/RocketChat/fuselage/commit/724453329d0e42a40cef6793f81fa11b19ddf0fd))
- Form components ([#66](https://github.com/RocketChat/fuselage/issues/66)) ([39e086a](https://github.com/RocketChat/fuselage/commit/39e086ae398556dc445a9f5ebf52b31acddc44cf))

# [0.2.0-alpha.6](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.5...v0.2.0-alpha.6) (2019-10-09)

**Note:** Version bump only for package @rocket.chat/fuselage

# [0.2.0-alpha.5](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.4...v0.2.0-alpha.5) (2019-10-02)

### Bug Fixes

- Allow word wrap in Label ([#61](https://github.com/RocketChat/fuselage/issues/61)) ([7c2f269](https://github.com/RocketChat/fuselage/commit/7c2f269))

### Features

- New hooks ([#62](https://github.com/RocketChat/fuselage/issues/62)) ([2587ecf](https://github.com/RocketChat/fuselage/commit/2587ecf))

# [0.2.0-alpha.4](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.3...v0.2.0-alpha.4) (2019-09-27)

### Bug Fixes

- Multiple issues ([#60](https://github.com/RocketChat/fuselage/issues/60)) ([62e5620](https://github.com/RocketChat/fuselage/commit/62e5620))

# [0.2.0-alpha.3](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.1...v0.2.0-alpha.3) (2019-09-25)

### Bug Fixes

- Theming and typography ([#56](https://github.com/RocketChat/fuselage/issues/56)) ([7efc77e](https://github.com/RocketChat/fuselage/commit/7efc77e))

### Features

- Design tokens ([#55](https://github.com/RocketChat/fuselage/issues/55)) ([bb323c0](https://github.com/RocketChat/fuselage/commit/bb323c0))

# [0.2.0-alpha.2](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.0...v0.2.0-alpha.2) (2019-08-19)

### Bug Fixes

- Don't embed the icon font ([#47](https://github.com/RocketChat/fuselage/issues/47)) ([e75bd25](https://github.com/RocketChat/fuselage/commit/e75bd25))

### Features

- Add InputGroup component ([#48](https://github.com/RocketChat/fuselage/issues/48)) ([0830c8f](https://github.com/RocketChat/fuselage/commit/0830c8f))

# [0.2.0-alpha.1](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.0...v0.2.0-alpha.1) (2019-08-16)

### Bug Fixes

- Don't embed the icon font ([#47](https://github.com/RocketChat/fuselage/issues/47)) ([e75bd25](https://github.com/RocketChat/fuselage/commit/e75bd25))

### Features

- Add InputGroup component ([#48](https://github.com/RocketChat/fuselage/issues/48)) ([0830c8f](https://github.com/RocketChat/fuselage/commit/0830c8f))

# [0.2.0-alpha.0](https://github.com/RocketChat/fuselage/compare/v0.1.1-alpha.1...v0.2.0-alpha.0) (2019-08-16)

### Features

- Add Input component ([#44](https://github.com/RocketChat/fuselage/issues/44)) ([e4a71d4](https://github.com/RocketChat/fuselage/commit/e4a71d4))

## [0.1.1-alpha.1](https://github.com/RocketChat/fuselage/compare/v0.1.1-alpha.0...v0.1.1-alpha.1) (2019-08-15)

### Bug Fixes

- Add missing ref support ([#43](https://github.com/RocketChat/fuselage/issues/43)) ([b62cbfc](https://github.com/RocketChat/fuselage/commit/b62cbfc))
