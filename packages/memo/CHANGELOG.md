# @rocket.chat/memo

## 0.32.0-rc.0

### Minor Changes

- ([#43374](https://github.com/RocketChat/Rocket.Chat/pull/43374)) Ships only an ES module build. The `dist/cjs` and `dist/esm` builds are replaced by a single one in `dist`, and the package now declares an `exports` map, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).

## 0.31.26

### Patch Changes

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `clear` leaving `maxAge` timers running, which expired values cached after the clear too early

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `clear` rejecting, at the type level, memoized functions whose argument has a type other than `unknown`

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `memoize` recomputing on every call when the memoized function returns `NaN`

## 0.31.26-rc.0

### Patch Changes

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `clear` leaving `maxAge` timers running, which expired values cached after the clear too early

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `clear` rejecting, at the type level, memoized functions whose argument has a type other than `unknown`

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `memoize` recomputing on every call when the memoized function returns `NaN`
