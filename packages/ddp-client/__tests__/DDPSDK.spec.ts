import util from 'node:util';

import WS from 'jest-websocket-mock';
import { WebSocket } from 'ws';

import { fireStreamChange, fireStreamAdded, fireStreamRemove, handleConnection, handleSubscription, handleMethod } from './helpers';
import { ConnectionLostError } from '../src/ClientStream';
import type { ConnectionImpl } from '../src/Connection';
import { DDPSDK, toRestUrl } from '../src/DDPSDK';
import { LivechatClientImpl } from '../src/livechat/LivechatClientImpl';

(global as any).WebSocket = (global as any).WebSocket || WebSocket;

export let server: WS;

const callXTimes = <F extends (...args: any) => any>(fn: F, times: number): F => {
	return (async (...args) => {
		const methods = [].concat(...Array(times));
		// oxlint-disable-next-line @typescript-eslint/no-unused-vars
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

it('should not share a stream subscription between listeners with different args', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');
	await handleConnection(server, sdk.connection.connect());

	const anonymous = sdk.stream('stream', ['key', { token: undefined }], () => undefined);
	const visitor = sdk.stream('stream', ['key', { token: 'visitor' }], () => undefined);

	expect(visitor.id).not.toBe(anonymous.id);
	expect(sdk.client.subscriptions.get(visitor.id)?.params).toEqual(['key', { useCollection: false, args: [{ token: 'visitor' }] }]);
	sdk.connection.close();
});

it('should share one server subscription between listeners of the same stream key', async () => {
	const first = jest.fn();
	const second = jest.fn();
	const sdk = DDPSDK.create('ws://localhost:1234');
	await handleConnection(server, sdk.connection.connect());

	const a = sdk.stream('stream', 'key', first);
	const b = sdk.stream('stream', 'key', second);

	expect(a.id).toBe(b.id);
	expect(sdk.client.subscriptions.size).toBe(1);
	await handleSubscription(server, a.id, 'stream', 'key');
	await b.ready();
	expect(a.isReady).toBe(true);

	fireStreamChange(server, 'stream', 'key');
	expect(first).toHaveBeenCalledTimes(1);
	expect(second).toHaveBeenCalledTimes(1);

	a.stop();
	a.stop();
	fireStreamChange(server, 'stream', 'key');
	expect(first).toHaveBeenCalledTimes(1);
	expect(second).toHaveBeenCalledTimes(2);
	expect(sdk.client.subscriptions.size).toBe(1);

	b.stop();
	await expect(server.nextMessage).resolves.toBe(JSON.stringify({ msg: 'unsub', id: a.id }));
	expect(sdk.client.subscriptions.size).toBe(0);
	sdk.connection.close();
});

it('should tell stream listeners still active that the server stopped their stream', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');
	await handleConnection(server, sdk.connection.connect());

	const active = sdk.stream('stream', 'key', () => undefined);
	const stopped = sdk.stream('stream', 'key', () => undefined);
	const onActiveStop = jest.fn();
	const onStoppedStop = jest.fn();
	active.onStop(onActiveStop);
	stopped.onStop(onStoppedStop);
	await server.nextMessage;

	stopped.stop();
	server.send(JSON.stringify({ msg: 'nosub', id: active.id }));
	await new Promise((resolve) => setTimeout(resolve, 10));

	expect(onActiveStop).toHaveBeenCalledWith(new Error('Subscription stream-stream was stopped by the server'));
	expect(onStoppedStop).not.toHaveBeenCalled();
	sdk.connection.close();
});

it('should open a new server subscription once the shared one was stopped by the server', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');
	await handleConnection(server, sdk.connection.connect());

	const stale = sdk.stream('stream', 'key', () => undefined);
	await server.nextMessage;
	server.send(JSON.stringify({ msg: 'nosub', id: stale.id, error: { error: 'not-allowed' } }));

	const fresh = sdk.stream('stream', 'key', () => undefined);

	expect(fresh.id).not.toBe(stale.id);
	await handleSubscription(server, fresh.id, 'stream', 'key');
	stale.stop();
	expect(sdk.client.subscriptions.has(fresh.id)).toBe(true);
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
	await handleConnection(server, jest.advanceTimersByTimeAsync(2000), reconnect, connecting, connected);

	// the client should reconnect and resubscribe
	await Promise.all([handleSubscription(server, result.id, streamName, streamParams), jest.advanceTimersByTimeAsync(2000)]);

	fire(server, streamName, streamParams);
	await jest.advanceTimersByTimeAsync(2000);

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
	await handleConnection(server, jest.advanceTimersByTimeAsync(2000), reconnect, connecting, connected);

	await handleSubscription(server, subscription.id, streamName, streamParams);

	expect(subscription.isReady).toBe(true);

	fireStreamChange(server, streamName, streamParams);

	subscription.stop();

	expect(sdk.client.subscriptions.size).toBe(0);

	fireStreamChange(server, streamName, streamParams);
	fireStreamChange(server, streamName, streamParams);
	jest.advanceTimersByTimeAsync(2000);

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
	await handleConnection(server, jest.advanceTimersByTimeAsync(2000), connected);

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

it('should encode and decode frames with the given codec', async () => {
	const encode = jest.fn((payload: unknown) => JSON.stringify(payload));
	const decode = jest.fn((raw: string) => JSON.parse(raw));
	const sdk = DDPSDK.create('ws://localhost:1234', { encode, decode });

	await handleConnection(server, sdk.connection.connect());

	expect(encode).toHaveBeenCalledWith({ msg: 'connect', version: '1', support: ['1', 'pre2', 'pre1'] });
	expect(decode).toHaveBeenCalledWith('{"msg":"connected","session":"session"}');
	sdk.connection.close();
});

it('should build instances of the subclass it is called on, with the subclass defaults', () => {
	const livechat = LivechatClientImpl.create('ws://localhost:1234');

	expect(livechat).toBeInstanceOf(LivechatClientImpl);
	expect((livechat.connection as ConnectionImpl).retryOptions).toMatchObject({ retryCount: 3, retryTime: 10000 });
});

it('should publish an event on a stream', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');
	await handleConnection(server, sdk.connection.connect());

	const [result] = await handleMethod(
		server,
		'stream-notify-room',
		['rid/user-activity', 'alice', ['user-typing']],
		'true',
		sdk.publish('notify-room', 'rid/user-activity', 'alice', ['user-typing']),
	);

	expect(result).toBe(true);
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
	await handleConnection(server, jest.advanceTimersByTimeAsync(2000), connected);
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

it('should keep the credentials when the server refuses the token and logoutOnRefusedResume is false', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234', { logoutOnRefusedResume: false });
	const subscription = await loginAndReconnect(sdk);

	const login = JSON.parse((await server.nextMessage) as string);
	server.send(JSON.stringify({ msg: 'result', id: login.id, error: { error: 403, reason: 'You are not allowed to use this token' } }));

	await expect(server.nextMessage.then((message) => JSON.parse(message as string))).resolves.toMatchObject({
		msg: 'sub',
		id: subscription.id,
	});
	expect(sdk.account.uid).toBe('uid');
	sdk.connection.close();
});

it('should keep the credentials when the re-login fails for a reason other than a refused token', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234');
	const subscription = await loginAndReconnect(sdk);

	const login = JSON.parse((await server.nextMessage) as string);
	server.send(JSON.stringify({ msg: 'result', id: login.id, error: { error: 'too-many-requests', reason: 'Error, too many requests' } }));

	await expect(server.nextMessage.then((message) => JSON.parse(message as string))).resolves.toMatchObject({
		msg: 'sub',
		id: subscription.id,
	});
	expect(sdk.account.uid).toBe('uid');
	sdk.connection.close();
});

it('should reject every pending call on close, including calls made after the connection dropped', async () => {
	const sdk = DDPSDK.create('ws://localhost:1234', { inFlightMethods: 'resend' });
	await handleConnection(server, sdk.connection.connect());

	const wait = sdk.client.callAsyncWithOptions('wait', { wait: true });
	await server.nextMessage;
	const behindWait = sdk.client.callAsync('behind-wait');

	const disconnected = new Promise((resolve) => sdk.connection.once('disconnected', () => resolve(undefined)));
	server.close();
	await disconnected;
	const whileDisconnected = sdk.client.callAsync('while-disconnected');
	sdk.connection.close();

	await expect(wait).rejects.toBeInstanceOf(ConnectionLostError);
	await expect(behindWait).rejects.toBeInstanceOf(ConnectionLostError);
	await expect(whileDisconnected).rejects.toBeInstanceOf(ConnectionLostError);
});

describe('resending calls lost with the connection', () => {
	const dropAndReconnect = async (sdk: DDPSDK) => {
		// Fake timers are used to avoid waiting for the reconnect timeout
		jest.useFakeTimers();
		server.close();
		WS.clean();
		server = new WS('ws://localhost:1234/websocket');
		const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
		await handleConnection(server, jest.advanceTimersByTimeAsync(2000), connected);
		jest.useRealTimers();
	};

	it('should send an unanswered call again after the reconnection and resolve with its result', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234', { inFlightMethods: 'resend' });
		await handleConnection(server, sdk.connection.connect());

		const call = sdk.client.callAsync('method', 'args');
		const sent = JSON.parse((await server.nextMessage) as string);

		await dropAndReconnect(sdk);

		const resent = JSON.parse((await server.nextMessage) as string);
		expect(resent).toEqual(sent);
		server.send(JSON.stringify({ msg: 'result', id: resent.id, result: 1 }));
		await expect(call).resolves.toBe(1);
		sdk.connection.close();
	});

	it('should resend a lost wait method before the calls queued behind it', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234', { inFlightMethods: 'resend' });
		await handleConnection(server, sdk.connection.connect());

		const wait = sdk.client.callAsyncWithOptions('wait', { wait: true });
		await server.nextMessage;
		const queued = sdk.client.callAsync('queued');

		await dropAndReconnect(sdk);

		const first = JSON.parse((await server.nextMessage) as string);
		expect(first.method).toBe('wait');
		server.send(JSON.stringify({ msg: 'result', id: first.id, result: 'w' }));
		await expect(wait).resolves.toBe('w');

		const second = JSON.parse((await server.nextMessage) as string);
		expect(second.method).toBe('queued');
		server.send(JSON.stringify({ msg: 'result', id: second.id, result: 'q' }));
		await expect(queued).resolves.toBe('q');
		sdk.connection.close();
	});

	it('should log in again before resending a lost wait method', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234', { inFlightMethods: 'resend' });
		await handleConnection(server, sdk.connection.connect());
		await handleMethod(
			server,
			'login',
			[{ resume: 'token' }],
			JSON.stringify({ id: 'uid', token: 'token', tokenExpires: { $date: 99999999 } }),
			sdk.account.loginWithToken('token'),
		);

		const wait = sdk.client.callAsyncWithOptions('wait', { wait: true });
		await server.nextMessage;

		await dropAndReconnect(sdk);

		const relogin = JSON.parse((await server.nextMessage) as string);
		expect(relogin).toMatchObject({ method: 'login', params: [{ resume: 'token' }] });
		server.send(
			JSON.stringify({ msg: 'result', id: relogin.id, result: { id: 'uid', token: 'token', tokenExpires: { $date: 99999999 } } }),
		);

		const resent = JSON.parse((await server.nextMessage) as string);
		expect(resent.method).toBe('wait');
		server.send(JSON.stringify({ msg: 'result', id: resent.id, result: 'w' }));
		await expect(wait).resolves.toBe('w');
		sdk.connection.close();
	});

	const login = async (sdk: DDPSDK) =>
		handleMethod(
			server,
			'login',
			[{ resume: 'token' }],
			JSON.stringify({ id: 'uid', token: 'token', tokenExpires: { $date: 99999999 } }),
			sdk.account.loginWithToken('token'),
		);

	const answer = (frame: { id: string }, result: unknown) => server.send(JSON.stringify({ msg: 'result', id: frame.id, result }));

	it('should hold calls made during the outage until the new login, behind the lost ones', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234', { inFlightMethods: 'resend' });
		await handleConnection(server, sdk.connection.connect());
		await login(sdk);

		const lost = sdk.client.callAsync('lost');
		await server.nextMessage;

		// Fake timers are used to avoid waiting for the reconnect timeout
		jest.useFakeTimers();
		const disconnected = new Promise((resolve) => sdk.connection.once('disconnected', () => resolve(undefined)));
		server.close();
		await disconnected;
		const duringOutage = sdk.client.callAsync('during-outage');
		WS.clean();
		server = new WS('ws://localhost:1234/websocket');
		const connected = new Promise((resolve) => sdk.connection.once('connected', () => resolve(undefined)));
		await handleConnection(server, jest.advanceTimersByTimeAsync(2000), connected);
		jest.useRealTimers();

		const relogin = JSON.parse((await server.nextMessage) as string);
		expect(relogin.method).toBe('login');
		answer(relogin, { id: 'uid', token: 'token', tokenExpires: { $date: 99999999 } });

		const first = JSON.parse((await server.nextMessage) as string);
		const second = JSON.parse((await server.nextMessage) as string);
		expect([first.method, second.method]).toEqual(['lost', 'during-outage']);
		answer(first, 1);
		answer(second, 2);
		await expect(lost).resolves.toBe(1);
		await expect(duringOutage).resolves.toBe(2);
		sdk.connection.close();
	});

	it('should not resend the SDK login lost with the connection', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234', { inFlightMethods: 'resend' });
		await handleConnection(server, sdk.connection.connect());
		await login(sdk);

		await dropAndReconnect(sdk);
		const lostRelogin = JSON.parse((await server.nextMessage) as string);
		expect(lostRelogin.method).toBe('login');

		await dropAndReconnect(sdk);
		const relogin = JSON.parse((await server.nextMessage) as string);
		expect(relogin.method).toBe('login');
		expect(relogin.id).not.toBe(lostRelogin.id);
		answer(relogin, { id: 'uid', token: 'token', tokenExpires: { $date: 99999999 } });

		const next = await Promise.race([server.nextMessage, new Promise((resolve) => setTimeout(() => resolve(undefined), 50))]);
		expect(next).toBeUndefined();
		expect(sdk.account.uid).toBe('uid');
		sdk.connection.close();
	});

	it('should still reject pending calls when the connection is closed', async () => {
		const sdk = DDPSDK.create('ws://localhost:1234', { inFlightMethods: 'resend' });
		await handleConnection(server, sdk.connection.connect());

		const call = sdk.client.callAsync('method');
		await server.nextMessage;
		sdk.connection.close();

		await expect(call).rejects.toBeInstanceOf(ConnectionLostError);
	});
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

		await handleConnection(server, jest.advanceTimersByTimeAsync(2000), reconnect, connecting, connected);

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
		await handleConnection(server, jest.advanceTimersByTimeAsync(2000), connected);
		jest.useRealTimers();

		const [result] = await handleMethod(server, 'queued', [], '1', queued);
		expect(result).toBe(1);

		const [result2] = await handleMethod(server, 'after', [], '2', sdk.client.callAsync('after'));
		expect(result2).toBe(2);

		sdk.connection.close();
	});
});
