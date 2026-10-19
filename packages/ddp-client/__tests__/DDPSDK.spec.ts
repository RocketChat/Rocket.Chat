import util from 'node:util';

import WS from 'jest-websocket-mock';
import { WebSocket } from 'ws';

import { fireStreamChange, fireStreamAdded, fireStreamRemove, handleConnection, handleSubscription, handleMethod } from './helpers';
import { ConnectionLostError } from '../src/ClientStream';
import { DDPSDK, toRestUrl } from '../src/DDPSDK';

(global as any).WebSocket = (global as any).WebSocket || WebSocket;

export let server: WS;

const callXTimes = <F extends (...args: any) => any>(fn: F, times: number): F => {
	return (async (...args) => {
		const methods = [].concat(...Array(times));
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const _ of methods) {
			await fn(...args);
		}
	}) as F;
};

beforeEach(async () => {
	server = new WS('ws://localhost:1234/websocket');
});

afterEach(() => {
	server.close();
	WS.clean();
	jest.useRealTimers();
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

	expect(cb).toHaveBeenCalledTimes(3);

	fireStreamChange(server, streamName, `${streamParams}-another`);

	expect(cb).toHaveBeenCalledTimes(3);

	expect(cb).toHaveBeenNthCalledWith(1, 1);
	sdk.connection.close();
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

	expect(cb).toHaveBeenCalledTimes(0);
	sdk.connection.close();
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

	expect(cb).toHaveBeenCalledTimes(3);

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();
	server.close();
	WS.clean();

	server = new WS('ws://localhost:1234/websocket');

	const reconnect = new Promise((resolve) => sdk.connection.once('reconnecting', () => resolve(undefined)));
	const connecting = new Promise((resolve) => sdk.connection.once('connecting', () => resolve(undefined)));
	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(server, jest.advanceTimersByTimeAsync(1000), reconnect, connecting, connected);

	// the client should reconnect and resubscribe
	await Promise.all([handleSubscription(server, result.id, streamName, streamParams), jest.advanceTimersByTimeAsync(1000)]);

	fire(server, streamName, streamParams);
	await jest.advanceTimersByTimeAsync(1000);

	expect(cb).toHaveBeenCalledTimes(6);

	jest.useRealTimers();
	sdk.connection.close();
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

	expect(cb).toHaveBeenCalledTimes(3);

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();

	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');

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

	expect(cb).toHaveBeenCalledTimes(4);

	expect(sdk.client.subscriptions.size).toBe(0);
	jest.useRealTimers();
	sdk.connection.close();
	sdk.connection.close();
});

it('should create and connect to a stream', async () => {
	const promise = DDPSDK.createAndConnect('ws://localhost:1234');
	await handleConnection(server, promise);
	const sdk = await promise;
	sdk.connection.close();
});

it('should reconnect after a heartbeat timeout', async () => {
	jest.useFakeTimers({ advanceTimers: true });

	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(server, sdk.connection.connect());

	// the server never answers the ping, so the heartbeat times out
	await Promise.all([server.nextMessage, jest.advanceTimersByTimeAsync(30_000)]);

	const disconnected = new Promise((resolve) => sdk.connection.once('disconnected', () => resolve(undefined)));
	await Promise.all([jest.advanceTimersByTimeAsync(30_000), disconnected]);

	expect(sdk.connection.status).toBe('disconnected');

	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(server, jest.advanceTimersByTimeAsync(1000), connected);

	expect(sdk.connection.status).toBe('connected');

	jest.useRealTimers();
	sdk.connection.close();
});

it.each([
	['https://open.rocket.chat', 'https://open.rocket.chat'],
	['wss://open.rocket.chat', 'https://open.rocket.chat'],
	['ws://localhost:3000/', 'http://localhost:3000'],
	['wss://open.rocket.chat/websocket', 'https://open.rocket.chat'],
])('should derive the REST URL %s -> %s', (url, expected) => {
	expect(toRestUrl(url)).toBe(expected);
});

it('should connect to the same socket whether or not the URL ends with /websocket', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234/websocket/');

	await handleConnection(server, sdk.connection.connect());

	expect(sdk.connection.status).toBe('connected');
	sdk.connection.close();
});

it('should stop the heartbeat when the connection is closed', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');

	await handleConnection(server, sdk.connection.connect());

	const stop = jest.spyOn(sdk.timeoutControl, 'stop');
	const close = jest.fn();
	sdk.connection.on('close', close);

	sdk.connection.close();

	expect(close).toHaveBeenCalledTimes(1);
	expect(stop).toHaveBeenCalled();
});

const loginAndReconnect = async (sdk: DDPSDK) => {
	await handleConnection(server, sdk.connection.connect());
	await handleMethod(
		server,
		'login',
		[{ resume: 'token' }],
		JSON.stringify({ id: 'uid', token: 'token', tokenExpires: { $date: 99999999 } }),
		sdk.account.loginWithToken('token'),
	);

	const subscription = sdk.client.subscribe('publication');
	await server.nextMessage;

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();
	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');
	const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
	await handleConnection(server, jest.advanceTimersByTimeAsync(1000), connected);
	jest.useRealTimers();

	return subscription;
};

it('should log in again before restoring subscriptions after a reconnection', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');
	const subscription = await loginAndReconnect(sdk);

	const login = JSON.parse((await server.nextMessage) as string);
	expect(login).toMatchObject({ msg: 'method', method: 'login', params: [{ resume: 'token' }] });

	server.send(JSON.stringify({ msg: 'result', id: login.id, result: { id: 'uid', token: 'token', tokenExpires: { $date: 99999999 } } }));

	await expect(server.nextMessage.then((message) => JSON.parse(message as string))).resolves.toMatchObject({
		msg: 'sub',
		id: subscription.id,
		name: 'publication',
	});
	expect(sdk.account.uid).toBe('uid');
	sdk.connection.close();
});

it('should drop the credentials when the server refuses the token after a reconnection', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');
	const subscription = await loginAndReconnect(sdk);
	const onLogout = jest.fn();
	sdk.account.onLogout(onLogout);

	const login = JSON.parse((await server.nextMessage) as string);
	server.send(JSON.stringify({ msg: 'result', id: login.id, error: { error: 403, reason: 'You are not allowed to use this token' } }));

	await expect(server.nextMessage.then((message) => JSON.parse(message as string))).resolves.toMatchObject({
		msg: 'sub',
		id: subscription.id,
	});
	expect(sdk.account.uid).toBeUndefined();
	expect(sdk.account.user).toBeUndefined();
	expect(onLogout).toHaveBeenCalledTimes(1);
	sdk.connection.close();
});

describe('Method call and Disconnection cases', () => {
	it('should handle properly if the message was sent after disconnection', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const [result] = await handleMethod(server, 'method', ['args1'], '1', sdk.client.callAsync('method', 'args1'));

		expect(result).toBe(1);
		// Fake timers are used to avoid waiting for the reconnect timeout
		jest.useFakeTimers();

		server.close();
		WS.clean();
		server = new WS('ws://localhost:1234/websocket');

		const reconnect = new Promise((resolve) => sdk.connection.once('reconnecting', () => resolve(undefined)));
		const connecting = new Promise((resolve) => sdk.connection.once('connecting', () => resolve(undefined)));
		const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));

		const callResult = sdk.client.callAsync('method', 'args2');

		expect(util.inspect(callResult).includes('pending')).toBe(true);

		await handleConnection(server, jest.advanceTimersByTimeAsync(1000), reconnect, connecting, connected);

		const [result2] = await handleMethod(server, 'method', ['args2'], '1', callResult);

		expect(util.inspect(callResult).includes('pending')).toBe(false);
		expect(result2).toBe(1);
		sdk.connection.close();
		jest.useRealTimers();
	});

	it('should reject a method sent before the connection dropped without a result', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const callResult = sdk.client.callAsync('method', 'args');
		await server.nextMessage;

		server.close();

		await expect(callResult).rejects.toBeInstanceOf(ConnectionLostError);
		sdk.connection.close();
	});

	it('should reject a method still waiting for its result when the connection is closed', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const callResult = sdk.client.callAsync('method', 'args');
		await server.nextMessage;

		sdk.connection.close();

		await expect(callResult).rejects.toBeInstanceOf(ConnectionLostError);
	});

	it('should keep sending methods after the connection dropped during a wait method', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234');

		await handleConnection(server, sdk.connection.connect());

		const login = sdk.account.loginWithToken('token');
		await server.nextMessage;
		const queued = sdk.client.callAsync('queued');

		// Fake timers are used to avoid waiting for the reconnect timeout
		jest.useFakeTimers();
		server.close();
		WS.clean();
		server = new WS('ws://localhost:1234/websocket');

		await expect(login).rejects.toBeInstanceOf(ConnectionLostError);

		const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
		await handleConnection(server, jest.advanceTimersByTimeAsync(1000), connected);
		jest.useRealTimers();

		const [result] = await handleMethod(server, 'queued', [], '1', queued);
		expect(result).toBe(1);

		const [result2] = await handleMethod(server, 'after', [], '2', sdk.client.callAsync('after'));
		expect(result2).toBe(2);

		sdk.connection.close();
	});
});
