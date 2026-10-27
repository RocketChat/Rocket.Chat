# @rocket.chat/fuselage-toastbar

## 1.0.0-rc.0

### Patch Changes

- ([#42418](https://github.com/RocketChat/Rocket.Chat/pull/42418)) Moved `@rocket.chat/fuselage-toastbar` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.36.1 release. The exported components keep the same API.

- ([#42418](https://github.com/RocketChat/Rocket.Chat/pull/42418)) Fixed `ToastBarPortal` touching the DOM during render. It created and appended its anchor element while rendering, which threw during server-side rendering and left an empty `#toastBarRoot` behind whenever a render was discarded without committing. The anchor is now created after mount.

- ([#42418](https://github.com/RocketChat/Rocket.Chat/pull/42418)) The CommonJS build no longer ships a duplicate copy of the type declarations, leaving `dist/esm` as the single source of types, where `types` already pointed. The package also no longer publishes `testing.js`, an internal test helper that re-exported a devDependency.

- ([#42418](https://github.com/RocketChat/Rocket.Chat/pull/42418)) Fixed `ToastBarProvider` re-rendering every `useToastBarDispatch` and `useToastBarDismiss` consumer whenever a toast was shown or dismissed. The context value now stays the same for the provider's lifetime.

- <details><summary>Updated dependencies [80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 2d3331be63dde3449245963c33444dcb15fa8869, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, cd88334c72f7f2310706abc4d481a2712019e373]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/styled@0.34.2-rc.0

  </details>

## 0.36.1

### Patch Changes

- [#2060](https://github.com/RocketChat/fuselage/pull/2060) [`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove deprecations and keep documentation comments

## 0.36.0

### Minor Changes

- [#1999](https://github.com/RocketChat/fuselage/pull/1999) [`6e37f9d`](https://github.com/RocketChat/fuselage/commit/6e37f9d2fee4c9ebeb8ea2c1601bbd4c89905859) Thanks [@tassoevan](https://github.com/tassoevan)! - feat!: Upgrade to React 19

## 0.35.2

### Patch Changes

- [#1849](https://github.com/RocketChat/fuselage/pull/1849) [`99b319c`](https://github.com/RocketChat/fuselage/commit/99b319c6c2ef1015d1d1edb027068c23dc1e29d9) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(storybook-dark-mode): Fork `storybook-dark-mode`

## 0.35.1

### Patch Changes

- [#1762](https://github.com/RocketChat/fuselage/pull/1762) [`cce8e7f`](https://github.com/RocketChat/fuselage/commit/cce8e7f7ae5bb261e95936c586ac831366579b7d) Thanks [@tassoevan](https://github.com/tassoevan)! - Deletes the `@rocket.chat/fuselage-polyfills` package

## 0.35.0

### Minor Changes

- [#1591](https://github.com/RocketChat/fuselage/pull/1591) [`13755ae`](https://github.com/RocketChat/fuselage/commit/13755aef092f68a392809999a03c54bd0ec66749) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(toastbar): new Toastbar variants

## 0.34.0

### Minor Changes

- [#1514](https://github.com/RocketChat/fuselage/pull/1514) [`c4d8300`](https://github.com/RocketChat/fuselage/commit/c4d8300a651a25b92450b8830c5028b4fcf8f4a1) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Raise minimum supported React version to 18

## 0.33.1

### Patch Changes

- [#1531](https://github.com/RocketChat/fuselage/pull/1531) [`c7478d2`](https://github.com/RocketChat/fuselage/commit/c7478d2e6aa6a9b020203af94eb6ae6335fdaaf0) Thanks [@tassoevan](https://github.com/tassoevan)! - Enable compatibility with React 18

  React 18's Strict Mode fires effects twice, which breaks Fuselage's toast bar portal.

## 0.33.0

### Minor Changes

- [#1406](https://github.com/RocketChat/fuselage/pull/1406) [`781f4aa0`](https://github.com/RocketChat/fuselage/commit/781f4aa07aa5be3dbd6658220d6cd4150acaffa8) Thanks [@debdutdeb](https://github.com/debdutdeb)! - feat(fuselage-toastbar): Pause ToastBar timer while hovering

## 0.32.0

### Minor Changes

- [#1389](https://github.com/RocketChat/fuselage/pull/1389) [`8c80efc47`](https://github.com/RocketChat/fuselage/commit/8c80efc47f3779869875336da88b3185c06a508b) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage-toastbar): Add RTL support

## 0.31.26

### Patch Changes

- [#1323](https://github.com/RocketChat/fuselage/pull/1323) [`9ccc4e79f`](https://github.com/RocketChat/fuselage/commit/9ccc4e79f76c1ef2b182065883bd66a91860bc96) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(icons): New circle-unfilled
