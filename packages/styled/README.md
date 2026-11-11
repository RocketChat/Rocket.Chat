# `@rocket.chat/styled`

> Minimal `styled` API to create React components from HTML elements and tagged CSS templates.

[![npm](https://img.shields.io/npm/v/@rocket.chat/styled?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/styled) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/styled?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/styled)

`styled` turns an intrinsic element (`div`, `button`, `span`...) and a CSS template into a React function component. Each distinct set of evaluated styles gets a hashed class name. The rules are transpiled and attached to the document by [`@rocket.chat/css-in-js`](https://www.npmjs.com/package/@rocket.chat/css-in-js), so you get vendor prefixes and fallbacks for CSS logical properties for free.

It is intentionally small: it only styles intrinsic elements, and has no theming, `as` prop or `attrs`.

## Installation

```sh
npm install @rocket.chat/styled react
```

`react` is a peer dependency. The components use `useInsertionEffect`, so React 18 or later is required.

## Usage

### Style an element

```tsx
import styled from '@rocket.chat/styled';

const Card = styled('div')`
	padding-block: 8px;
	padding-inline: 16px;
	border-radius: 4px;
	background-color: white;

	&:hover {
		background-color: whitesmoke;
	}
`;

const App = () => <Card role='region'>Hello</Card>;
```

The component accepts every prop of the underlying element. A `className` you pass is kept and the generated class name is appended to it.

### Style from props

Function interpolations receive the component props. Use the second argument of `styled` to remove custom props before they reach the DOM element.

```tsx
import styled from '@rocket.chat/styled';

type BadgeProps = { tone: 'info' | 'danger' };

const Badge = styled<'span', BadgeProps>('span', ({ tone: _tone, ...props }) => props)`
	padding: 2px 6px;
	color: white;
	background-color: ${(p) => (p.tone === 'danger' ? 'crimson' : 'steelblue')};
`;

const App = () => <Badge tone='danger'>3</Badge>;
```

### Render into another document

Styles are attached to `window.document` by default. When rendering into an iframe or a popup window, provide its document through `OwnerDocument`:

```tsx
import { OwnerDocument } from '@rocket.chat/styled';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

const PopupContent = ({ popup, children }: { popup: Window; children: ReactNode }) => (
	<OwnerDocument.Provider value={{ document: popup.document }}>{createPortal(children, popup.document.body)}</OwnerDocument.Provider>
);
```

## API

### `styled` (default export)

```ts
styled<K extends keyof JSX.IntrinsicElements, P>(
	type: K,
	filter?: (props: JSX.IntrinsicElements[K] & P) => JSX.IntrinsicElements[K],
): (
	slices: TemplateStringsArray,
	...values: readonly (string | ((props: P) => string))[]
) => FunctionComponent<JSX.IntrinsicElements[K] & P>;
```

- `type`: the intrinsic element to render.
- `filter`: optional function that receives the props (with the generated `className` already merged) and returns the props passed to the element.

The returned component has `displayName` set to `StyledComponent(<type>)`. Its rules are attached in an insertion effect and detached about one second after the component unmounts or its styles change.

### `OwnerDocument`

```ts
const OwnerDocument: React.Context<{ document: Document }>;
```

React context that sets the document where styles are attached. Defaults to `window.document`.

### `useOwnerDocument`

```ts
const useOwnerDocument: () => { document: Document };
```

Reads the current `OwnerDocument` value.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/styled). From the repository root:

```sh
yarn workspace @rocket.chat/styled build
yarn workspace @rocket.chat/styled testunit
yarn workspace @rocket.chat/styled lint
yarn workspace @rocket.chat/styled typecheck
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
