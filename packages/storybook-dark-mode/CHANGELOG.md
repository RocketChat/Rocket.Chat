# @rocket.chat/storybook-dark-mode

## 4.3.0-rc.0

### Minor Changes

- ([#41810](https://github.com/RocketChat/Rocket.Chat/pull/41810)) Declares `storybook` as a peer dependency, at `^9.0.0`. The addon has always imported from `storybook/preview-api`, `storybook/manager-api`, `storybook/theming` and several `storybook/internal/*` paths, but never said so, which left the requirement implicit and the internal APIs it relies on without a version contract.

  Also stops shipping `.d.ts` and `.d.ts.map` files inside `dist/esm` and `dist/cjs`. Declarations were being emitted three times over and only the `dist/ts` copy is referenced by `types`, so the other two were dead weight in the tarball. Anything deep-importing types from `dist/esm` or `dist/cjs` — as opposed to resolving them through the package entry point — needs to use `dist/ts` instead.

## 4.2.1

### Patch Changes

- [#2060](https://github.com/RocketChat/fuselage/pull/2060) [`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove deprecations and keep documentation comments

## 4.2.0

### Minor Changes

- [#1999](https://github.com/RocketChat/fuselage/pull/1999) [`6e37f9d`](https://github.com/RocketChat/fuselage/commit/6e37f9d2fee4c9ebeb8ea2c1601bbd4c89905859) Thanks [@tassoevan](https://github.com/tassoevan)! - feat!: Upgrade to React 19

## 4.1.0

### Minor Changes

- [#1849](https://github.com/RocketChat/fuselage/pull/1849) [`99b319c`](https://github.com/RocketChat/fuselage/commit/99b319c6c2ef1015d1d1edb027068c23dc1e29d9) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(storybook-dark-mode): Fork `storybook-dark-mode`
