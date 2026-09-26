---
name: rocketchat-lint-config
description: Provides the full lint and code style configuration for the Rocket.Chat monorepo. Use when writing, editing, or reviewing code in any package to ensure correct formatting, ESLint rules, TypeScript strictness, and CSS conventions. Apply when the user asks about code style, lint errors, import ordering, naming conventions, TypeScript config, Prettier settings, or Stylelint rules.
---

# Rocket.Chat Lint & Code Style Configuration

Rules are **scoped** — each section states exactly which paths apply. Never apply package-specific rules outside their scope.

## Global formatting (all files)

Source: [`.prettierrc`](.prettierrc), [`.editorconfig`](.editorconfig)

- Indentation: **tabs** (exception: `*.i18n.json` → 2 spaces)
- Line endings: LF
- Print width: **140**
- Quotes: **single** in JS/TS; JSX attributes also single (`jsxSingleQuote: true`)
- Trailing commas: **`"all"`** — always add (including function params)
- Bracket spacing: `true`
- Arrow parens: `"always"`

## ESLint — global baseline

Applies to: **all files** (via `packages/eslint-config/index.js` + root `eslint.config.mjs`)

### Import ordering
Groups (with blank lines between each):
1. `builtin`
2. `external` / `internal`
3. `parent` / `sibling` / `index`

Alphabetized `asc` within each group. Rule: `import/order: error`.

Additional import rules: `import/first`, `import/no-duplicates`, `import/newline-after-import`, `import/no-absolute-path`, `import/no-dynamic-require`, `import/no-self-import`, `import/no-useless-path-segments` — all `error`.

### Best practices (all files)
- `eqeqeq` (`allow-null`), `no-var`, `prefer-const`, `prefer-template`, `prefer-destructuring` (object only), `object-shorthand` — all `error`
- `no-else-return` (`allowElseIf: false`), `no-nested-ternary`, `no-multi-assign`, `one-var: never` — `error`
- `no-eval`, `no-extend-native`, `no-implied-eval`, `guard-for-in` — `error`
- `complexity: warn` (threshold 31)
- Banned test-only: `describe.only`, `it.only`, `context.only` — `error`

### TypeScript (all `.ts`/`.tsx`/`.cts`/`.mts`)
- `@typescript-eslint/consistent-type-imports: error` (use `import type`)
- `@typescript-eslint/consistent-type-exports: error`
- `@typescript-eslint/no-floating-promises: error` (except in certain scopes — see overrides)
- `@typescript-eslint/no-unused-vars: error` — `argsIgnorePattern: ^_`, `ignoreRestSiblings: true`
- **Naming convention** (default for all TS):
  - Variables: `camelCase | UPPER_CASE | PascalCase`, leading `_` allowed
  - Functions: `camelCase | PascalCase`, leading `_` allowed
  - Parameters: `camelCase`; unused params **must** start with `_`
  - Parameters ending in `Component`: `PascalCase`
  - Interfaces: must match `/^I[A-Z]/`
  - `.d.ts` files: naming convention **off**
- Banned types (warn): `FC`, `React.FC`, `VFC`, `React.VFC`, `FunctionComponent`, `React.FunctionComponent` — use plain function signatures instead (ADR 0094)
- `@typescript-eslint/ban-ts-comment: warn`
- `@typescript-eslint/no-misused-promises: error` for non-test TS files (void-return checks relaxed for `arguments`, `attributes`, `inheritedMethods`)

### React (all files)
- `react/jsx-curly-brace-presence: error`
- `react/jsx-fragments: ['error', 'syntax']` — use `<>` shorthand
- `react/jsx-key: error` (check fragment shorthand, key-before-spread, warn duplicates)
- `react/no-multi-comp: error`
- `react-hooks/rules-of-hooks: warn` (overridden to `error` in non-TS files are excluded)
- `react-hooks/exhaustive-deps: warn` (root override; `error` in `packages/eslint-config`)

### Tests (`**/*.spec.ts(x)`, `**/*.test.ts(x)`, `**/__tests__/**`)
Type-checked rules disabled. Jest + Testing Library plugins active.
- Most jest rules: `warn` (not blocking)

### Stories (`**/*.stories.*`)
- `react/display-name: off`, `react/no-multi-comp: off`

---

## ESLint — `apps/meteor/**/*`

Extra globals: `__meteor_runtime_config__`, `Assets`, `chrome`, `jscolor`, all browser globals.

Banned lodash/underscore methods (use native equivalents) — `error` for direct replacements (e.g. `_.concat`, `_.keys`, `_.assign`), `warn` for iteration methods (e.g. `_.map`, `_.filter`, `_.find`).

`new-cap` exceptions: `Match.Optional`, `Match.Maybe`, `Match.OneOf`, `Match.Where`, `Match.ObjectIncluding`, `Push.Configure`, `SHA256`.

`prefer-arrow-callback: error` (named functions allowed).

`import/no-unresolved` ignores `meteor/.+` paths.

### `apps/meteor/**/*.ts(x)` (excluding `.d.ts` and `.scripts/`)
Stricter naming convention override:
- Variables: `camelCase | UPPER_CASE | PascalCase` (leading `_` or `__`)
- Functions: `camelCase | PascalCase` (leading `_` or `__`)
- Parameters: `camelCase` (leading `_`); unused **require** `_` prefix
- Interfaces: must match `/^I[A-Z]/`

`no-unreachable-loop: error`

### `apps/meteor/tests/e2e/**/*`
`@typescript-eslint/no-floating-promises: error` (promoted from off).

Import order split: `external` and `internal` are separate groups (newline between them).

### `apps/meteor/tests/(end-to-end|unit)/**/*.spec.ts`
All jest rules: `off`.

### `apps/meteor/client/**`, `apps/meteor/server/**`, `apps/meteor/ee/**`
`@typescript-eslint/no-floating-promises: off` (re-enabled only in e2e above).

---

## ESLint — `packages/livechat/**/*`

React pragma: `h` (Preact). Fragment pragma: `Fragment`. React version: `detect`.

Import order: groups are `builtin | external | internal | parent/sibling` (external and internal are **separate** here, unlike the default).

Relaxed jsx-a11y: `alt-text: off`, `click-events-have-key-events: off`, `media-has-caption: off`, `no-static-element-interactions: off`.

JSX quotes: single (`jsx-quotes: prefer-single`).

Key React rules:
- `react/display-name: warn`
- `react/jsx-fragments: ['error', 'syntax']`
- `react/jsx-no-bind: warn` (refs/functions/arrows allowed)
- `react/no-deprecated: error`, `react/no-did-mount-set-state: error`
- `react/self-closing-comp: error`
- `react/no-unknown-property: error` (ignore `class`)

### `packages/livechat/**/*.ts(x)`
Naming convention: same as `apps/meteor` TS but unused params only need `_` prefix (not required).

---

## ESLint — `packages/apps-engine/**/*.ts`

Uses custom tsconfig: `packages/apps-engine/tsconfig-lint.json`.

- `@typescript-eslint/no-empty-function: off`
- `@typescript-eslint/no-empty-object-type: off`
- `@typescript-eslint/no-unused-vars: ['error', { args: 'none' }]`
- `new-cap: off`
- Naming: same as global TS except unused params only need `_` prefix (not required).

Ignored paths: `packages/apps-engine/(client|definition|docs|server|lib|deno-runtime|.deno|.deno-cache)/**`.

---

## ESLint — `packages/ddp-client/**/*`

Naming convention override:
- `variableLike`: `camelCase`, leading `_` allowed
- Variables: `camelCase | UPPER_CASE | PascalCase`
- Functions: `camelCase | PascalCase`
- Unused parameters: require `_` prefix

---

## Stylelint — `apps/meteor/` only

Config: [`apps/meteor/.stylelintrc`](apps/meteor/.stylelintrc)

Extends `stylelint-config-standard`. Plugins: `stylelint-order`, `stylelint-selector-bem-pattern`.

Key rules:
- `color-hex-length: long` (always 6-digit hex)
- `declaration-block-single-line-max-declarations: 1`
- `selector-pseudo-element-colon-notation: double`
- Empty line before rules/at-rules: `always` (except `first-nested`)
- `length-zero-no-unit: true`

Ignored files: [`apps/meteor/.stylelintignore`](apps/meteor/.stylelintignore).

---

## Stylelint — `packages/livechat/` only

Config: [`packages/livechat/.stylelintrc.json`](packages/livechat/.stylelintrc.json)

Custom syntax: **postcss-scss**. Plugin: `stylelint-order`.

Same baseline rules as `apps/meteor`, plus `selector-pseudo-class-no-unknown` ignores `:global`.

CSS property order (`order/properties-order`), groups separated by empty lines (strict order within each):
1. **Position**: `position`, `z-index`, `top`, `right`, `bottom`, `left`
2. **Display/layout**: `display`, `visibility`, `float`, `clear`, `overflow*`, `flex*`
3. **Box model**: `box-sizing`, `width`, `min/max-width`, `height`, `min/max-height`, `margin*`, `padding*`
4. **Table**: `table-layout`, `border-spacing`, `border-collapse`, `list-style*`
5. **Content/interaction**: `content`, `cursor`, `user-select`, `transition*`, `transform*`, `animation*`, `text-*`, `letter-spacing`, `word-*`, `pointer-events`
6. **Visual**: `opacity`, `color`, `border*`, `outline*`, `background*`, `box-shadow`, `text-shadow`
7. **Typography**: `font*`, `line-height`

Unspecified properties: `bottomAlphabetical`.

---

## TypeScript — base presets (`packages/tsconfig/`)

All packages extend one of these three presets:

| Preset | Target | Module | Use for |
|--------|--------|--------|---------|
| `base.json` | `es5` | `commonjs` | Base — don't use directly |
| `client.json` | `es2015` | `esnext` | UI packages, browser code |
| `server.json` | `es2020` | `commonjs` | Server/service packages |

All presets enable `strict`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `allowUnreachableCode: false`.

`client.json` adds: `jsx: react-jsx`, `declaration`, `declarationMap`, `sourceMap`, `preserveSymlinks`.

### `apps/meteor` — relaxed strictness
Extends `base.json` but disables: `strictPropertyInitialization`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. The base `noUnusedLocals`/`noUnusedParameters` are also effectively off (not re-enabled here).

Target: `es2018`, module: `esnext`, includes `dom` lib. `allowJs: true`, `checkJs: false`.

---

## Deno runtime — `packages/apps-engine/deno-runtime/` only

Config: [`packages/apps-engine/deno-runtime/deno.jsonc`](packages/apps-engine/deno-runtime/deno.jsonc)

Formatter settings (Deno fmt, not Prettier):
- `lineWidth: 160`
- `useTabs: true`
- `indentWidth: 4`
- `singleQuote: true`
