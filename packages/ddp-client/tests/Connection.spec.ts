import WS from 'jest-websocket-mock';

import { ClassMinimalDDPClient } from '../src/ClassMinimalDDPClient';
import { ConnectionImpl } from '../src/Connection';

describe('Connection', () => {
	let server: WS | null = null;

	beforeAll(() => {
		server = new WS('ws://localhost:1234');
	});

	it('should connect', async () => {
		const ws = new WebSocket('ws://localhost:1234');
		const client = new ClassMinimalDDPClient(ws.send.bind(ws));
		const connection = new ConnectionImpl(ws, client, { retryCount: 0, retryTime: 0 });

		await expect(server?.connected).resolves.toBe(true);
		await expect(connection.connect()).resolves.toBe(true);

		expect(connection.status).toBe('connected');
	});

	afterAll(() => {
		WS.clean();
		server = null;
	});
});
