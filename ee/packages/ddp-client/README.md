# Getting started
Add `@rocket.chat/ddp-client`  and `@rocket.chat/emitter` as dependencies of your project:

`yarn add @rocket.chat/ddp-client @rocket.chat/emitter`
or:
`npm install @rocket.chat/ddp-client @rocket.chat/emitter`

> @rocket.chat/emitter is listed as a peer dependency of ddp-client and is strictly necessary to make it work.

> Tip: The whole project is typed using typescript. For that reason, references to interfaces and objects will be kept to a minimum.

## Setting up the SDK

 First things first, let's import the SDK:
 `import  { DDPSDK }  from  '@rocket.chat/ddp-client';`
 
 Now we need to create a new SDK instance. Fortunately, `DDPSDK` exposes a `create` function that initalizes everything for a quick setup:
 `const  sdk  =  DDPSDK.create('http://localhost:3000');`
 
 We can then try to connect to the Rocket.Chat instance by doing:
 `await sdk.connection.connect();`
 
 You can check the connection status by referencing `sdk.connection.status`. If everything went right, it's value should be `'connected'`.

> If you're feeling fancy, you can create and connect in a single function call:
> `const  sdk  =  DDPSDK.createAndConnect('http://localhost:3000');`

## Login handling

The just created `sdk` exposes an `account` interface (`sdk.account`), which should have everything you need. It has 3 methods:

 1. `sdk.account.loginWithPassword(username, hashedPassword)`
	 - This method accepts 2 parameters, `username` and `password`. The password must be hashed as `sha-256` for it to work
 2. `sdk.account.loginWithToken('userTokenGoesHere')`
	  - If you already got the token someway through the API, you can call this method.
 3. `sdk.account.logout()`
	  - This one is self-explanatory.

While the `sdk` instance is kept in memory, you can find some user information and credentials by referencing `sdk.account.user`

## REST API
> TIP: You might have to enable CORS in your Rocket.Chat instance for this to work.

The sdk exposes a `rest` interface, which accept all rest methods (`get`, `post`, `put`, `delete`).

Example call:
`await sdk.rest.post('/v1/chat.sendMessage',  { message:  { rid: id, msg }  });`

> WARNING: if you wrap a rest call in a try catch block, the error will be of type `Response`. By calling `error.json()` you get access to the server error response.

## Streams

Rocket.Chat uses websockets as to provide realtime data. You can subscribe to publications in order to listen to data updates.

Below is an example of subscribing to the room-messages publication, which receives message updates from a room:
```ts
const messages = new Map([]);
const stream = sdk.stream('room-messages', roomId,  (args)  =>  {
	setMessages((messages)  =>  {
	messages.set(args._id, args);
	return  new  Map(messages);
});

// Stop the stream when you're done
stream.stop();
```

> TIP: always unsubscribe from publications when you're done with them. This saves bandwidth and server resources

