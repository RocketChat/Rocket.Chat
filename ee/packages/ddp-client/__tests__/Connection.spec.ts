import WS from 'jest-websocket-mock';

import { ConnectionImpl } from '../src/Connection';
import { MinimalDDPClient } from '../src/MinimalDDPClient';
import { handleConnection, handleConnectionAndRejects, handleMethod } from './helpers';

let server: WS;
beforeEach(() => {
	server = new WS('ws://localhost:1234/websocket');
});

afterEach(() => {
	server.close();
	WS.clean();
	jest.useRealTimers();
});

it('should connect', async () => {
	const client = new MinimalDDPClient();
	const connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();
	await handleConnection(server, connection.connect());

	expect(connection.session).toBe('session');
	expect(connection.status).toBe('connected');
});

it('should handle a failing connection', async () => {
	const client = new MinimalDDPClient();
	const connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await expect(handleConnectionAndRejects(server, connection.connect())).rejects.toBe('1');

	expect(connection.session).toBeUndefined();
	expect(connection.status).toBe('failed');
});

it('should trigger a disconnect callback', async () => {
	const client = new MinimalDDPClient();
	const connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();
	const disconnectCallback = jest.fn();
	connection.on('connection', disconnectCallback);

	await handleConnection(server, connection.connect());

	expect(disconnectCallback).toHaveBeenNthCalledWith(1, 'connecting');
	expect(disconnectCallback).toHaveBeenNthCalledWith(2, 'connected');
	expect(disconnectCallback).toBeCalledTimes(2);
	server.close();
	expect(disconnectCallback).toBeCalledTimes(3);
	expect(disconnectCallback).toHaveBeenNthCalledWith(3, 'disconnected');
	expect(connection.status).toBe('disconnected');
});

it('should handle the close method', async () => {
	const client = new MinimalDDPClient();

	const connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, {
		retryCount: 0,
		retryTime: 0,
	});

	server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		server.send('{"msg":"connected","session":"123"}');
	});

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await expect(connection.connect()).resolves.toBe(true);

	expect(connection.session).toBe('123');
	expect(connection.status).toBe('connected');

	connection.close();

	expect(connection.status).toBe('closed');
});

it('should handle reconnecting', async () => {
	const client = new MinimalDDPClient();
	const connection = ConnectionImpl.create('ws://localhost:1234', WebSocket, client, { retryCount: 1, retryTime: 100 });

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await handleConnection(server, connection.connect());

	expect(connection.session).toBe('session');
	expect(connection.status).toBe('connected');

	// Fake timers are used to avoid waiting for the reconnect timeout
	jest.useFakeTimers();

	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234/websocket');

	expect(connection.status).toBe('disconnected');

	await handleConnection(
		server,
		jest.advanceTimersByTimeAsync(200),
		new Promise((resolve) => connection.once('reconnecting', () => resolve(undefined))),
		new Promise((resolve) => connection.once('connection', (data) => resolve(data))),
	);

	expect(connection.status).toBe('connected');
	jest.useRealTimers();
});

it('should queue messages if the connection is not ready', async () => {
	const client = new MinimalDDPClient();
	const connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	await handleConnection(server, connection.connect());

	connection.close();

	expect(connection.status).toBe('closed');

	client.emit('send', { msg: 'method', method: 'method', params: ['arg1', 'arg2'], id: '1' });

	expect(connection.queue.size).toBe(1);

	await handleConnection(server, connection.reconnect());

	expect(connection.queue.size).toBe(0);

	await handleMethod(server, 'method', ['arg1', 'arg2'], '1');
});

it('should throw an error if a reconnect is called while a connection is in progress', async () => {
	const client = new MinimalDDPClient();
	const connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	await handleConnection(server, connection.connect());

	await expect(connection.reconnect()).rejects.toThrow('Connection in progress');
});

it('should throw an error if a connect is called while a connection is in progress', async () => {
	const client = new MinimalDDPClient();
	const connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });

	await handleConnection(server, connection.connect());

	await expect(connection.connect()).rejects.toThrow('Connection in progress');
});
