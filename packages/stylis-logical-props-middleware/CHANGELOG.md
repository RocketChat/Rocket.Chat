# @rocket.chat/stylis-logical-props-middleware

## 0.32.0-rc.0

### Minor Changes

- ([#43538](https://github.com/RocketChat/Rocket.Chat/pull/43538)) Ships only an ES module build. The `dist/cjs` and `dist/esm` builds are replaced by a single one in `dist`, and the package now declares an `exports` map, so deep imports into `dist` no longer resolve. CommonJS consumers need a Node.js version that can `require()` ES modules (20.19 or 22.12 and later).

### Patch Changes

- <details><summary>Updated dependencies [be88a0ba4a3a72f9a606f054d5c2d051650140ee]:</summary>
  - @rocket.chat/css-supports@0.32.0-rc.0

  </details>

## 0.31.27

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/css-supports@0.31.27

  </details>

## 0.31.27-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/css-supports@0.31.27-rc.0

  </details>

## 0.31.26

### Patch Changes

- ([#41861](https://github.com/RocketChat/Rocket.Chat/pull/41861)) Moved `@rocket.chat/stylis-logical-props-middleware` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.31.25 release.

  Fixed logical shorthands that take one value per side losing their declarations entirely on the fallback path. `margin-inline: 4px 8px` expanded to `margin-left: 4px 8px` and `margin-right: 4px 8px`, and since two values on a longhand is invalid, browsers without logical property support dropped both — the element ended up with no inline margin at all rather than the wrong spacing. The value is now split across the two sides, covering `margin-inline`, `padding-inline`, `inset-inline`, their block counterparts, and `border-{inline,block}-{width,style,color}`. Splitting happens on top-level whitespace only, so values nested in `calc()`, `var()` and friends stay intact, and an `!important` flag is reattached to every expansion.

  `inset` carried the same defect behind a direction flip it should never have had, having been routed through the inline and block axes. It is a physical shorthand, so it now expands straight to `top`, `right`, `bottom` and `left` in the usual 1-to-4 value box order.

  The `stylis` peer dependency moves from the exact `4.0.10` pin to `~4.4.0`, the version the monorepo resolves.

  The CommonJS build no longer ships a duplicate copy of the type declarations, leaving `dist/esm` as the single source of types — where `types` already pointed.

- <details><summary>Updated dependencies [131bbceaff27f5c3f0156fdb21a4b2a79129c851]:</summary>
  - @rocket.chat/css-supports@0.31.26

  </details>

## 0.31.26-rc.0

### Patch Changes

- ([#41861](https://github.com/RocketChat/Rocket.Chat/pull/41861)) Moved `@rocket.chat/stylis-logical-props-middleware` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.31.25 release.

  Fixed logical shorthands that take one value per side losing their declarations entirely on the fallback path. `margin-inline: 4px 8px` expanded to `margin-left: 4px 8px` and `margin-right: 4px 8px`, and since two values on a longhand is invalid, browsers without logical property support dropped both — the element ended up with no inline margin at all rather than the wrong spacing. The value is now split across the two sides, covering `margin-inline`, `padding-inline`, `inset-inline`, their block counterparts, and `border-{inline,block}-{width,style,color}`. Splitting happens on top-level whitespace only, so values nested in `calc()`, `var()` and friends stay intact, and an `!important` flag is reattached to every expansion.

  `inset` carried the same defect behind a direction flip it should never have had, having been routed through the inline and block axes. It is a physical shorthand, so it now expands straight to `top`, `right`, `bottom` and `left` in the usual 1-to-4 value box order.

  The `stylis` peer dependency moves from the exact `4.0.10` pin to `~4.4.0`, the version the monorepo resolves.

  The CommonJS build no longer ships a duplicate copy of the type declarations, leaving `dist/esm` as the single source of types — where `types` already pointed.

- <details><summary>Updated dependencies [131bbceaff27f5c3f0156fdb21a4b2a79129c851]:</summary>
  - @rocket.chat/css-supports@0.31.26-rc.0

  </details>
