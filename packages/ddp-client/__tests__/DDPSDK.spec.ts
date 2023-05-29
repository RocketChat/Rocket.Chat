/* eslint-disable no-debugger */
import WS from 'jest-websocket-mock';
import { WebSocket } from 'ws';

import { DDPSDK } from '../src/DDPSDK';
import { fireStreamChange, fireStreamAdded, fireStreamRemove, handleConnection, handleSubscription } from './helpers';

(global as any).WebSocket = (global as any).WebSocket || WebSocket;

export let server: WS;

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

	await handleConnection(server, sdk.connection.connect());

	const stream = sdk.stream(streamName, streamParams, cb);

	await handleSubscription(server, stream.id, streamName, streamParams);

	await stream.ready();

	fireStreamChange(server, streamName, streamParams);
	fireStreamChange(server, streamName, streamParams);
	fireStreamChange(server, streamName, streamParams);

	expect(cb).toBeCalledTimes(3);

	fireStreamChange(server, streamName, `${streamParams}-another`);

	expect(cb).toBeCalledTimes(3);

	expect(cb).toHaveBeenNthCalledWith(1, 1);
});

it('should ignore messages other from changed', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(server, sdk.connection.connect());

	const stream = sdk.stream(streamName, streamParams, cb);

	await handleSubscription(server, stream.id, streamName, streamParams);

	await stream.ready();

	fireStreamAdded(server, streamName, streamParams);

	fireStreamRemove(server, streamName, streamParams);

	expect(cb).toBeCalledTimes(0);
});

it('should handle streams after reconnect', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(server, sdk.connection.connect());

	const result = sdk.stream(streamName, streamParams, cb);

	expect(result.isReady).toBe(false);

	expect(sdk.client.subscriptions.size).toBe(1);

	await handleSubscription(server, result.id, streamName, streamParams);

	await result.ready();

	const fire = callXTimes(fireStreamChange, 3);

	await fire(server, streamName, streamParams);

	expect(cb).toBeCalledTimes(3);

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();
	await server.close();
	await WS.clean();

	server = new WS('ws://localhost:1234');

	const reconnect = new Promise((resolve) => sdk.connection.once('reconnecting', () => resolve(undefined)));
	const connecting = new Promise((resolve) => sdk.connection.once('connecting', () => resolve(undefined)));
	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(server, server.connected, Promise.resolve(jest.advanceTimersByTimeAsync(1000)), reconnect, connecting, connected);

	await jest.advanceTimersByTimeAsync(1000);

	await handleSubscription(server, result.id, streamName, streamParams);

	fire(server, streamName, streamParams);
	await jest.advanceTimersByTimeAsync(1000);

	expect(cb).toBeCalledTimes(6);

	jest.useRealTimers();
});

it('should handle an unsubscribe stream after reconnect', async () => {
	const cb = jest.fn();

	const streamName = 'stream';
	const streamParams = '123';

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(server, sdk.connection.connect());

	const subscription = sdk.stream(streamName, streamParams, cb);

	expect(subscription.isReady).toBe(false);

	expect(sdk.client.subscriptions.size).toBe(1);

	await handleSubscription(server, subscription.id, streamName, streamParams);

	await expect(subscription.ready()).resolves.toBe(undefined);

	expect(subscription.isReady).toBe(true);

	fireStreamChange(server, streamName, streamParams);
	fireStreamChange(server, streamName, streamParams);
	fireStreamChange(server, streamName, streamParams);

	expect(cb).toBeCalledTimes(3);

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();

	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234');

	const reconnect = new Promise((resolve) => sdk.connection.once('reconnecting', () => resolve(undefined)));
	const connecting = new Promise((resolve) => sdk.connection.once('connecting', () => resolve(undefined)));
	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(server, jest.advanceTimersByTimeAsync(1000), reconnect, connecting, connected);

	await handleSubscription(server, subscription.id, streamName, streamParams);

	expect(subscription.isReady).toBe(true);

	fireStreamChange(server, streamName, streamParams);

	subscription.stop();

	expect(sdk.client.subscriptions.size).toBe(0);

	fireStreamChange(server, streamName, streamParams);
	fireStreamChange(server, streamName, streamParams);
	jest.advanceTimersByTimeAsync(1000);

	expect(cb).toBeCalledTimes(4);

	expect(sdk.client.subscriptions.size).toBe(0);
	jest.useRealTimers();
});

it('should create and connect to a stream', async () => {
	await handleConnection(server, DDPSDK.createAndConnect('ws://localhost:1234'));
});
