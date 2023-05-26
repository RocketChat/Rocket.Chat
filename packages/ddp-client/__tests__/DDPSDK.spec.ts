/* eslint-disable no-debugger */
import WS from 'jest-websocket-mock';
import { WebSocket } from 'ws';

import { DDPSDK } from '../src/DDPSDK';

(global as any).WebSocket = (global as any).WebSocket || WebSocket;

let server: WS;

const acceptConnection = async () => {
	await server.nextMessage.then(async (message) => {
		await expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		server.send(`{"msg":"connected","session":"session"}`);
	});
};

const handleConnection = async (...client: Promise<unknown>[]) => {
	await Promise.all([acceptConnection(), ...client]);
};

const handleSubscription = async (id: string, streamName: string, streamParams: string) => {
	await server.nextMessage.then(async (message) => {
		await expect(message).toBe(`{"msg":"sub","id":"${id}","name":"stream-${streamName}","params":["${streamParams}"]}`);
		server.send(`{"msg":"ready","subs":["${id}"]}`);
	});
};

const fireStream = (action: 'changed' | 'removed' | 'added') => {
	return (streamName: string, streamParams: string) => {
		return server.send(
			`{"msg":"${action}","collection":"stream-${streamName}","id":"id","fields":{"eventName":"${streamParams}", "args":[1]}}`,
		);
	};
};

const fireStreamChange = fireStream('changed');
const fireStreamRemove = fireStream('removed');
const fireStreamAdded = fireStream('added');

const callXTimes = <F extends (...args: any) => any>(fn: F, times: number): F => {
	return (async (...args) => {
		const methods = [].concat(...Array(times));
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const _ of methods) {
			// eslint-disable-next-line no-await-in-loop
			await fn(...args);
		}
	}) as F;
};

beforeEach(async () => {
	server = new WS('ws://localhost:1234');
});

afterEach(() => {
	return WS.clean();
});

it('should handle a stream of messages', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(sdk.connection.connect());

	const stream = sdk.stream(streamName, streamParams, cb);

	await handleSubscription(stream.id, streamName, streamParams);

	await stream.ready();

	fireStreamChange(streamName, streamParams);
	fireStreamChange(streamName, streamParams);
	fireStreamChange(streamName, streamParams);

	expect(cb).toBeCalledTimes(3);

	fireStreamChange(streamName, `${streamParams}-another`);

	expect(cb).toBeCalledTimes(3);

	expect(cb).toHaveBeenNthCalledWith(1, 1);
});

it('should ignore messages other from changed', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(sdk.connection.connect());

	const stream = sdk.stream(streamName, streamParams, cb);

	await handleSubscription(stream.id, streamName, streamParams);

	await stream.ready();

	fireStreamAdded(streamName, streamParams);

	fireStreamRemove(streamName, streamParams);

	expect(cb).toBeCalledTimes(0);
});

it('should handle streams after reconnect', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(sdk.connection.connect());

	const result = sdk.stream(streamName, streamParams, cb);

	expect(result.isReady).toBe(false);

	expect(sdk.client.subscriptions.size).toBe(1);

	await handleSubscription(result.id, streamName, streamParams);

	await result.ready();

	const fire = callXTimes(fireStreamChange, 3);

	await fire(streamName, streamParams);

	expect(cb).toBeCalledTimes(3);

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();
	await server.close();
	await WS.clean();

	server = new WS('ws://localhost:1234');

	const reconnect = new Promise((resolve) => sdk.connection.once('reconnecting', () => resolve(undefined)));
	const connecting = new Promise((resolve) => sdk.connection.once('connecting', () => resolve(undefined)));
	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(server.connected, Promise.resolve(jest.advanceTimersByTimeAsync(1000)), reconnect, connecting, connected);

	await jest.advanceTimersByTimeAsync(1000);

	await handleSubscription(result.id, streamName, streamParams);

	fire(streamName, streamParams);
	await jest.advanceTimersByTimeAsync(1000);

	expect(cb).toBeCalledTimes(6);

	jest.useRealTimers();
});

it('should handle an unsubscribe stream after reconnect', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(sdk.connection.connect());

	const subscription = sdk.stream(streamName, streamParams, cb);

	expect(subscription.isReady).toBe(false);

	expect(sdk.client.subscriptions.size).toBe(1);

	await handleSubscription(subscription.id, streamName, streamParams);

	await expect(subscription.ready()).resolves.toBe(undefined);

	expect(subscription.isReady).toBe(true);

	fireStreamChange(streamName, streamParams);
	fireStreamChange(streamName, streamParams);
	fireStreamChange(streamName, streamParams);

	expect(cb).toBeCalledTimes(3);

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();

	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234');

	const reconnect = new Promise((resolve) => sdk.connection.once('reconnecting', () => resolve(undefined)));
	const connecting = new Promise((resolve) => sdk.connection.once('connecting', () => resolve(undefined)));
	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(jest.advanceTimersByTimeAsync(1000), reconnect, connecting, connected);

	await handleSubscription(subscription.id, streamName, streamParams);

	expect(subscription.isReady).toBe(true);

	fireStreamChange(streamName, streamParams);

	subscription.stop();

	expect(sdk.client.subscriptions.size).toBe(0);

	fireStreamChange(streamName, streamParams);
	fireStreamChange(streamName, streamParams);
	jest.advanceTimersByTimeAsync(1000);

	expect(cb).toBeCalledTimes(4);

	expect(sdk.client.subscriptions.size).toBe(0);
	jest.useRealTimers();
});
