# `@rocket.chat/api-client`

> A typed `fetch`-based client for the Rocket.Chat REST API.

[![npm](https://img.shields.io/npm/v/@rocket.chat/api-client?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/api-client) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/api-client?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/api-client)

`RestClient` sends requests to a Rocket.Chat server's `/api` routes. Endpoint paths, parameters and results are typed by [`@rocket.chat/rest-typings`](https://www.npmjs.com/package/@rocket.chat/rest-typings), so the compiler checks each call against the endpoint it targets. Results are typed as `Serialized<...>` from [`@rocket.chat/core-typings`](https://www.npmjs.com/package/@rocket.chat/core-typings): what actually arrives over JSON, with dates as strings.

The Rocket.Chat web client uses this package, and [`@rocket.chat/ddp-client`](https://www.npmjs.com/package/@rocket.chat/ddp-client) builds its `rest` property on top of it.

- Typed `get`, `post`, `put` and `delete` methods.
- Authentication through `X-User-Id` / `X-Auth-Token` headers.
- Automatic retry on two-factor authentication challenges, through a handler you provide.
- Middleware around every request except uploads.
- File uploads with progress events.

## Installation

```sh
npm install @rocket.chat/api-client
```

`@rocket.chat/rest-typings` and `@rocket.chat/core-typings` come in as dependencies.

The package is published as CommonJS. It relies on the global `fetch`, `FormData` and `File`, so it runs in browsers and in recent Node.js versions. `upload()` uses `XMLHttpRequest` and only works in browsers.

## Usage

### Creating a client

Pass the server URL without the `/api` suffix; the client adds it.

```ts
import { RestClient } from '@rocket.chat/api-client';

const client = new RestClient({ baseUrl: 'https://open.rocket.chat' });

const info = await client.get('/info');
```

### Logging in

Log in with `/v1/login`, then store the credentials. Every later request carries them as headers.

```ts
const { data } = await client.post('/v1/login', { user: 'alice', password: 'secret' });

client.setCredentials({
	'X-User-Id': data.userId,
	'X-Auth-Token': data.authToken,
});
```

If you already have a personal access token, pass the credentials to the constructor instead:

```ts
const client = new RestClient({
	baseUrl: 'https://open.rocket.chat',
	credentials: { 'X-User-Id': userId, 'X-Auth-Token': authToken },
});
```

### Calling typed endpoints

Paths start with the API version (`/v1/...`). The second argument holds the parameters: they become the query string for `GET` and the JSON body for `POST` and `PUT`.

```ts
const { user } = await client.get('/v1/users.info', { username: 'alice' });

const { message } = await client.post('/v1/chat.sendMessage', {
	message: { rid: 'GENERAL', msg: 'Hello from the API client' },
});

const { messages, total } = await client.get('/v1/channels.messages', { roomId: 'GENERAL', count: 20 });
```

Do not put a query string in the path; pass parameters as the second argument. If any parameter of a `POST` or `PUT` is a `File`, the body is sent as `multipart/form-data` instead of JSON.

`delete()` accepts a parameters argument for typing, but does not send it. Put what the endpoint needs in the path.

### Handling errors

Requests that fail reject with the `Response` object. Read the server's error from its body:

```ts
try {
	await client.post('/v1/chat.sendMessage', { message: { rid: 'unknown-room', msg: 'Hi' } });
} catch (error) {
	if (error instanceof Response) {
		const body = await error.json();
		console.error(error.status, body.error);
	}
}
```

You may need to allow your origin in the server's CORS settings when calling it from a browser.

### Two-factor authentication

When the server answers a request with a two-factor challenge, the client calls your handler, then repeats the request with the code it returns.

```ts
client.handleTwoFactorChallenge(async ({ method, emailOrUsername, invalidAttempt }) => {
	// method is 'totp', 'email' or 'password'
	return prompt(invalidAttempt ? 'Invalid code, try again' : `Enter your ${method} code`) ?? '';
});
```

Without a handler, the request rejects with the `400` response. Uploads are not retried: `upload()` bypasses `send()`, where the retry happens.

### Middleware

`use()` wraps `send()`, the method `get()`, `post()`, `put()` and `delete()` go through. `upload()` does not use `send()`, so middleware never sees uploads. A middleware receives the `send()` arguments and a `next` function.

```ts
client.use(async ([endpoint, method, options], next) => {
	const started = Date.now();
	const response = await next(endpoint, method, options);
	console.log(method, endpoint, response.status, `${Date.now() - started}ms`);
	return response;
});
```

### Uploading files

`upload()` posts form data with `XMLHttpRequest` so you can follow progress. It returns the `XMLHttpRequest`.

```ts
const xhr = client.upload(
	`/v1/rooms.media/${roomId}`,
	{ file },
	{
		progress: (event) => console.log(`${Math.round((event.loaded / event.total) * 100)}%`),
		load: () => console.log('done'),
		error: () => console.error('failed'),
	},
);
```

## API

### `new RestClient(options)`

| Option        | Type                     | Description                                                       |
| ------------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl`     | `string`                 | Server URL. Requests go to `${baseUrl}/api/...`.                  |
| `credentials` | `Credentials`            | Optional. Sent as `X-User-Id` and `X-Auth-Token` on each request. |
| `headers`     | `Record<string, string>` | Optional. Extra headers sent on each request.                     |

### Methods

| Method                                    | Description                                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `get(path, params?, options?)`            | `GET` request. `params` become the query string.                                                           |
| `post(path, params?, options?)`           | `POST` request with a JSON or multipart body. Resolves to `{}` on `204 No Content`.                        |
| `put(path, params?, options?)`            | `PUT` request with a JSON or multipart body.                                                               |
| `delete(path, params?, options?)`         | `DELETE` request. `params` are not sent.                                                                   |
| `upload(path, params, events?, options?)` | Multipart `POST` with `XMLHttpRequest`. `events` takes `load`, `progress`, `abort` and `error` listeners.  |
| `send(endpoint, method, options?)`        | Low-level request. Resolves to the raw `Response` when it is OK, rejects with it otherwise.                |
| `getCredentials()`                        | Returns the current `Credentials`, or `undefined`.                                                         |
| `setCredentials(credentials)`             | Replaces the credentials. Pass `undefined` to log out locally.                                             |
| `use(middleware)`                         | Wraps `send()` with a `Middleware`.                                                                        |
| `handleTwoFactorChallenge(handler)`       | Registers the function that returns a two-factor code for `{ method, emailOrUsername?, invalidAttempt? }`. |

`options` is a `RequestInit` without `method`, passed through to `fetch`. Headers in it override the client's headers.

### Types

- `RestClientInterface`: the interface `RestClient` implements. Use it to type a client you receive or mock.
- `Credentials`: `{ 'X-User-Id': string; 'X-Auth-Token': string }`.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/api-client). From the repository root:

```sh
yarn workspace @rocket.chat/api-client build
yarn workspace @rocket.chat/api-client dev
yarn workspace @rocket.chat/api-client lint
yarn workspace @rocket.chat/api-client testunit
```

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
