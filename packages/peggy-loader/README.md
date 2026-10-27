# `@rocket.chat/peggy-loader`

> A webpack loader that compiles Peggy grammars into parser modules.

[![npm](https://img.shields.io/npm/v/@rocket.chat/peggy-loader?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/peggy-loader) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/peggy-loader?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/peggy-loader)

The loader lets you import a [Peggy](https://peggyjs.org/) grammar file as if it were a JavaScript module. At build time it runs `peggy.generate()` on the grammar and hands webpack the generated parser source. Rocket.Chat uses it to build [`@rocket.chat/message-parser`](https://www.npmjs.com/package/@rocket.chat/message-parser).

## Installation

```sh
npm install --save-dev @rocket.chat/peggy-loader peggy webpack
```

`peggy` and `webpack` are peer dependencies. The loader uses the `peggy` version you install.

## Usage

Add a rule for your grammar files to the webpack configuration:

```js
// webpack.config.js
module.exports = {
	module: {
		rules: [
			{
				test: /\.pegjs$/,
				use: '@rocket.chat/peggy-loader',
			},
		],
	},
	resolve: {
		extensions: ['.js', '.pegjs'],
	},
};
```

Then import the grammar. The generated module exports `parse` and `SyntaxError`; from Peggy 4 on, it also exports `StartRules`, the list of allowed start rules:

```js
import { parse } from './grammar.pegjs';

const ast = parse('input text');
```

With TypeScript, declare the module shape for your grammar files:

```ts
// pegjs.d.ts
declare module '*.pegjs' {
	export const parse: (input: string, options?: Record<string, unknown>) => unknown;
}
```

### Options

Options set on the rule are passed to `peggy.generate()`. By default the loader generates an ES module (`output: 'source'`, `format: 'es'`).

```js
{
	test: /\.pegjs$/,
	use: {
		loader: '@rocket.chat/peggy-loader',
		options: {
			allowedStartRules: ['Start', 'Inline'],
			cache: true,
		},
	},
}
```

Useful options include `allowedStartRules`, `cache`, `trace`, `plugins`, `dependencies` and `format`. See the [Peggy API documentation](https://peggyjs.org/documentation.html#generating-a-parser-javascript-api) for the full list.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/peggy-loader). From the repository root:

```sh
yarn workspace @rocket.chat/peggy-loader build
yarn workspace @rocket.chat/peggy-loader lint
yarn workspace @rocket.chat/peggy-loader typecheck
```

There are no tests in this package; it is exercised by the `@rocket.chat/message-parser` build.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
