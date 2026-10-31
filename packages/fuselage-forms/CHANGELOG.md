# @rocket.chat/fuselage-forms

## 2.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies [5f3c7c2426a29a0f8237a1ec0d72192b2ef1f0a4]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.1

  </details>

## 2.0.0-rc.0

### Patch Changes

- ([#42650](https://github.com/RocketChat/Rocket.Chat/pull/42650)) Fixed wrapped inputs (`CheckBox`, `RadioButton`, `ToggleSwitch`) staying subscribed to their field's label clicks after being unmounted or replaced. Clicking the label no longer focuses and clicks detached inputs.

- ([#42650](https://github.com/RocketChat/Rocket.Chat/pull/42650)) Fixed inputs getting an `id` made of two space-separated ids when their field registers a `placeholder` descriptor. The `id` now always matches the label's `htmlFor`, and the placeholder only joins `aria-labelledby`.

- ([#42650](https://github.com/RocketChat/Rocket.Chat/pull/42650)) Fixed `HiddenLabel`, `LabelFor` and `ReferencedLabel` ignoring the `ref` passed by the caller. The ref now receives the rendered label element.

- ([#42650](https://github.com/RocketChat/Rocket.Chat/pull/42650)) Fixed `CheckBox`, `RadioButton` and `ToggleSwitch` keeping their first label as their accessible name when the `FieldLabel` text changed later.

- ([#42650](https://github.com/RocketChat/Rocket.Chat/pull/42650)) Moved `@rocket.chat/fuselage-forms` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 1.5.1 release. The exported components keep the same API.

- ([#42650](https://github.com/RocketChat/Rocket.Chat/pull/42650)) Fixed inputs rendered outside a `Field` discarding the accessibility props they were given. Their `id` and `aria-labelledby` pointed to a label that doesn't exist, which left them without an accessible name; `aria-describedby` was emptied; and `aria-invalid` was always `false`, hiding errors the caller had flagged. Outside a `Field`, the inputs now keep the props they were given.

- <details><summary>Updated dependencies [80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, dd082311778ac467d36a72589bc675f1ab2b2cbe, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 2d3331be63dde3449245963c33444dcb15fa8869, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/emitter@0.33.1-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0

  </details>

## 1.5.1

### Patch Changes

- [#2135](https://github.com/RocketChat/fuselage/pull/2135) [`70fd444`](https://github.com/RocketChat/fuselage/commit/70fd444a925a072c8229de79bb9b68e099b64a28) Thanks [@tassoevan](https://github.com/tassoevan)! - chore(fuselage-forms): Deprecate `AutoComplete` in favor of `MultiSelectFiltered`

## 1.5.0

### Minor Changes

- [#2060](https://github.com/RocketChat/fuselage/pull/2060) [`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove deprecations and keep documentation comments

### Patch Changes

- [#2069](https://github.com/RocketChat/fuselage/pull/2069) [`4e9188c`](https://github.com/RocketChat/fuselage/commit/4e9188c294806d38bd5755e37238ac9c0e470aee) Thanks [@tassoevan](https://github.com/tassoevan)! - fix: Pass filtered select anchor props via context

- Updated dependencies [[`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023), [`46e9cc3`](https://github.com/RocketChat/fuselage/commit/46e9cc36b03bcdd8668f6146dd6e326857416a39)]:
  - @rocket.chat/emitter@0.33.0

## 1.4.0

### Minor Changes

- [#1999](https://github.com/RocketChat/fuselage/pull/1999) [`6e37f9d`](https://github.com/RocketChat/fuselage/commit/6e37f9d2fee4c9ebeb8ea2c1601bbd4c89905859) Thanks [@tassoevan](https://github.com/tassoevan)! - feat!: Upgrade to React 19

## 1.3.0

### Minor Changes

- [#1956](https://github.com/RocketChat/fuselage/pull/1956) [`3a7c41d`](https://github.com/RocketChat/fuselage/commit/3a7c41d4d23b88a7867bd260f2fe5832085716f5) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage-forms): add `AutoComplete` component

## 1.2.0

### Minor Changes

- [#1942](https://github.com/RocketChat/fuselage/pull/1942) [`ef9dedd`](https://github.com/RocketChat/fuselage/commit/ef9dedd02084073731bd9cc008e1268e23b4b9a0) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage-forms): Add `MultiSelectFiltered` component

## 1.1.1

### Patch Changes

- [#1922](https://github.com/RocketChat/fuselage/pull/1922) [`5e50887`](https://github.com/RocketChat/fuselage/commit/5e5088707fd0c1bdfcfd320797422069e87d36cb) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage-forms): withLabelHelpers missing forwardRef

- [#1921](https://github.com/RocketChat/fuselage/pull/1921) [`e0ac8d5`](https://github.com/RocketChat/fuselage/commit/e0ac8d59512ae46ff7d089824a777cdab760c92f) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(fuselage-forms): missing `role alert` on `FieldError`

## 1.1.0

### Minor Changes

- [#1900](https://github.com/RocketChat/fuselage/pull/1900) [`1b23670`](https://github.com/RocketChat/fuselage/commit/1b23670e2f0d7aa454d9b2d0d18f59994281e858) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage-forms): add `Slider` component

- [#1901](https://github.com/RocketChat/fuselage/pull/1901) [`e5c02b9`](https://github.com/RocketChat/fuselage/commit/e5c02b9a29aa5ccad16fd62d4748042145368519) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(fuselage-forms): add `MultiSelect` component
  feat(fuselage): improve `MultiSelect` a11y

## 1.0.0

### Patch Changes

- [#1849](https://github.com/RocketChat/fuselage/pull/1849) [`99b319c`](https://github.com/RocketChat/fuselage/commit/99b319c6c2ef1015d1d1edb027068c23dc1e29d9) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(storybook-dark-mode): Fork `storybook-dark-mode`

- Updated dependencies [[`1179d3f`](https://github.com/RocketChat/fuselage/commit/1179d3f3fb954f00741fd99ddd979b00f39c937e)]:
  - @rocket.chat/fuselage-hooks@0.39.0
  - @rocket.chat/emitter@0.32.0

## 0.1.1

### Patch Changes

- [#1740](https://github.com/RocketChat/fuselage/pull/1740) [`fd4847a`](https://github.com/RocketChat/fuselage/commit/fd4847a9a62b33a4c73d5b234c515ec92d9b6c27) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix(fuselage-forms): Clicking on label does not focus on input

- [#1762](https://github.com/RocketChat/fuselage/pull/1762) [`cce8e7f`](https://github.com/RocketChat/fuselage/commit/cce8e7f7ae5bb261e95936c586ac831366579b7d) Thanks [@tassoevan](https://github.com/tassoevan)! - Deletes the `@rocket.chat/fuselage-polyfills` package

- Updated dependencies [[`fd4847a`](https://github.com/RocketChat/fuselage/commit/fd4847a9a62b33a4c73d5b234c515ec92d9b6c27), [`a1bcbe8`](https://github.com/RocketChat/fuselage/commit/a1bcbe87cec75e4ad3561571e837e3bb0da28886)]:
  - @rocket.chat/fuselage-hooks@0.38.1

## 0.1.0

### Minor Changes

- [#1670](https://github.com/RocketChat/fuselage/pull/1670) [`bbc28d1`](https://github.com/RocketChat/fuselage/commit/bbc28d1fe1fea3f36acd7bcf8467ca01c7ccdcd4) Thanks [@gabriellsh](https://github.com/gabriellsh)! - feat(fuselage-forms): Create Package - Form utility wrappers for a11y compliance
