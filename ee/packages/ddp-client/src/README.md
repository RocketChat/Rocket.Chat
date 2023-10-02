[rest]: https://rocket.chat/docs/developer-guides/rest-api/
[api-rest]: ../../api-client/

<!-- [start]: https://github.com/RocketChat/Rocket.Chat.js.SDK/blob/master/src/utils/start.ts -->

# Rocket.Chat Javascript/Typescript SDK

Library for building Rocket.Chat clients in Javascript/Typescript.

## Quick Start

```
npm install @rocket.chat/sdk --save
```

or

```
yarn add @rocket.chat/sdk
```

This is pretty straightforward, but covers all the basics you need to do!

```ts
import { DDPSDK } from '@rocket.chat/sdk';

const sdk = DDPSDK.create('http://localhost:3000');

await sdk.connection.connect();

await sdk.accounts.login({
	user: {
		username: 'username',
	},
	password: 'password',
});

await sdk.stream('room-messages', 'GENERAL', (data) => {
	console.log('RECEIVED->>', data);
});

await sdk.rest.post('chat.postMessage', {
	rid: 'GENERAL',
	msg: 'Hello World',
});
```

This works out of the box for browsers. if you want to use it on NodeJS, you need to offer a `WebSocket` implementation and a `fetch` implementation.

We decided to not include any of those dependencies on the SDK, keeping it as lightweight as possible.

If you are coding in Typescript, which we recommend, you are going to inherit all the types from the Rocket.Chat server, so everything is going to be type safe.

All types used on the server and original clients are going to be available for you to use.

if you don't want to use realtime communication, you can use the REST API client directly: `@rocket.chat/api-rest`

## Overview

The sdk is implemented based on the following interface definition:

```ts
export interface SDK {
	stream(name: string, params: unknown[], cb: (...data: unknown[]) => void): Publication;

	connection: Connection;
	account: Account;
	client: ClientStream;

	timeoutControl: TimeoutControl;
	rest: RestClient;
}
```

Which means that in case of any new feature, bug fix or improvement, you can implement your own SDK variant and use it instead of the default one.

Each peace contains a set of methods and responsibilities:

### Connection

Responsible for the connection to the server, status and connection states.

### Account

Responsible for the account management, login, logout, handle credentials, get user information, etc.

### ClientStream

Responsible for the DDP communication, method calls, subscriptions, etc.

### TimeoutControl

Responsible for the Reconnection control

### RestClient

Responsible for the REST API communication for more info [see here][api-rest]
