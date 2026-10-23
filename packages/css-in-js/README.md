# `@rocket.chat/css-in-js`

> Low-level toolset to write CSS in JavaScript, transpile it with Stylis and attach it to a document at runtime.

[![npm](https://img.shields.io/npm/v/@rocket.chat/css-in-js?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/css-in-js) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/css-in-js?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/css-in-js)

This package holds the building blocks behind Fuselage's styling and [`@rocket.chat/styled`](https://www.npmjs.com/package/@rocket.chat/styled). It does not render components. It gives you the pieces to build your own styling layer:

- `css` and `keyframes` template tags that evaluate lazily, with function interpolations.
- Deterministic, hash-based class and animation names.
- `transpile`, which runs CSS through [Stylis](https://stylis.js.org/) with vendor prefixing and fallbacks for CSS logical properties.
- `attachRules`, which inserts rules into a document and removes them when nothing references them anymore.

## Installation

```sh
npm install @rocket.chat/css-in-js
```

There are no peer dependencies. The package ships CommonJS (`dist/index.js`), an ES module build (`dist/index.module.js`) and TypeScript types.

`attachRules` needs a DOM. Without `window` it does nothing and returns a no-op detach callback.

## Usage

### Style an element by hand

```ts
import { attachRules, createClassName, css, escapeName, transpile } from '@rocket.chat/css-in-js';

const button = css`
	padding-inline: 16px;
	color: ${({ color }: { color: string }) => color};
`;

const content = button({ color: 'rebeccapurple' });
const className = createClassName(content);
const rules = transpile(`.${escapeName(className)}`, content);

const detach = attachRules(rules);

document.querySelector('button')?.classList.add(className);

// Later, when the element no longer needs the styles:
detach();
```

### Evaluate CSS with arguments

`css` returns a function. Arguments passed to it are forwarded to every function interpolation. Interpolated `false`, `null` and `undefined` render as nothing, and arrays are joined.

```ts
import { css } from '@rocket.chat/css-in-js';

const box = css`
	display: block;
	${({ hidden }: { hidden: boolean }) => hidden && 'display: none;'}
`;

box({ hidden: false }); // 'display: block;'
box({ hidden: true }); // 'display: block;\n\tdisplay: none;'
```

A `css` chunk can be interpolated into another one and receives the same arguments.

### Declare keyframes

Interpolate a `keyframes` tag inside `css`. It renders the hashed animation name in place and appends the `@keyframes` rule to the output.

```ts
import { css, keyframes } from '@rocket.chat/css-in-js';

const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

const content = css`
	animation: ${fadeIn} 200ms ease-in;
`();
// 'animation: rcx-css-<hash> 200ms ease-in;@keyframes rcx-css-<hash>{...}'
```

An empty `keyframes` tag evaluates to `none`.

### Attach rules to another document

Pass a `document` to target an iframe or a popup window. Each document gets its own `<style id="rcx-styles">` element.

```ts
import { attachRules } from '@rocket.chat/css-in-js';

const detach = attachRules('.foo{color:red;}', { document: iframe.contentDocument! });
```

## API

### `css`

```ts
const css: (slices: TemplateStringsArray, ...values: readonly unknown[]) => cssFn;
```

Template tag that declares a CSS chunk. Returns an `Evaluable` that renders the chunk to a string. Chunks without function interpolations are evaluated once and memoized.

### `keyframes`

```ts
const keyframes: (slices: TemplateStringsArray, ...values: unknown[]) => keyframesFn;
```

Template tag that declares a `@keyframes` at-rule. When evaluated, it returns the escaped animation name. If it runs inside a `css` evaluation, the at-rule is appended to that output.

### `Evaluable`, `cssFn`, `keyframesFn`

```ts
type Evaluable = <T extends readonly unknown[]>(...args: T) => string;
```

`cssFn` and `keyframesFn` are aliases of `Evaluable`.

### `transpile`

```ts
const transpile: (selector: string, content: string, middleware?: Middleware) => string;
```

Wraps `content` in `selector` and compiles it with Stylis. The default middleware applies [`@rocket.chat/stylis-logical-props-middleware`](https://www.npmjs.com/package/@rocket.chat/stylis-logical-props-middleware), Stylis's `prefixer` and `stringify`. Nested selectors such as `&:hover` are supported.

```ts
transpile('div', 'display: flex;');
// 'div{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}'
```

### `attachRules`

```ts
type RuleAttacher = (rules: string, options?: { document?: Document }) => () => void;
const attachRules: RuleAttacher;
```

Inserts `rules` into the target document (default: `window.document`) and returns a function that detaches them. Identical rules are reference-counted per document: they are inserted once and removed only after every caller has detached them. Removal happens in a microtask.

In production builds (`process.env.NODE_ENV === 'production'`) rules go through `CSSStyleSheet.insertRule` when available. Otherwise they are appended as text nodes, which keeps them readable in dev tools.

### `createClassName`, `createAnimationName`, `escapeName`

```ts
const createClassName: (content: string) => string;
const createAnimationName: (content: string) => string;
const escapeName: (animationOrClassName: string) => string;
```

`createClassName` returns `rcx-css-<hash>` for the given content. `createAnimationName` does the same, but returns `none` for empty content. `escapeName` escapes `@`, `#` and `:` so the name can be used in a selector.

### `cssSupports`

Re-exported from [`@rocket.chat/css-supports`](https://www.npmjs.com/package/@rocket.chat/css-supports).

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/css-in-js). From the repository root:

```sh
yarn workspace @rocket.chat/css-in-js build
yarn workspace @rocket.chat/css-in-js testunit
yarn workspace @rocket.chat/css-in-js lint
yarn workspace @rocket.chat/css-in-js typecheck
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
