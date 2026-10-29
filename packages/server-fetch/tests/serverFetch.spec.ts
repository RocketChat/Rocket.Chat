import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Readable } from 'node:stream';

import { serverFetch } from '../src';

const servers: http.Server[] = [];

const listen = (handler: http.RequestListener) =>
	new Promise<string>((resolve) => {
		const server = http.createServer(handler);
		servers.push(server);
		server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`));
	});

const listenEndless = async (status: number, headers: http.OutgoingHttpHeaders = {}) => {
	const connectionClosed = Promise.withResolvers<void>();
	const url = await listen((req, res) => {
		req.socket.once('close', () => connectionClosed.resolve());
		res.writeHead(status, headers);
		const chunk = 'x'.repeat(64 * 1024);
		const write = () => {
			while (res.write(chunk));
		};
		res.on('drain', write);
		write();
	});
	return { url, connectionClosed: connectionClosed.promise };
};

afterEach(async () => {
	await Promise.all(
		servers.splice(0).map((server) => {
			server.closeAllConnections();
			return new Promise((resolve) => server.close(resolve));
		}),
	);
});

describe('serverFetch', () => {
	it('closes the connection when the response body is destroyed', async () => {
		const { url, connectionClosed } = await listenEndless(404);

		const response = await serverFetch(url, { ignoreSsrfValidation: true });
		(response.body as Readable).destroy();

		await expect(connectionClosed).resolves.toBeUndefined();
	});

	it('closes the connection of a redirect response it follows', async () => {
		const target = await listen((_req, res) => res.end('ok'));
		const { url, connectionClosed } = await listenEndless(302, { location: target });

		const response = await serverFetch(url, { ignoreSsrfValidation: true });

		await expect(response.text()).resolves.toBe('ok');
		await expect(connectionClosed).resolves.toBeUndefined();
	});

	it('closes the connection of a redirect response it cannot follow', async () => {
		const { url, connectionClosed } = await listenEndless(302);

		await expect(serverFetch(url, { ignoreSsrfValidation: true })).rejects.toThrow('redirect-response-location-header-missing');
		await expect(connectionClosed).resolves.toBeUndefined();
	});
});
