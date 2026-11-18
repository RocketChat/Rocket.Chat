# `@rocket.chat/lint-config`

> The shared [oxlint](https://oxc.rs) config used across the Rocket.Chat codebase, for JavaScript, TypeScript and React.

It replaces [`@rocket.chat/eslint-config`](https://www.npmjs.com/package/@rocket.chat/eslint-config), with the same rules except:

- `@typescript-eslint/naming-convention`, `import-x/no-relative-packages` and `import-x/no-unresolved` are not enforced.
- `import-x/no-useless-path-segments` only catches what it can see in the import path (`./a/../a/b`, `./`), not paths that point back into the current directory (`../current/b`). That needs an import resolver, and oxlint ignores `settings` in a config you `extends`. To get the full check, install `eslint-import-resolver-typescript` and add the resolver to your own `settings`:

  ```json
  {
  	"settings": {
  		"import-x/resolver": { "typescript": true }
  	}
  }
  ```

- Unused disable directives are not reported. oxlint reads `options.reportUnusedDisableDirectives` only from your root config, so set it there.

Where oxlint has no native version of a rule, the config loads the original ESLint plugin as an oxlint JS plugin. Those plugins are dependencies of this package, so you don't install them yourself.

## Installation

```sh
npm install --save-dev @rocket.chat/lint-config oxlint oxlint-tsgolint
```

`oxlint-tsgolint` runs the type-aware rules.

## Usage

Create `.oxlintrc.json` at the root of your project:

```json
{
	"extends": ["./node_modules/@rocket.chat/lint-config/oxlint.json"],
	"options": { "typeAware": true }
}
```

Then run:

```sh
npx oxlint
```

Add your own `rules`, `overrides` and `ignorePatterns` after `extends`. Each linted TypeScript file must be included by a `tsconfig.json`, which the type-aware rules use.

### Opt-in rules

`@rocket.chat/lint-config/rules` exports a JS plugin with rules `oxlint.json` doesn't turn on:

| Rule            | What it reports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spacing-scale` | Literal spacing values that aren't Fuselage spacing tokens. Only `x4`, `x8`, `x12`, `x16`, `x20`, `x24`, `x32`, `x40`, their negatives (`neg-x8` or `-x8`), `0`, `none` and `auto` are allowed, so numbers and `px` strings fail even when they match a scale step (`8` and `'8px'` are reported with a hint to use `'x8'`). It checks `margin*`, `padding*`, `gap`, `rowGap` and `columnGap` on capitalized JSX components, the `Margins` props, and `spacing()` calls, following ternary and `\|\|`/`??` branches. The `ignoreComponents` option skips components whose spacing props aren't Fuselage's. |

Load the plugin through `jsPlugins` and turn the rule on:

```json
{
	"extends": ["./node_modules/@rocket.chat/lint-config/oxlint.json"],
	"jsPlugins": [{ "name": "rocket.chat", "specifier": "@rocket.chat/lint-config/rules" }],
	"rules": { "rocket.chat/spacing-scale": ["error", { "ignoreComponents": ["ResponsiveBar"] }] }
}
```

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/lint-config). The repository's root `.oxlintrc.json` extends `oxlint.json`, so a change here affects every package in the monorepo. The opt-in rules live in `rules/`. From the repository root:

```sh
yarn oxlint
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
