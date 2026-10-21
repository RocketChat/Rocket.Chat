# `@rocket.chat/eslint-config`

> [!WARNING]
> **Deprecated.** The Rocket.Chat monorepo now lints with [oxlint](https://oxc.rs), using [`@rocket.chat/lint-config`](https://www.npmjs.com/package/@rocket.chat/lint-config). This package no longer receives rule updates; existing versions keep working.

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

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/eslint-config). From the repository root:

```sh
yarn workspace @rocket.chat/eslint-config lint
yarn workspace @rocket.chat/eslint-config lint:fix
```

The config is a single file, `index.js`. Nothing in the monorepo uses it any more.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
