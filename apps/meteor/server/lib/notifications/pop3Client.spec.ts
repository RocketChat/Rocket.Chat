import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import net, { type AddressInfo } from 'node:net';
import path from 'node:path';
import tls from 'node:tls';

import POP3Client from '@rocket.chat/poplib';

const createServer = async () => {
	const server = net.createServer();
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

	return {
		server,
		port: (server.address() as AddressInfo).port,
	};
};

const closeServer = (server: net.Server) =>
	new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
const certificatePath = path.resolve(__dirname, '../../../../../ee/packages/xmpp-server/tests/fixtures/a.localhost.cert.pem');
const privateKeyPath = path.resolve(__dirname, '../../../../../ee/packages/xmpp-server/tests/fixtures/a.localhost.key.pem');

describe('POP3Client transport lifecycle', () => {
	it('closes an established TCP transport when destroyed', async () => {
		const { server, port } = await createServer();
		const connection = once(server, 'connection');
		const client = new POP3Client(port, '127.0.0.1');
		client.on('error', () => undefined);
		const [serverSocket] = (await connection) as [net.Socket];
		const closed = once(serverSocket, 'close');
		await new Promise<void>((resolve) => setImmediate(resolve));

		client.destroy();
		await closed;
		await closeServer(server);

		expect(client.getState()).toBe(0);
	});

	it('closes an established TLS transport when destroyed', async () => {
		const server = tls.createServer({
			cert: readFileSync(certificatePath),
			key: readFileSync(privateKeyPath),
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const connection = once(server, 'secureConnection');
		const client = new POP3Client((server.address() as AddressInfo).port, '127.0.0.1', { enabletls: true, ignoretlserrs: true });
		client.on('error', () => undefined);
		const [serverSocket] = (await connection) as [tls.TLSSocket];
		serverSocket.on('error', () => undefined);
		const closed = new Promise<void>((resolve) => serverSocket.once('close', () => resolve()));

		client.destroy();
		await closed;
		await closeServer(server);

		expect(client.getState()).toBe(0);
	});

	it('closes a TCP transport while its connection is still in progress', async () => {
		const { server, port } = await createServer();
		const client = new POP3Client(port, '127.0.0.1');
		client.on('error', () => undefined);
		const closed = once(client, 'close');

		client.destroy();
		await closed;
		await closeServer(server);

		expect(client.getState()).toBe(0);
	});

	it('resets its state when the remote socket closes', async () => {
		const { server, port } = await createServer();
		const connection = once(server, 'connection');
		const client = new POP3Client(port, '127.0.0.1');
		client.on('error', () => undefined);
		const invalidState = jest.fn();
		client.on('invalid-state', invalidState);
		const [serverSocket] = (await connection) as [net.Socket];
		const closed = once(client, 'close');

		client.setState(2);
		serverSocket.destroy();
		await closed;

		expect(client.getState()).toBe(0);
		expect(() => client.list()).not.toThrow();
		expect(invalidState).toHaveBeenCalledWith('list');

		await closeServer(server);
	});
});
