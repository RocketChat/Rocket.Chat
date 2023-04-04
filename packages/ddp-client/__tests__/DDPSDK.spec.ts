import WS from 'jest-websocket-mock';
import { WebSocket } from 'ws';

import { DDPSDK } from '../src/DDPSDK';

(global as any).WebSocket = (global as any).WebSocket || WebSocket;

let server: WS;
beforeEach(() => {
	server = new WS('ws://localhost:1234');
});

afterEach(() => {
	server.close();
	WS.clean();
});

it('should handle a stream of messages', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const create = DDPSDK.create('ws://localhost:1234');

	await server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		server.send(`{"msg":"connected","session":"${streamParams}"}`);
	});

	const sdk = await create;

	const stream = sdk.stream(streamName, [streamParams], cb);

	const [id] = [...sdk.subscriptions.keys()];
	await server.nextMessage.then((message) => {
		expect(message).toBe(`{"msg":"sub","id":"${id}","name":"${streamName}","params":["${streamParams}"]}`);
		return server.send(`{"msg":"ready","subs":["${id}"]}`);
	});

	await stream;

	await server.send(`{"msg":"changed","collection":"${streamName}","id":"id","fields":{"eventName":"${streamParams}"}}`);
	await server.send(`{"msg":"changed","collection":"${streamName}","id":"id","fields":{"eventName":"${streamParams}"}}`);
	await server.send(`{"msg":"changed","collection":"${streamName}","id":"id","fields":{"eventName":"${streamParams}"}}`);

	await server.send(`{"msg":"changed","collection":"${streamName}","id":"id","fields":{"eventName":"${streamParams}-another"}}`);

	expect(cb).toBeCalledTimes(3);
});

it('should ignore messages other from changed', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const create = DDPSDK.create('ws://localhost:1234');

	await server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		server.send(`{"msg":"connected","session":"${streamParams}"}`);
	});

	const sdk = await create;

	const stream = sdk.stream(streamName, [streamParams], cb);

	const [id] = [...sdk.subscriptions.keys()];
	await server.nextMessage.then((message) => {
		expect(message).toBe(`{"msg":"sub","id":"${id}","name":"${streamName}","params":["${streamParams}"]}`);
		return server.send(`{"msg":"ready","subs":["${id}"]}`);
	});

	await stream;

	await server.send(`{"msg":"added","collection":"${streamName}","id":"id","fields":{"eventName":"${streamParams}"}}`);
	await server.send(`{"msg":"removed","collection":"${streamName}","id":"id","fields":{"eventName":"${streamParams}"}}`);

	expect(cb).toBeCalledTimes(0);
});
