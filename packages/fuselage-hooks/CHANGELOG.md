# Change Log

## 0.43.1

### Patch Changes

- [#2148](https://github.com/RocketChat/fuselage/pull/2148) [`0d8e038`](https://github.com/RocketChat/fuselage/commit/0d8e038801972ec29ad2fb1d26da088af05b7b23) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage-tokens)!: Rework the token build and its output formats

## 0.43.0

### Minor Changes

- [#2060](https://github.com/RocketChat/fuselage/pull/2060) [`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove deprecations and keep documentation comments

- [#2072](https://github.com/RocketChat/fuselage/pull/2072) [`46e9cc3`](https://github.com/RocketChat/fuselage/commit/46e9cc36b03bcdd8668f6146dd6e326857416a39) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove unused UMD builds from all packages

## 0.42.0

### Minor Changes

- [#1999](https://github.com/RocketChat/fuselage/pull/1999) [`6e37f9d`](https://github.com/RocketChat/fuselage/commit/6e37f9d2fee4c9ebeb8ea2c1601bbd4c89905859) Thanks [@tassoevan](https://github.com/tassoevan)! - feat!: Upgrade to React 19

## 0.41.0

### Minor Changes

- [#1897](https://github.com/RocketChat/fuselage/pull/1897) [`b164747`](https://github.com/RocketChat/fuselage/commit/b1647471957d25eadbe7578f11e03526e49fd9b9) Thanks [@gabriellsh](https://github.com/gabriellsh)! - chore(fuselage-hooks): Remove deprecated `useUniqueId`

## 0.40.0

### Minor Changes

- [#1868](https://github.com/RocketChat/fuselage/pull/1868) [`84d8d59`](https://github.com/RocketChat/fuselage/commit/84d8d59e3e16b5fc23a3321795e2061f09ca43ac) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage-hooks): Deprecate `useEffectEvent` in favor of `useStableCallback`

  The `useEffectEvent` hook has been renamed to `useStableCallback` to better reflect its purpose and behavior. The new
  name emphasizes that the hook provides a stable callback function that maintains a consistent identity across renders
  while always having access to the latest values of props and state. It differs from `useEffectEvent` from React 19,
  which returns functions that can only be called from inside effects and other effect events.

## 0.39.0

### Minor Changes

- [#1717](https://github.com/RocketChat/fuselage/pull/1717) [`1179d3f`](https://github.com/RocketChat/fuselage/commit/1179d3f3fb954f00741fd99ddd979b00f39c937e) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: ES2024 standard requirement

## 0.38.1

### Patch Changes

- [#1740](https://github.com/RocketChat/fuselage/pull/1740) [`fd4847a`](https://github.com/RocketChat/fuselage/commit/fd4847a9a62b33a4c73d5b234c515ec92d9b6c27) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix(fuselage-forms): Clicking on label does not focus on input

- [#1757](https://github.com/RocketChat/fuselage/pull/1757) [`a1bcbe8`](https://github.com/RocketChat/fuselage/commit/a1bcbe87cec75e4ad3561571e837e3bb0da28886) Thanks [@tassoevan](https://github.com/tassoevan)! - Preserves the generic type of `useLocalStorage` and `useSessionStorage`'

## 0.38.0

### Minor Changes

- [#1751](https://github.com/RocketChat/fuselage/pull/1751) [`b02bbea`](https://github.com/RocketChat/fuselage/commit/b02bbea768e265fdfe7a9340536f016543ad7bed) Thanks [@tassoevan](https://github.com/tassoevan)! - Exposes the `useStorage` hook as an alternative for the specialized ones (`useLocalStorage` and `useSessionStorage`).

## 0.37.2

### Patch Changes

- [#1741](https://github.com/RocketChat/fuselage/pull/1741) [`5bbd461`](https://github.com/RocketChat/fuselage/commit/5bbd461c1bbe321c780fbfd1588625b65aacd45f) Thanks [@gabriellsh](https://github.com/gabriellsh)! - refactor(fuselage-hooks): `useSafeRefCallback` reimplemented callback/cleanup order

## 0.37.1

### Patch Changes

- [#1730](https://github.com/RocketChat/fuselage/pull/1730) [`09044af`](https://github.com/RocketChat/fuselage/commit/09044af47be69f80595ea3d355b5c3682c27031e) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix(fuselage-hooks): Missing useSafeRefCallback at index

## 0.37.0

### Minor Changes

- [#1683](https://github.com/RocketChat/fuselage/pull/1683) [`b9d4f2c`](https://github.com/RocketChat/fuselage/commit/b9d4f2c1b578293c3c28e4ff6a905af60abfe9ab) Thanks [@gabriellsh](https://github.com/gabriellsh)! - feat(fuselage-hooks): Implement `useSafeRefCallback`

## 0.36.0

### Minor Changes

- [#1671](https://github.com/RocketChat/fuselage/pull/1671) [`2a877ef`](https://github.com/RocketChat/fuselage/commit/2a877eff8996f7443df62d63039639212708cd1d) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Introduce useButtonPattern

## 0.35.0

### Minor Changes

- [#1514](https://github.com/RocketChat/fuselage/pull/1514) [`c4d8300`](https://github.com/RocketChat/fuselage/commit/c4d8300a651a25b92450b8830c5028b4fcf8f4a1) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Raise minimum supported React version to 18

## 0.34.1

### Patch Changes

- [#1521](https://github.com/RocketChat/fuselage/pull/1521) [`1dc6c86`](https://github.com/RocketChat/fuselage/commit/1dc6c86df827a44a8c0ac4cc7f239b2507ecd33d) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(fuselage-hooks): Stricter generics for `useEffectEvent`

## 0.34.0

### Minor Changes

- [#1483](https://github.com/RocketChat/fuselage/pull/1483) [`4910d29`](https://github.com/RocketChat/fuselage/commit/4910d294defc1effc0b857f44138498a73013877) Thanks [@tassoevan](https://github.com/tassoevan)! - Enables hooks' compatibility with React 18

## 0.33.1

### Patch Changes

- [#1334](https://github.com/RocketChat/fuselage/pull/1334) [`35155404b`](https://github.com/RocketChat/fuselage/commit/35155404baeb1e44aa1e4d767f431204d3ab2b53) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage-hooks): increase usePosition zIndex

## 0.33.0

### Minor Changes

- [#1244](https://github.com/RocketChat/fuselage/pull/1244) [`9be609744`](https://github.com/RocketChat/fuselage/commit/9be609744856f49b8971fb7aa45316ec7fd2463f) Thanks [@tassoevan](https://github.com/tassoevan)! - Deprecate `useMutableCallback` in favor of `useEffectEvent`

## 0.32.1

### Patch Changes

- [`a97c7f086`](https://github.com/RocketChat/fuselage/commit/a97c7f08633e6e36a39c8933b530f9acacb83af0) Thanks [@dougfabris](https://github.com/dougfabris)! - chore: resolve-workspace-deps to publish pkg versions

## 0.32.0

### Minor Changes

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - feat: create useElementIsVisible

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(fuselage-hooks): usePosition fallback positioning

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.31.0](https://github.com/RocketChat/fuselage/compare/v0.30.1...v0.31.0) (2021-12-28)

### Bug Fixes

- **fuselage-hooks:** usePosition fallback ([#588](https://github.com/RocketChat/fuselage/issues/588)) ([4662cf0](https://github.com/RocketChat/fuselage/commit/4662cf07c812aa23afb19a60bf4cabc651ffdd9d))

### Features

- **fuselage:** Component Dropdown ([#594](https://github.com/RocketChat/fuselage/issues/594)) ([31314b3](https://github.com/RocketChat/fuselage/commit/31314b3a7d29446a23307495e919de9aa3a4e8d0))
- New hooks for element size tracking ([#413](https://github.com/RocketChat/fuselage/issues/413)) ([8ca682c](https://github.com/RocketChat/fuselage/commit/8ca682c636d2e4813f7d346cb881513382be63cf))

# [0.30.0](https://github.com/RocketChat/fuselage/compare/v0.29.0...v0.30.0) (2021-10-06)

### Bug Fixes

- **fuselage-hooks:** useResizeObserver Ref type ([#531](https://github.com/RocketChat/fuselage/issues/531)) ([5255317](https://github.com/RocketChat/fuselage/commit/5255317c4190100d3179c6836a438bba1cce315b))
- **jest:** Adjust jest and ts-jest dependencies ([#547](https://github.com/RocketChat/fuselage/issues/547)) ([91a4fa1](https://github.com/RocketChat/fuselage/commit/91a4fa1365394001afe1bd46480bda3bafed5505))

# [0.29.0](https://github.com/RocketChat/fuselage/compare/v0.28.0...v0.29.0) (2021-08-31)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.28.0](https://github.com/RocketChat/fuselage/compare/v0.27.0...v0.28.0) (2021-07-30)

### Features

- **onboarding-ui:** Administrator information form and Organization information form ([#489](https://github.com/RocketChat/fuselage/issues/489)) ([b289f68](https://github.com/RocketChat/fuselage/commit/b289f68676954b91c792d8d97680314178bf2c60))
- **onboarding-ui:** Common components ([#478](https://github.com/RocketChat/fuselage/issues/478)) ([d7511ab](https://github.com/RocketChat/fuselage/commit/d7511ab435bae8c35e02071832c9a615078a83d5))
- styled API; monorepo grooming ([#482](https://github.com/RocketChat/fuselage/issues/482)) ([1b6b70c](https://github.com/RocketChat/fuselage/commit/1b6b70cf67ec16927b1566adc2350295a8927223))

# [0.27.0](https://github.com/RocketChat/fuselage/compare/v0.26.0...v0.27.0) (2021-06-28)

### Features

- Visibility toggle for PasswordInput ([#377](https://github.com/RocketChat/fuselage/issues/377)) ([5ef1bec](https://github.com/RocketChat/fuselage/commit/5ef1bec606e626704235cadfdb9bb7d424f8e481))

# [0.26.0](https://github.com/RocketChat/fuselage/compare/v0.25.0...v0.26.0) (2021-05-28)

### Features

- usePrevious hook ([#460](https://github.com/RocketChat/fuselage/issues/460)) ([32f2c30](https://github.com/RocketChat/fuselage/commit/32f2c3054c074a93c4f17400f29f81bb8f77249d))

# [0.25.0](https://github.com/RocketChat/fuselage/compare/v0.24.0...v0.25.0) (2021-05-19)

### Features

- [@rocket](https://github.com/rocket).chat/message-parser ([#443](https://github.com/RocketChat/fuselage/issues/443)) ([4722cdf](https://github.com/RocketChat/fuselage/commit/4722cdff46f5987f335d989be59649c7652bb12a))

# [0.24.0](https://github.com/RocketChat/fuselage/compare/v0.23.0...v0.24.0) (2021-04-28)

### Features

- [@rocket](https://github.com/rocket).chat/string-helpers ([#431](https://github.com/RocketChat/fuselage/issues/431)) ([2509d6a](https://github.com/RocketChat/fuselage/commit/2509d6acdbe5ec8b216e8d4430373797c5f5dfe2))

# [0.23.0](https://github.com/RocketChat/fuselage/compare/v0.22.0...v0.23.0) (2021-04-01)

### Bug Fixes

- **npm:** Wrong paths in "files" field of package.json ([6d3c811](https://github.com/RocketChat/fuselage/commit/6d3c811f6fd747de7f47aff145902d88476272ee))

# [0.22.0](https://github.com/RocketChat/fuselage/compare/v0.21.0...v0.22.0) (2021-02-26)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.21.0](https://github.com/RocketChat/fuselage/compare/v0.20.3...v0.21.0) (2021-01-31)

### Features

- Built modules for design tokens ([#356](https://github.com/RocketChat/fuselage/issues/356)) ([f9c3449](https://github.com/RocketChat/fuselage/commit/f9c344953b8161a4385cab3a3dcc8b6a7210446f))

## [0.20.1](https://github.com/RocketChat/fuselage/compare/v0.20.0...v0.20.1) (2020-12-22)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.20.0](https://github.com/RocketChat/fuselage/compare/v0.19.0...v0.20.0) (2020-12-21)

### Features

- useClipboard hook ([#337](https://github.com/RocketChat/fuselage/issues/337)) ([35ab50a](https://github.com/RocketChat/fuselage/commit/35ab50a89ebcf7a760b2eb8c41b4a0a4fdcecb37))
- usePrefersColorScheme hook ([#341](https://github.com/RocketChat/fuselage/issues/341)) ([f54a69d](https://github.com/RocketChat/fuselage/commit/f54a69d254ec1bc4f65e11821de7335b34288ae3))
- usePrefersReducedData hook ([#340](https://github.com/RocketChat/fuselage/issues/340)) ([59ae517](https://github.com/RocketChat/fuselage/commit/59ae517a31ec241321ba926b150b52612739d469))
- usePrefersReducedMotion hook ([#339](https://github.com/RocketChat/fuselage/issues/339)) ([475ae34](https://github.com/RocketChat/fuselage/commit/475ae342b25b2d79d0c34d76d22f4b4044be1ba3))

# [0.19.0](https://github.com/RocketChat/fuselage/compare/v0.18.0...v0.19.0) (2020-11-28)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.18.0](https://github.com/RocketChat/fuselage/compare/v0.17.3...v0.18.0) (2020-11-16)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.17.2](https://github.com/RocketChat/fuselage/compare/v0.17.1...v0.17.2) (2020-10-28)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.17.1](https://github.com/RocketChat/fuselage/compare/v0.17.0...v0.17.1) (2020-10-26)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.17.0](https://github.com/RocketChat/fuselage/compare/v0.16.0...v0.17.0) (2020-10-25)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.16.0](https://github.com/RocketChat/fuselage/compare/v0.15.1...v0.16.0) (2020-09-30)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.15.1](https://github.com/RocketChat/fuselage/compare/v0.15.0...v0.15.1) (2020-09-22)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.15.0](https://github.com/RocketChat/fuselage/compare/v0.14.1...v0.15.0) (2020-09-17)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.14.1](https://github.com/RocketChat/fuselage/compare/v0.14.0...v0.14.1) (2020-08-22)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.14.0](https://github.com/RocketChat/fuselage/compare/v0.13.2...v0.14.0) (2020-08-18)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.13.2](https://github.com/RocketChat/fuselage/compare/v0.13.1...v0.13.2) (2020-07-24)

### Bug Fixes

- useStorage setItem ([#269](https://github.com/RocketChat/fuselage/issues/269)) ([11a28a3](https://github.com/RocketChat/fuselage/commit/11a28a3b77b4e7486205e58a2014c93a8a1af53a))

## [0.13.1](https://github.com/RocketChat/fuselage/compare/v0.13.0...v0.13.1) (2020-07-17)

### Bug Fixes

- useMediaQueries support on Safari and IE11 ([#262](https://github.com/RocketChat/fuselage/issues/262)) ([f7be49a](https://github.com/RocketChat/fuselage/commit/f7be49a66e120a5a4f43205f2c2d149e90dae021))

# [0.13.0](https://github.com/RocketChat/fuselage/compare/v0.12.0...v0.13.0) (2020-07-14)

### Features

- usePosition ([#259](https://github.com/RocketChat/fuselage/issues/259)) ([b395d8c](https://github.com/RocketChat/fuselage/commit/b395d8c2e619d2ba26c5cfbee77275d0fbf9526a))

# [0.12.0](https://github.com/RocketChat/fuselage/compare/v0.11.0...v0.12.0) (2020-07-14)

### Bug Fixes

- fuselage-hooks bundling ([#258](https://github.com/RocketChat/fuselage/issues/258)) ([8539ccf](https://github.com/RocketChat/fuselage/commit/8539ccf878e6923eb42735298e05dc16435d90ce))

# [0.11.0](https://github.com/RocketChat/fuselage/compare/v0.10.0...v0.11.0) (2020-07-11)

### Features

- Hooks useLocalStorage and useSessionStorage ([#248](https://github.com/RocketChat/fuselage/issues/248)) ([7c9a920](https://github.com/RocketChat/fuselage/commit/7c9a92046f5d7bd01ea9f421470333785ba97ee2))
- useStableArray, useBreakpoints, useMediaQueries ([#253](https://github.com/RocketChat/fuselage/issues/253)) ([09f95ed](https://github.com/RocketChat/fuselage/commit/09f95edd7f296de45bc62caa16a1f43848fe3027))

# [0.10.0](https://github.com/RocketChat/fuselage/compare/v0.9.0...v0.10.0) (2020-06-20)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.9.0](https://github.com/RocketChat/fuselage/compare/v0.8.0...v0.9.0) (2020-05-21)

### Features

- useResizeObserver ([#223](https://github.com/RocketChat/fuselage/issues/223)) ([405c6a4](https://github.com/RocketChat/fuselage/commit/405c6a4be8f05e7e565bc8b3c27d668ee538abff))

# [0.8.0](https://github.com/RocketChat/fuselage/compare/v0.7.1...v0.8.0) (2020-04-22)

### Features

- New hooks and server-side compatibility ([#203](https://github.com/RocketChat/fuselage/issues/203)) ([ca620a0](https://github.com/RocketChat/fuselage/commit/ca620a0436dbbb89290e60ed1658985ece54f110))

## [0.7.1](https://github.com/RocketChat/fuselage/compare/v0.7.0...v0.7.1) (2020-04-01)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.7.0](https://github.com/RocketChat/fuselage/compare/v0.6.2...v0.7.0) (2020-04-01)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.6.2](https://github.com/RocketChat/fuselage/compare/v0.6.1...v0.6.2) (2020-03-31)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.6.1](https://github.com/RocketChat/fuselage/compare/v0.6.0...v0.6.1) (2020-03-24)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.6.0](https://github.com/RocketChat/fuselage/compare/v0.5.0...v0.6.0) (2020-03-20)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.5.0](https://github.com/RocketChat/fuselage/compare/v0.4.1...v0.5.0) (2020-03-20)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

## [0.4.1](https://github.com/RocketChat/fuselage/compare/v0.4.0...v0.4.1) (2020-03-16)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.4.0](https://github.com/RocketChat/fuselage/compare/v0.3.0...v0.4.0) (2020-03-10)

### Features

- useMutableCallback ([#156](https://github.com/RocketChat/fuselage/issues/156)) ([c43294f](https://github.com/RocketChat/fuselage/commit/c43294fead6b9b2e9acd9b6764ee702a4da6c3d5))

# [0.3.0](https://github.com/RocketChat/fuselage/compare/v0.2.0...v0.3.0) (2020-02-17)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.30...v0.2.0) (2020-02-13)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.29](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.28...v0.2.0-alpha.29) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.28](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.27...v0.2.0-alpha.28) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.26](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.25...v0.2.0-alpha.26) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.25](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.24...v0.2.0-alpha.25) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.24](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.23...v0.2.0-alpha.24) (2020-02-09)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.23](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.22...v0.2.0-alpha.23) (2020-02-07)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.22](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.21...v0.2.0-alpha.22) (2020-02-07)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.21](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.20...v0.2.0-alpha.21) (2020-02-05)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.20](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.19...v0.2.0-alpha.20) (2020-02-01)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.19](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.18...v0.2.0-alpha.19) (2020-01-13)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.18](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.17...v0.2.0-alpha.18) (2019-12-31)

### Features

- UI Kit ([#95](https://github.com/RocketChat/fuselage/issues/95)) ([6d4162b](https://github.com/RocketChat/fuselage/commit/6d4162bb8c121b1e89f8c818e7106bce49f09c27)), closes [#94](https://github.com/RocketChat/fuselage/issues/94) [#109](https://github.com/RocketChat/fuselage/issues/109) [#108](https://github.com/RocketChat/fuselage/issues/108) [#111](https://github.com/RocketChat/fuselage/issues/111)

# [0.2.0-alpha.16](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.15...v0.2.0-alpha.16) (2019-11-12)

### Bug Fixes

- Miscellaneous issues ([#90](https://github.com/RocketChat/fuselage/issues/90)) ([8e6e89a](https://github.com/RocketChat/fuselage/commit/8e6e89a43bdacf3626bf85599aecb370d615420d))

# [0.2.0-alpha.15](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.14...v0.2.0-alpha.15) (2019-11-05)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.14](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.13...v0.2.0-alpha.14) (2019-10-28)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.13](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.12...v0.2.0-alpha.13) (2019-10-25)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.12](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.11...v0.2.0-alpha.12) (2019-10-24)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.11](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.10...v0.2.0-alpha.11) (2019-10-22)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.10](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.9...v0.2.0-alpha.10) (2019-10-18)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.9](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.8...v0.2.0-alpha.9) (2019-10-17)

### Bug Fixes

- Explicit publish config ([#70](https://github.com/RocketChat/fuselage/issues/70)) ([21f9389](https://github.com/RocketChat/fuselage/commit/21f938991a58544c349e79b4e35284a4e51eb61b))

# [0.2.0-alpha.8](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.7...v0.2.0-alpha.8) (2019-10-16)

**Note:** Version bump only for package @rocket.chat/fuselage-hooks

# [0.2.0-alpha.7](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.6...v0.2.0-alpha.7) (2019-10-14)

### Features

- [@rocket](https://github.com/rocket).chat/fuselage-hooks package ([#65](https://github.com/RocketChat/fuselage/issues/65)) ([7244533](https://github.com/RocketChat/fuselage/commit/724453329d0e42a40cef6793f81fa11b19ddf0fd))
