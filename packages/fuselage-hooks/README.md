# `@rocket.chat/fuselage-hooks`

> React hooks for Fuselage, Rocket.Chat's design system.

[![npm](https://img.shields.io/npm/v/@rocket.chat/fuselage-hooks?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-hooks) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/fuselage-hooks?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/fuselage-hooks)

A collection of general-purpose React hooks used by [`@rocket.chat/fuselage`](https://www.npmjs.com/package/@rocket.chat/fuselage) and the Rocket.Chat web client. They cover debouncing, stable callbacks and refs, media queries and breakpoints, element size and visibility, web storage, clipboard access and anchored positioning.

The hooks do not depend on Fuselage components, so you can use them in any React app.

## Installation

```sh
npm install @rocket.chat/fuselage-hooks react
```

`react` is a peer dependency; the hooks need React 18 or later. The package ships CommonJS and ES module builds with TypeScript declarations.

## Usage

### Debounce a value

```tsx
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';

function UserSearch({ onSearch }: { onSearch: (text: string) => void }) {
	const [text, setText] = useState('');
	const debouncedText = useDebouncedValue(text, 300);

	useEffect(() => {
		onSearch(debouncedText);
	}, [debouncedText, onSearch]);

	return <input value={text} onChange={(e) => setText(e.currentTarget.value)} />;
}
```

### Keep a callback stable across renders

`useStableCallback` returns a function whose identity never changes but which always calls the latest version of `fn`. Use it for handlers that effects or memoized children depend on.

```tsx
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

function useEscapeKey(onEscape: () => void) {
	const handleKeyDown = useStableCallback((event: KeyboardEvent) => {
		if (event.key === 'Escape') onEscape();
	});

	useEffect(() => {
		// Subscribes once, even if `onEscape` changes on every render.
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleKeyDown]);
}
```

### Respond to the viewport

```tsx
import { useBreakpoints, useMediaQuery, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';

function useLayoutMode() {
	const breakpoints = useBreakpoints(); // e.g. ['xs', 'sm', 'md']
	const isLandscape = useMediaQuery('(orientation: landscape)');
	const reduceMotion = usePrefersReducedMotion();

	return {
		isMobile: !breakpoints.includes('md'),
		isLandscape,
		animate: !reduceMotion,
	};
}
```

`useBreakpoints` reads the breakpoint names and widths from `@rocket.chat/fuselage-tokens` (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl`) and returns the ones that currently match.

### Merge refs

```tsx
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { forwardRef, useRef, type ComponentProps } from 'react';

const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Input(props, ref) {
	const innerRef = useRef<HTMLInputElement>(null);
	const mergedRef = useMergedRefs(ref, innerRef);

	return <input ref={mergedRef} {...props} />;
});
```

On React 19 you can drop `forwardRef` and read `ref` from the props instead.

### Persist state in web storage

```tsx
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';

function SidebarToggle() {
	const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);

	return <button onClick={() => setCollapsed((value) => !value)}>{collapsed ? 'Expand' : 'Collapse'}</button>;
}
```

Values are stored as JSON under a prefixed key (`fuselage-localStorage-sidebar-collapsed` here). Every component using the same key stays in sync, including across browser tabs.

### Copy to the clipboard

```tsx
import { useClipboard } from '@rocket.chat/fuselage-hooks';

function CopyLink({ url }: { url: string }) {
	const { copy, hasCopied } = useClipboard(url);

	return <button onClick={() => copy()}>{hasCopied ? 'Copied' : 'Copy link'}</button>;
}
```

## API

### State and callbacks

| Hook                                                               | Description                                                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `useStableCallback(fn)`                                            | Returns a callback with a stable identity that always runs the latest `fn`.                        |
| `useDebouncedCallback(callback, delay, deps?)`                     | Returns a debounced, memoized callback with `flush()` and `cancel()` methods.                      |
| `useDebouncedValue(value, delay)`                                  | Returns `value` after it stops changing for `delay` milliseconds.                                  |
| `useDebouncedState(initialValue, delay)`                           | Like `useState`, with a debounced setter (`flush()` and `cancel()` included).                      |
| `useDebouncedReducer(reducer, initialArg, init, delay)`            | Like `useReducer`, with a debounced `dispatch`.                                                    |
| `useDebouncedUpdates([state, dispatch], delay)`                    | Debounces the dispatcher of an existing `useState` or `useReducer` pair.                           |
| `useSafely([state, dispatch])`                                     | Wraps a state pair so the dispatcher can be called after the component unmounts without effect.    |
| `useToggle(initialValue?)`                                         | Returns `[value, toggle]`; `toggle(forcedValue?)` flips the boolean or sets it.                    |
| `usePrevious(value)`                                               | Returns the value from the previous render.                                                        |
| `useLazyRef(init)`                                                 | Like `useRef`, with a lazily computed initial value.                                               |
| `useStableArray(array, compare?)`                                  | Returns the previous array instance while its elements are equal (`Object.is` by default).         |
| `useLocalStorage(key, fallbackValue)`                              | State synchronized with `localStorage`.                                                            |
| `useSessionStorage(key, fallbackValue)`                            | State synchronized with `sessionStorage`.                                                          |
| `useStorage(storage, key, fallbackValue)`                          | State synchronized with any `Storage` object.                                                      |
| `useClipboard(text, { clearTime?, onCopySuccess?, onCopyError? })` | Returns `{ copy, hasCopied }`; `hasCopied` resets after `clearTime` milliseconds (default `2000`). |

### Refs and DOM

| Hook                                                                     | Description                                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `useMergedRefs(...refs)`                                                 | Merges object refs and callback refs into one callback ref.                                                          |
| `useSafeRefCallback(callback)`                                           | Turns a callback that returns a cleanup function into a callback ref; the cleanup runs when the element is detached. |
| `useAutoFocus(isFocused?, options?)`                                     | Returns a ref whose element gets focus on mount, and again whenever `isFocused` turns `true` (the default).          |
| `useOutsideClick(refs, callback)`                                        | Calls `callback` on a `mousedown` outside every element in `refs`.                                                   |
| `useButtonPattern(onPress)`                                              | Returns `onClick`, `onKeyDown`, `role` and `tabIndex` props that make any element behave like an accessible button.  |
| `useBorderBoxSize(ref, { debounceDelay? })`                              | Returns the element's border box `{ inlineSize, blockSize }`, updated with `ResizeObserver`.                         |
| `useContentBoxSize(ref, { debounceDelay? })`                             | Returns the element's content box `{ inlineSize, blockSize }`, updated with `ResizeObserver`.                        |
| `useResizeObserver({ debounceDelay? })`                                  | Returns `{ ref, contentBoxSize, borderBoxSize }` for the element attached to `ref`.                                  |
| `useElementIsVisible()`                                                  | Returns `[ref, isVisible]`, tracking whether the element intersects the viewport.                                    |
| `usePosition(anchorRef, targetRef, { placement?, margin?, container? })` | Returns `{ style, placement }` to position `targetRef` next to `anchorRef`. `placement` defaults to `bottom-start`.  |
| `useIsomorphicLayoutEffect`                                              | `useLayoutEffect` in the browser, `useEffect` on the server.                                                         |

### Media queries and preferences

| Hook                             | Description                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `useMediaQuery(query?)`          | Returns `true` while the media query matches.                                               |
| `useMediaQueries(...queries)`    | Returns an array of booleans, one per query.                                                |
| `useBreakpoints(unit?)`          | Returns the names of the active Fuselage breakpoints. `unit` is `'em'` (default) or `'px'`. |
| `usePrefersColorScheme(scheme?)` | Returns `true` if `prefers-color-scheme` matches `scheme` (default `'light'`).              |
| `useDarkMode(forced?)`           | Returns `forced` when set, otherwise whether the system prefers a dark color scheme.        |
| `usePrefersReducedMotion()`      | Returns `true` if the user prefers reduced motion.                                          |
| `usePrefersReducedData()`        | Returns `true` if the user prefers reduced data usage.                                      |

The package also exports the types used by these hooks, such as `UseClipboardParams`, `UseClipboardReturn`, `UseResizeObserverOptions`, `UsePositionOptions`, `UsePositionResult`, `Placement`, `Position` and `PlacementVariant`, plus `getPositionStyle`, the pure function behind `usePosition`.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/fuselage-hooks). From the repository root:

```sh
yarn workspace @rocket.chat/fuselage-hooks build
yarn workspace @rocket.chat/fuselage-hooks testunit
yarn workspace @rocket.chat/fuselage-hooks typecheck
yarn workspace @rocket.chat/fuselage-hooks lint
yarn workspace @rocket.chat/fuselage-hooks lint:fix
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
