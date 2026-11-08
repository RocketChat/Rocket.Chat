# `@rocket.chat/ddp-client`

> A WebSocket (DDP) client SDK for Rocket.Chat: connection, login, method calls, realtime streams and a typed REST client.

[![npm](https://img.shields.io/npm/v/@rocket.chat/ddp-client?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/ddp-client) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/ddp-client?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/ddp-client)

Rocket.Chat sends realtime data over [DDP](https://github.com/meteor/meteor/blob/devel/packages/ddp/DDP.md), Meteor's WebSocket protocol. This package speaks DDP without Meteor. `DDPSDK` bundles everything a client needs:

- **Connection**: opens the WebSocket, reports its status and reconnects with an exponential backoff.
- **Account**: logs in with a password or a resume token, logs out, and tracks the current user.
- **ClientStream**: calls server methods and manages subscriptions.
- **Streams**: listens to Rocket.Chat's realtime streams (`room-messages`, `notify-room`, `notify-user`, ...).
- **TimeoutControl**: sends heartbeat pings and drops a socket that stops answering, so it can reconnect.
- **REST**: a [`@rocket.chat/api-client`](https://www.npmjs.com/package/@rocket.chat/api-client) `RestClient` that reuses the DDP login.

The package also exports `LivechatClientImpl`, the client the Omnichannel Livechat widget uses, and the types that describe Rocket.Chat's streams and server methods.

## Installation

`@rocket.chat/emitter` is a peer dependency and must be installed too:

```sh
npm install @rocket.chat/ddp-client @rocket.chat/emitter
```

The package is published as CommonJS with TypeScript declarations.

It uses the global `WebSocket` and `fetch`. Browsers and Node.js 22 or later provide both. On older Node.js versions, assign an implementation such as [`ws`](https://www.npmjs.com/package/ws) to `globalThis.WebSocket` before creating the SDK.

## Usage

### Connecting

```ts
import { DDPSDK } from '@rocket.chat/ddp-client';

const sdk = DDPSDK.create('https://open.rocket.chat');

await sdk.connection.connect();

console.log(sdk.connection.status); // 'connected'
```

Pass the server URL with an `http(s)` or `ws(s)` scheme and no path. The SDK connects to `<url>/websocket` and uses the same URL for REST calls, so prefer `https://...`.

`createAndConnect` does both steps:

```ts
const sdk = await DDPSDK.createAndConnect('https://open.rocket.chat');
```

Both take optional retry settings: `{ retryCount, retryTime }`. By default `DDPSDK` keeps trying to reconnect: the first attempt waits about `retryTime` (1000 ms), and each failed attempt doubles the wait, up to 30 seconds, with random jitter. `LivechatClientImpl` defaults to 3 retries, starting at 10 seconds.

Other options:

- `encode` / `decode`: the wire codec, `JSON.stringify` / `JSON.parse` by default. Pass `EJSON.stringify` / `EJSON.parse` to exchange dates and other EJSON types.
- `WebSocket`: a WebSocket implementation, the global one by default.
- `inFlightMethods`: what happens to method calls still waiting for their result when the connection drops. `'reject'` (default) rejects them with `ConnectionLostError`; `'resend'` sends them again after the reconnection, as Meteor does, so a call the server already ran runs twice.
- `logoutOnRefusedResume`: `true` (default) logs the account out when the server refuses the token after a reconnection; pass `false` if another layer of your client owns the session.

`sdk.connection.whenConnected()` resolves once the connection is up, whoever started it.

To follow the connection status:

```ts
sdk.connection.on('connection', (status) => console.log('status:', status));
```

### Logging in

`sdk.account` handles authentication.

```ts
// With a resume token (for example, a personal access token or one returned by /v1/login)
await sdk.account.loginWithToken(token);

// With a username and password; the password must be a hex-encoded SHA-256 digest
await sdk.account.loginWithPassword('alice', await sha256('secret'));

console.log(sdk.account.uid, sdk.account.user?.username);

await sdk.account.logout();
```

A browser-compatible helper for the digest:

```ts
const sha256 = async (text: string) => {
	const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
};
```

After a reconnection, the SDK logs in again with the stored token, then restores active subscriptions. If the server refuses the token (a 401/403 answer), the account is logged out, unless you created the SDK with `logoutOnRefusedResume: false`.

If you log in some other way, hand the login result to the SDK with `sdk.account.setCredentials({ id, token, tokenExpires })`; `sdk.account.clearCredentials()` forgets the user locally without calling the server.

`onLogin` and `onLogout` register listeners and return a function that removes them:

```ts
const stop = sdk.account.onLogin(() => console.log('logged in as', sdk.account.uid));
```

### Listening to streams

`sdk.stream(name, key, callback)` subscribes to a realtime stream and calls `callback` with each event for that key. Pass the stream name without the `stream-` prefix.

```ts
const subscription = sdk.stream('room-messages', roomId, (message) => {
	console.log('new or updated message', message);
});

await subscription.ready();

// Later
subscription.stop();
```

Listeners with the same stream, key and subscription arguments share one server subscription, which ends when the last of them stops; different arguments (such as another visitor token) open their own. Stop subscriptions you no longer need; this saves bandwidth and server resources.

`subscription.onStop(listener)` tells you when the server ends the subscription, for example when the stream needs a logged-in user:

```ts
subscription.onStop((error) => console.warn('stream stopped by the server', error));
```

Some streams also accept events from clients. `sdk.publish(name, key, ...args)` emits one:

```ts
await sdk.publish('notify-room', `${roomId}/user-activity`, username, ['user-typing']);
```

For the streams listed in the `StreamerEvents` type, `sdk.stream` types the callback arguments from the stream name and key:

```ts
sdk.stream('notify-room', `${roomId}/user-activity`, (username, activities) => {
	console.log(username, activities); // string, string[]
});
```

Use `StreamerCallbackArgs<Name, Key>` to name those types in your own code.

### Calling server methods

```ts
const subscriptions = await sdk.call('subscriptions/get');
```

`sdk.call(method, ...params)` is a shortcut for `sdk.client.callAsync`; both are typed for the methods declared in `ServerMethods` (the callback-style `client.call` and `client.callWithOptions` are not). The promise rejects with the server error, or with a `ConnectionLostError` when its frame was sent and the connection drops before the result arrives, unless `inFlightMethods` is `'resend'`. In that case the server may or may not have run the method. Calls made while disconnected, or queued behind a `wait` call, wait for the next connection. `connection.close()` rejects every pending call, whatever `inFlightMethods` says.

### Calling the REST API

`sdk.rest` is a `RestClient` that sends the DDP session's credentials. Paths and parameters are typed by [`@rocket.chat/rest-typings`](https://www.npmjs.com/package/@rocket.chat/rest-typings).

```ts
await sdk.rest.post('/v1/chat.sendMessage', { message: { rid: roomId, msg: 'Hello!' } });
```

A failed REST call rejects with the `Response`. Call `error.json()` to read the server's error. From a browser, you may need to allow your origin in the server's CORS settings.

### Typing server methods

`ServerMethods` is an interface you can extend through declaration merging. Its helpers `ServerMethodName`, `ServerMethodParameters` and `ServerMethodReturn` then cover your methods too.

```ts
declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		'myapp:getGreeting'(name: string): string;
	}
}
```

### Livechat

`LivechatClientImpl` extends `DDPSDK` with the visitor-side Livechat endpoints (`config`, `room`, `sendMessage`, `closeChat`, `uploadFile`, ...) and room listeners (`onRoomMessage`, `onAgentChange`, `onQueuePositionChange`, ...).

```ts
import { LivechatClientImpl } from '@rocket.chat/ddp-client';

const livechat = LivechatClientImpl.create('wss://open.rocket.chat');
await livechat.connection.connect();
```

## API

### `DDPSDK`

| Member                                   | Description                                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DDPSDK.create(url, options?)`           | Builds an SDK without connecting. Options: `retryCount`, `retryTime`, `encode`, `decode`, `WebSocket`, `inFlightMethods`, `logoutOnRefusedResume`. |
| `DDPSDK.createAndConnect(url, options?)` | Builds an SDK and resolves once connected.                                                                                                         |
| `connection`                             | `Connection`: `connect()`, `reconnect()`, `whenConnected()`, `close()`, `status`, and status events.                                               |
| `account`                                | `Account`: `loginWithPassword`, `loginWithToken`, `logout`, `setCredentials`, `clearCredentials`, `onLogin`, `onLogout`.                           |
| `client`                                 | `ClientStream`: `callAsync`, `callAsyncWithOptions`, `subscribe`, `unsubscribe`, `onCollection`, `subscriptions`.                                  |
| `timeoutControl`                         | `TimeoutControl`: heartbeat and timeout timers.                                                                                                    |
| `rest`                                   | `RestClient` from `@rocket.chat/api-client`, authenticated with the DDP session.                                                                   |
| `call(method, ...params)`                | Calls a server method and resolves with its result.                                                                                                |
| `stream(name, key, callback)`            | Subscribes to `stream-<name>` for `key`. Returns a subscription with `ready()`, `onStop()` and `stop()`.                                           |
| `publish(name, key, ...args)`            | Emits an event on `stream-<name>` for `key`.                                                                                                       |

`ConnectionStatus` is one of `'idle'`, `'connecting'`, `'connected'`, `'failed'`, `'closed'`, `'disconnected'` or `'reconnecting'`.

### Other exports

- `LivechatClientImpl`: the Livechat visitor client. Its interfaces `LivechatStream`, `LivechatEndpoints` and the `LivechatRoomEvents` type are exported too.
- `RocketchatSdkLegacyImpl`: a compatibility layer that mirrors the method names of the older Rocket.Chat JS SDK (`login`, `joinRoom`, `sendMessage`, `subscribeRoom`, `onMessage`, ...).
- `ConnectionLostError`: the rejection of a method call whose connection dropped before the result arrived.
- Types: `SDK`, `DDPSDKOptions`, `ClientStream`, `ConnectionStatus`, `StreamerEvents`, `StreamNames`, `StreamKeys`, `StreamerConfigs`, `StreamerConfig`, `StreamerCallbackArgs`, `StreamerCallback`, `ServerMethods`, `ServerMethodName`, `ServerMethodParameters`, `ServerMethodReturn`.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/ddp-client). From the repository root:

```sh
yarn workspace @rocket.chat/ddp-client build
yarn workspace @rocket.chat/ddp-client dev
yarn workspace @rocket.chat/ddp-client lint
yarn workspace @rocket.chat/ddp-client typecheck
yarn workspace @rocket.chat/ddp-client testunit
```

A runnable example lives in [`__examples__/simple.ts`](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/ddp-client/__examples__/simple.ts).

### How streams work

Meteor DDP normally syncs collections through publications and a server-side merge box. The merge box is expensive and scales poorly with many clients, so Rocket.Chat streams skip it.

Each stream is a virtual collection named `stream-<name>`. The server stores nothing in it; it only sends `changed` messages whose fields carry an `eventName` (the stream key) and `args` (the event payload). The client listens on that collection and hands `args` to the callback registered for the key. Client and server must agree on this convention.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
