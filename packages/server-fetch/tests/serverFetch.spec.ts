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
	it('invokes onRedirect with the target URL on redirect', async () => {
		const target = await listen((_req, res) => res.end('redirected-content'));
		const { url } = await listenEndless(302, { location: target });

		const onRedirect = jest.fn();
		const response = await serverFetch(url, { ignoreSsrfValidation: true, onRedirect });

		expect(onRedirect).toHaveBeenCalledWith(expect.any(URL));
		expect(onRedirect.mock.calls[0][0].toString()).toBe(`${target}/`);
		expect(response.url).toBe(`${target}/`);
		await expect(response.text()).resolves.toBe('redirected-content');
	});

	it('stops and rejects when onRedirect throws an error', async () => {
		const target = await listen((_req, res) => res.end('blocked'));
		const { url, connectionClosed } = await listenEndless(302, { location: target });

		const onRedirect = jest.fn().mockImplementation(() => {
			throw new Error('host is ignored');
		});

		await expect(serverFetch(url, { ignoreSsrfValidation: true, onRedirect })).rejects.toThrow('host is ignored');
		expect(onRedirect).toHaveBeenCalled();
		await expect(connectionClosed).resolves.toBeUndefined();
	});
	it('throws error-too-many-redirects when follow is 0 and response is redirect', async () => {
		const target = await listen((_req, res) => res.end('ok'));
		const { url, connectionClosed } = await listenEndless(302, { location: target });

		await expect(serverFetch(url, { ignoreSsrfValidation: true, follow: 0 })).rejects.toThrow('error-too-many-redirects');
		await expect(connectionClosed).resolves.toBeUndefined();
	});

	it('preserves options.params in response.url', async () => {
		const target = await listen((req, res) => res.end(`query: ${req.url}`));
		const response = await serverFetch(target, { ignoreSsrfValidation: true, params: { foo: 'bar', baz: 'qux' } });

		expect(response.url).toBe(`${target}/?foo=bar&baz=qux`);
		await expect(response.text()).resolves.toBe('query: /?foo=bar&baz=qux');
	});

	it('clamps follow to MAX_REDIRECTS when large or infinite value is provided', async () => {
		let redirectLoopUrl = '';
		const { url } = await listenEndless(302, {
			get location() {
				return redirectLoopUrl;
			},
		});
		redirectLoopUrl = url;

		await expect(serverFetch(url, { ignoreSsrfValidation: true, follow: 100 })).rejects.toThrow('error-too-many-redirects');
		await expect(serverFetch(url, { ignoreSsrfValidation: true, follow: Infinity })).rejects.toThrow('error-too-many-redirects');
	});
});
