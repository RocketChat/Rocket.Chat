# @rocket.chat/memo

## 0.31.26-rc.0

### Patch Changes

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `clear` leaving `maxAge` timers running, which expired values cached after the clear too early

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `clear` rejecting, at the type level, memoized functions whose argument has a type other than `unknown`

- ([#42345](https://github.com/RocketChat/Rocket.Chat/pull/42345)) Fixes `memoize` recomputing on every call when the memoized function returns `NaN`
