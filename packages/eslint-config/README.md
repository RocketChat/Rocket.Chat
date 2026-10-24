# `@rocket.chat/eslint-config`

> The shared ESLint flat config used across the Rocket.Chat codebase, for JavaScript, TypeScript and React.

[![npm](https://img.shields.io/npm/v/@rocket.chat/eslint-config?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/eslint-config) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/eslint-config?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/eslint-config)

This package exports a single ESLint 10 flat config array. Every package in the Rocket.Chat monorepo lints with it, and you can use it in Rocket.Chat apps and other projects that want the same rules.

It bundles all the plugins it needs, so you do not install them yourself. It includes:

- ESLint's recommended rules plus Rocket.Chat's best-practice, stylistic and ES2015+ rules;
- `typescript-eslint` recommended type-checked rules, with type checking turned off for JavaScript files, tests and tool config files;
- import ordering and resolution (`eslint-plugin-import-x`, with Node and TypeScript resolvers);
- React, React Hooks and `jsx-a11y` rules;
- Jest and Testing Library rules for `*.spec.*` and `*.test.*` files;
- Storybook rules for stories;
- Prettier, run as an ESLint rule (`prettier/prettier`);
- a check against Trojan Source bidirectional characters.

It ignores `dist`, `coverage` and `storybook-static` folders.

## Installation

```sh
npm install --save-dev @rocket.chat/eslint-config eslint
```

There are no peer dependencies. ESLint and all plugins are regular dependencies, but install `eslint` in your project too so the `eslint` command is available. The package is ESM only, so your config file must be an ES module (`eslint.config.mjs`, or `eslint.config.js` in a `"type": "module"` package).

## Usage

### Basic setup

Create `eslint.config.mjs` at the root of your project:

```js
import rocketChatConfig from '@rocket.chat/eslint-config';

export default rocketChatConfig;
```

Then run:

```sh
npx eslint .
```

### Adding your own settings

The default export is an array of flat config objects. Spread it and add your own entries after it. The example also imports `globals`, which this package depends on but does not re-export; install it too (`npm install --save-dev globals`) so strict package managers resolve it:

```js
import rocketChatConfig from '@rocket.chat/eslint-config';
import globals from 'globals';

export default [
	...rocketChatConfig,
	{
		ignores: ['build/**'],
	},
	{
		files: ['src/**/*'],
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},
];
```

### TypeScript

Type-aware rules use `typescript-eslint`'s project service (`parserOptions.projectService: true`). ESLint finds the nearest `tsconfig.json` for each TypeScript file, so each linted `.ts`/`.tsx` file must be included by a `tsconfig.json`.

### Formatting

Formatting problems are reported by the `prettier/prettier` rule and fixed by `eslint --fix`. Prettier reads your usual Prettier configuration file.

### Globals

The config enables Node.js globals for all files. Add browser or other globals yourself, as shown above.

### Opt-in rules

`@rocket.chat/eslint-config/rules` exports a plugin with rules the default config doesn't turn on. It works as an ESLint plugin and as an oxlint JS plugin:

| Rule            | What it reports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spacing-scale` | Literal spacing values that aren't Fuselage spacing tokens. Only `x4`, `x8`, `x12`, `x16`, `x20`, `x24`, `x32`, `x40`, their negatives (`neg-x8` or `-x8`), `0`, `none` and `auto` are allowed, so numbers and `px` strings fail even when they match a scale step (`8` and `'8px'` are reported with a hint to use `'x8'`). It checks `margin*`, `padding*`, `gap`, `rowGap` and `columnGap` on capitalized JSX components, the `Margins` props, and `spacing()` calls, following ternary and `\|\|`/`??` branches. The `ignoreComponents` option skips components whose spacing props aren't Fuselage's. |

```js
import rocketChatConfig from '@rocket.chat/eslint-config';
import rocketChatRules from '@rocket.chat/eslint-config/rules';

export default [
	...rocketChatConfig,
	{
		plugins: { 'rocket.chat': rocketChatRules },
		rules: { 'rocket.chat/spacing-scale': ['error', { ignoreComponents: ['ResponsiveBar'] }] },
	},
];
```

With oxlint, load it through `jsPlugins` in `.oxlintrc.json`:

```json
{
	"jsPlugins": [{ "name": "rocket.chat", "specifier": "@rocket.chat/eslint-config/rules" }],
	"rules": { "rocket.chat/spacing-scale": ["error", { "ignoreComponents": ["ResponsiveBar"] }] }
}
```

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/eslint-config). From the repository root:

```sh
yarn workspace @rocket.chat/eslint-config lint
yarn workspace @rocket.chat/eslint-config lint:fix
```

The config is `index.js` (`oxlint.json` for oxlint), and the opt-in rules live in `rules/`. The repository's root `eslint.config.mjs` and `.oxlintrc.json` build on it, so a change here affects every package in the monorepo.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
