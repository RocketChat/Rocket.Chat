import WS from 'jest-websocket-mock';

import { MinimalDDPClient } from '../src/MinimalDDPClient';
import { ConnectionImpl } from '../src/Connection';

let server: WS;
beforeEach(() => {
	server = new WS('ws://localhost:1234');
});

afterEach(() => {
	server.close();
	WS.clean();
});

it('should connect', async () => {
	const client = new MinimalDDPClient();
	const connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		return server.send('{"msg":"connected","session":"123"}');
	});

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await expect(connection.connect()).resolves.toBe(true);

	expect(connection.session).toBe('123');
	expect(connection.status).toBe('connected');
});

it('should handle a failing connection', async () => {
	const client = new MinimalDDPClient();
	const connection = new ConnectionImpl('ws://localhost:1234', WebSocket as any, client, { retryCount: 0, retryTime: 0 });

	const suggestedVersion = '1';

	const message = server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		return server.send(`{"msg":"failed","version":"${suggestedVersion}"}`);
	});

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await expect(connection.connect()).rejects.toBe(suggestedVersion);

	expect(connection.session).toBeUndefined();
	expect(connection.status).toBe('failed');
	await message;
});

it('should trigger a disconnect callback', async () => {
	const client = new MinimalDDPClient();
	const connection = ConnectionImpl.create('ws://localhost:1234', globalThis.WebSocket, client, { retryCount: 0, retryTime: 0 });
	const suggestedVersion = '1';
	const s = server.nextMessage.then((message) => {
		expect(message).toBe(`{"msg":"connect","version":"${suggestedVersion}","support":["1","pre2","pre1"]}`);
		return server.send('{"msg":"connected","session":"123"}');
	});
	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();
	const disconnectCallback = jest.fn();
	connection.on('connection', disconnectCallback);
	const connectionPromise = connection.connect();
	await s;
	await expect(connectionPromise).resolves.toBe(true);
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

	server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		return server.send('{"msg":"connected","session":"123"}');
	});

	expect(connection.status).toBe('idle');
	expect(connection.session).toBeUndefined();

	await expect(connection.connect()).resolves.toBe(true);

	expect(connection.session).toBe('123');
	expect(connection.status).toBe('connected');

	server.close();
	WS.clean();
	server = new WS('ws://localhost:1234');

	server.nextMessage.then((message) => {
		expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
		return server.send('{"msg":"connected","session":"123"}');
	});

	expect(connection.status).toBe('disconnected');

	await expect(new Promise((resolve) => connection.once('reconnecting', () => resolve(undefined)))).resolves.toBeUndefined();

	expect(connection.status).toBe('connecting');

	await expect(new Promise((resolve) => connection.once('connection', (data) => resolve(data)))).resolves.toBe('connected');

	expect(connection.status).toBe('connected');
});
