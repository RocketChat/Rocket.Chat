# `@rocket.chat/emitter`

> Tiny, typed event emitter that runs anywhere JavaScript does.

[![npm](https://img.shields.io/npm/v/@rocket.chat/emitter?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/emitter) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/emitter?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/emitter)

`Emitter` is a minimal publish/subscribe class. You describe your events with an event map type, and TypeScript checks event names and payloads on `on`, `once`, `off` and `emit`. Subscribing returns an unsubscribe function, so you do not need to keep a reference to the handler.

It has no dependencies and does not rely on Node.js or DOM APIs. Rocket.Chat uses it across its client and server packages.

## Installation

```sh
npm install @rocket.chat/emitter
```

There are no dependencies. The package ships CommonJS (`dist/index.js`), an ES module build (`dist/index.module.js`) and TypeScript types.

## Usage

### Typed events

```ts
import { Emitter } from '@rocket.chat/emitter';

type Events = {
	message: { id: string; text: string };
	connected: void;
};

const emitter = new Emitter<Events>();

const off = emitter.on('message', ({ id, text }) => {
	console.log(id, text);
});

emitter.on('connected', () => console.log('connected'));

emitter.emit('message', { id: '1', text: 'Hello' });
emitter.emit('connected');

off(); // stop listening to 'message'
```

Events typed as `void` take no payload. Each handler receives a single argument.

### Listen once

```ts
emitter.once('connected', () => {
	// runs on the next 'connected' event only
});
```

### Remove a handler

```ts
const handler = (message: Events['message']) => console.log(message.text);

emitter.on('message', handler);
emitter.off('message', handler);
```

`off` removes the first matching registration only. If the same handler was added twice, call `off` twice or use the functions returned by `on`.

### Extend it

```ts
import { Emitter } from '@rocket.chat/emitter';

class Connection extends Emitter<{ status: 'online' | 'offline' }> {
	goOnline() {
		this.emit('status', 'online');
	}
}
```

### Untyped use

Without a type argument, `Emitter` accepts any string or symbol as event type and any payload.

```ts
const emitter = new Emitter();

emitter.on('anything', (payload) => console.log(payload));
emitter.emit('anything', 42);
```

## API

### `class Emitter<EventMap extends DefaultEventMap = DefaultEventMap>`

| Method                | Description                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `on(type, handler)`   | Adds `handler` for events of `type`. Returns a function that removes this registration.                  |
| `once(type, handler)` | Like `on`, but the handler is removed before it runs the first time. Returns a function that removes it. |
| `off(type, handler)`  | Removes the first registration of `handler` for `type`.                                                  |
| `emit(type, event?)`  | Calls the handlers registered for `type`, in registration order, with `event`.                           |
| `has(type)`           | Returns `true` if at least one handler is registered for `type`.                                         |
| `events()`            | Returns the event types that currently have handlers.                                                    |

Handlers added or removed while an event is being emitted do not change the list of handlers called for that emission, except that a `once` handler already removed is skipped.

### Types

- `IEmitter<EventMap>`: the interface implemented by `Emitter`. Use it to type values that only need the emitter methods.
- `DefaultEventMap`: `Record<string | symbol, any>`.
- `OffCallbackHandler`: `() => void`, the type returned by `on` and `once`.
- `EventHandlerOf<EventMap, EventType>`, `EventOf<EventMap, EventType>`, `EventTypeOf<EventMap, EventValue>`, `AnyEventOf<EventMap>`, `AnyEventTypeOf<EventMap>`, `AnyEventHandlerOf<EventMap>`: helpers to derive handler, payload and event-type types from an event map.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/emitter). From the repository root:

```sh
yarn workspace @rocket.chat/emitter build
yarn workspace @rocket.chat/emitter testunit
yarn workspace @rocket.chat/emitter lint
yarn workspace @rocket.chat/emitter typecheck
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
