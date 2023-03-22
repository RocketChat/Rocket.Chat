import WS from 'jest-websocket-mock';
import { WebSocket as WebSocketImpl } from 'ws';

import { ClassMinimalDDPClient } from '../src/ClassMinimalDDPClient';
import { ConnectionImpl } from '../src/Connection';

describe('Connection', () => {
	let server: WS;
	beforeEach(() => {
		server = new WS('ws://localhost:1234');
	});

	afterEach(() => {
		server.close();
		WS.clean();
	});

	it('should connect', async () => {
		const ws = new WebSocketImpl('ws://localhost:1234');
		const client = new ClassMinimalDDPClient(ws.send.bind(ws));
		const connection = new ConnectionImpl(ws as unknown as WebSocket, client, { retryCount: 0, retryTime: 0 });

		server.nextMessage.then((message) => {
			expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
			server.send('{"msg":"connected","session":"123"}');
		});

		expect(connection.status).toBe('idle');
		expect(connection.session).toBeUndefined();

		await expect(connection.connect()).resolves.toBe(true);

		await expect(connection.session).toBe('123');
		await expect(connection.status).toBe('connected');

		// Close the connection
		// connection.close();
		// await expect(connection.status).toBe('closed');
	});

	it('should handle a failing connection', async () => {
		const ws = new WebSocketImpl('ws://localhost:1234');
		const client = new ClassMinimalDDPClient(ws.send.bind(ws));
		const connection = new ConnectionImpl(ws as unknown as WebSocket, client, { retryCount: 0, retryTime: 0 });

		const suggestedVersion = '1';

		server.nextMessage.then((message) => {
			expect(message).toBe('{"msg":"connect","version":"1","support":["1","pre2","pre1"]}');
			server.send(`{"msg":"failed","version":"${suggestedVersion}"}`);
		});

		expect(connection.status).toBe('idle');
		expect(connection.session).toBeUndefined();

		await expect(connection.connect()).rejects.toBe(suggestedVersion);

		expect(connection.session).toBeUndefined();
		expect(connection.status).toBe('failed');
	});
});
