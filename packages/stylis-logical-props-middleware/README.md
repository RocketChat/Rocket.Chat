# `@rocket.chat/stylis-logical-props-middleware`

> Stylis middleware that rewrites CSS logical properties into physical ones when the browser does not support them.

[![npm](https://img.shields.io/npm/v/@rocket.chat/stylis-logical-props-middleware?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/stylis-logical-props-middleware) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/stylis-logical-props-middleware?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/stylis-logical-props-middleware)

Write `margin-inline-start`, `inset-inline` or `float: inline-start` once. If the browser supports them, the declarations pass through unchanged. If not, this [Stylis](https://stylis.js.org/) middleware replaces them with physical properties (`left`, `right`, `top`, `bottom`, `width`...). Inline-axis properties are emitted twice: once under `html:not([dir=rtl])` for left-to-right documents and once under `[dir=rtl]` for right-to-left documents.

Support is detected with [`@rocket.chat/css-supports`](https://www.npmjs.com/package/@rocket.chat/css-supports), so it is checked once per property and value. Where `CSS.supports` is not available (server rendering, tests), every fallback is applied.

It powers the `transpile` function of [`@rocket.chat/css-in-js`](https://www.npmjs.com/package/@rocket.chat/css-in-js).

## Installation

```sh
npm install @rocket.chat/stylis-logical-props-middleware stylis@~4.4.0
```

`stylis` `~4.4.0` is a peer dependency. The package ships CommonJS (`dist/cjs`), ES modules (`dist/esm`) and TypeScript types.

## Usage

### With the default middleware

The default export is a middleware created with default options. Put it before `stringify`:

```ts
import logicalProps from '@rocket.chat/stylis-logical-props-middleware';
import { compile, middleware, prefixer, serialize, stringify } from 'stylis';

const css = serialize(compile('.box{margin-inline:4px 8px;inset-block-start:0;}'), middleware([logicalProps, prefixer, stringify]));
```

In a browser without logical property support, `css` is:

```text
html:not([dir=rtl]) .box{margin-left:4px;margin-right:8px;}[dir=rtl] .box{margin-right:4px;margin-left:8px;}.box{top:0;}
```

### With custom support checks

Use `createLogicalPropertiesMiddleware` to decide yourself which properties and values are supported. This is useful to force fallbacks, or to skip them when you know the target browsers.

```ts
import { createLogicalPropertiesMiddleware } from '@rocket.chat/stylis-logical-props-middleware';
import { compile, middleware, serialize, stringify } from 'stylis';

const alwaysFallBack = createLogicalPropertiesMiddleware({
	isPropertySupported: () => false,
	isPropertyValueSupported: () => false,
});

serialize(compile('.a{inset-inline-start:0;}'), middleware([alwaysFallBack, stringify]));
// 'html:not([dir=rtl]) .a{left:0;}[dir=rtl] .a{right:0;}'
```

### Handled properties

- Logical values of `float`, `clear` and `text-align` (`inline-start`, `inline-end`, `start`, `end`).
- `margin-*`, `padding-*` and `inset-*` on the inline and block axes, including the `-inline` and `-block` shorthands.
- `inset`.
- `border-inline*` and `border-block*`, including their `-width`, `-style` and `-color` variants.
- `border-start-start-radius`, `border-start-end-radius`, `border-end-start-radius` and `border-end-end-radius`.
- `inline-size`, `block-size` and their `min-` and `max-` variants.

`!important` is kept on every expanded declaration. Only top-level rule sets are processed; rules nested inside at-rules such as `@media` pass through unchanged.

## API

### `createLogicalPropertiesMiddleware`

```ts
const createLogicalPropertiesMiddleware: (options?: {
	isPropertySupported?: (property: string) => boolean;
	isPropertyValueSupported?: (property: string, value: string) => boolean;
}) => Middleware;
```

- `isPropertySupported`: whether a logical property can be used as is. Defaults to ``cssSupports(`${property}:inherit`)``.
- `isPropertyValueSupported`: whether a logical value (for example `float: inline-start`) can be used as is. Defaults to ``cssSupports(`${property}:${value}`)``.

### Default export

```ts
const middleware: Middleware;
```

The result of `createLogicalPropertiesMiddleware()`.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/stylis-logical-props-middleware). From the repository root:

```sh
yarn workspace @rocket.chat/stylis-logical-props-middleware build
yarn workspace @rocket.chat/stylis-logical-props-middleware testunit
yarn workspace @rocket.chat/stylis-logical-props-middleware lint
yarn workspace @rocket.chat/stylis-logical-props-middleware typecheck
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
