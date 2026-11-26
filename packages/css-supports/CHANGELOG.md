# @rocket.chat/css-supports

## 0.32.0-rc.0

### Minor Changes

- ([#43538](https://github.com/RocketChat/Rocket.Chat/pull/43538)) Ships only an ES module build. The `dist/cjs` and `dist/esm` builds are replaced by a single one in `dist`, and the package now declares an `exports` map, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).

### Patch Changes

- <details><summary>Updated dependencies [9971f492da4960edce747fa9feb07c7fc332dbac]:</summary>
  - @rocket.chat/memo@0.32.0-rc.0

  </details>

## 0.31.27

### Patch Changes

- <details><summary>Updated dependencies [a9e0d93eb3c6e17476f5bf6081199a3ed8b253ec, a9e0d93eb3c6e17476f5bf6081199a3ed8b253ec, a9e0d93eb3c6e17476f5bf6081199a3ed8b253ec]:</summary>
  - @rocket.chat/memo@0.31.26

  </details>

## 0.31.27-rc.0

### Patch Changes

- <details><summary>Updated dependencies [a9e0d93eb3c6e17476f5bf6081199a3ed8b253ec, a9e0d93eb3c6e17476f5bf6081199a3ed8b253ec, a9e0d93eb3c6e17476f5bf6081199a3ed8b253ec]:</summary>
  - @rocket.chat/memo@0.31.26-rc.0

  </details>

## 0.31.26

### Patch Changes

- ([#41859](https://github.com/RocketChat/Rocket.Chat/pull/41859)) Moved `@rocket.chat/css-supports` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.31.25 release. The memoized, SSR-safe `CSS.supports` facade keeps the same API and runtime behaviour; only its build, lint and test wiring changed, none of which is published.

## 0.31.26-rc.0

### Patch Changes

- ([#41859](https://github.com/RocketChat/Rocket.Chat/pull/41859)) Moved `@rocket.chat/css-supports` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.31.25 release. The memoized, SSR-safe `CSS.supports` facade keeps the same API and runtime behaviour; only its build, lint and test wiring changed, none of which is published.
