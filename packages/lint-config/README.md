# `@rocket.chat/lint-config`

> The shared [oxlint](https://oxc.rs) config used across the Rocket.Chat codebase, for JavaScript, TypeScript and React.

It replaces [`@rocket.chat/eslint-config`](https://www.npmjs.com/package/@rocket.chat/eslint-config), with the same rules except `@typescript-eslint/naming-convention` and `import-x/no-relative-packages`, which oxlint can't run. Where oxlint has no native version of a rule, the config loads the original ESLint plugin as an oxlint JS plugin. Those plugins are dependencies of this package, so you don't install them yourself.

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

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/lint-config). The repository's root `.oxlintrc.json` extends `oxlint.json`, so a change here affects every package in the monorepo. From the repository root:

```sh
yarn oxlint
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
