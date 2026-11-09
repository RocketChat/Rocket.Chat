# `@rocket.chat/memo`

> Small memoization helper for single-argument functions, with optional time-based expiry.

[![npm](https://img.shields.io/npm/v/@rocket.chat/memo?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/memo) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/memo?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/memo)

`memoize` wraps a function of one argument and caches its results by that argument. Entries can expire after a period of inactivity, and a memoized function's cache can be cleared on demand with `clear`.

Rocket.Chat's styling packages use it to cache CSS support checks and evaluated CSS.

## Installation

```sh
npm install @rocket.chat/memo
```

There are no dependencies. The package ships CommonJS (`dist/cjs`), ES modules (`dist/esm`) and TypeScript types.

## Usage

### Cache results forever

```ts
import { memoize } from '@rocket.chat/memo';

const slugify = memoize((title: string) => title.toLowerCase().trim().replace(/\s+/g, '-'));

slugify('Hello World'); // computed
slugify('Hello World'); // returned from the cache
```

The argument is used as a `Map` key, so objects are compared by reference, not by value.

### Expire unused entries

Pass `maxAge` in milliseconds. Each cached entry is dropped after `maxAge` ms without being read. Every cache hit restarts that entry's timer.

```ts
import { memoize } from '@rocket.chat/memo';

const fetchUser = memoize((id: string) => fetch(`/api/users/${id}`).then((res) => res.json()), { maxAge: 60_000 });
```

### Clear a cache

```ts
import { clear, memoize } from '@rocket.chat/memo';

const square = memoize((n: number) => n * n);

square(4);
clear(square); // drops every cached result and pending expiry timer
```

## API

### `memoize`

```ts
const memoize: <T, A, R>(fn: MemoizableFunction<T, A, R>, options?: Options) => MemoizedFunction<T, A, R>;
```

Returns a memoized version of `fn`. Only the first argument is used, both as input and as cache key. `this` is forwarded to `fn`. Without `options`, the cache grows without limit.

### `clear`

```ts
const clear: <T, A, R>(fn: MemoizedFunction<T, A, R>) => void;
```

Empties the cache of a function returned by `memoize` and cancels its expiry timers. Does nothing for other functions.

### Types

```ts
type MemoizableFunction<T, A, R> = (this: T, arg: A) => R;
type MemoizedFunction<T, A, R> = (this: T, arg: A) => R;
type Options = { maxAge: number };
```

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/memo). From the repository root:

```sh
yarn workspace @rocket.chat/memo build
yarn workspace @rocket.chat/memo testunit
yarn workspace @rocket.chat/memo lint
yarn workspace @rocket.chat/memo typecheck
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
