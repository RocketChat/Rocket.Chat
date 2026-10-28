# `@rocket.chat/css-supports`

> Memoized, SSR-safe wrapper around the browser's `CSS.supports` API.

[![npm](https://img.shields.io/npm/v/@rocket.chat/css-supports?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/css-supports) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/css-supports?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/css-supports)

`cssSupports` tells you whether the current browser supports a CSS declaration. Results are cached per input string, so repeated checks are cheap. When there is no `window` or no `CSS.supports` (server rendering, test environments, old browsers), it returns `false` instead of throwing.

Rocket.Chat's styling packages use it to decide when CSS logical properties need fallbacks.

## Installation

```sh
npm install @rocket.chat/css-supports
```

There are no peer dependencies. The package ships CommonJS (`dist/cjs`), ES modules (`dist/esm`) and TypeScript types.

## Usage

Pass a single `property:value` declaration, the same string you would give to the one-argument form of `CSS.supports`.

```ts
import { cssSupports } from '@rocket.chat/css-supports';

if (cssSupports('display:grid')) {
	// use a grid layout
}

cssSupports('margin-inline-start:inherit'); // true in modern browsers, false on the server
```

The implementation is picked once, when the module is first evaluated. If `window.CSS.supports` is added later (for example, by a polyfill loaded after this module), it will not be used.

## API

### `cssSupports`

```ts
const cssSupports: (value: string) => boolean;
```

Returns `CSS.supports(value)`, memoized by `value`. Returns `false` when `window` or `window.CSS.supports` is not available.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/css-supports). From the repository root:

```sh
yarn workspace @rocket.chat/css-supports build
yarn workspace @rocket.chat/css-supports testunit
yarn workspace @rocket.chat/css-supports lint
yarn workspace @rocket.chat/css-supports typecheck
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
