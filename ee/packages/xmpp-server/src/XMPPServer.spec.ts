import fs from 'node:fs';
import path from 'node:path';

import { XMPPServer } from './XMPPServer';
import type { Logger } from './logger';

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '..', 'tests', 'fixtures', name), 'utf8');

const makeServer = () =>
	new XMPPServer({
		domain: 'a.localhost',
		port: 0,
		bindAddress: '127.0.0.1',
		tls: { cert: fixture('a.localhost.cert.pem'), key: fixture('a.localhost.key.pem') },
		logger: silentLogger,
	});

describe('XMPPServer lifecycle', () => {
	it('derives the MUC domain from the configured subdomain', () => {
		const server = makeServer();
		expect(server.domain).toBe('a.localhost');
		expect(server.mucDomain).toBe('conference.a.localhost');
	});

	it('starts and stops, emitting lifecycle events', async () => {
		const server = makeServer();
		const events: string[] = [];
		server.on('server.started', () => events.push('started'));
		server.on('server.stopped', () => events.push('stopped'));

		expect(server.isRunning).toBe(false);
		await server.start();
		expect(server.isRunning).toBe(true);
		await server.stop();
		expect(server.isRunning).toBe(false);

		expect(events).toEqual(['started', 'stopped']);
	});

	it('is idempotent on repeated start/stop', async () => {
		const server = makeServer();
		await server.start();
		await server.start();
		await server.stop();
		await server.stop();
		expect(server.isRunning).toBe(false);
	});

	it('reports disconnected status for unknown domains', () => {
		const server = makeServer();
		expect(server.getConnectionStatus('remote.tld')).toBe('disconnected');
	});

	it('requires TLS material unless explicitly disabled', () => {
		// @ts-expect-error the guard is for callers the type cannot reach
		expect(() => new XMPPServer({ domain: 'x.localhost', logger: silentLogger })).toThrow(/TLS material is required/);
		expect(() => new XMPPServer({ domain: 'x.localhost', requireTls: false, logger: silentLogger })).not.toThrow();
	});
});

describe('XMPPServer remote rooms', () => {
	const join = { localJid: 'alice@a.localhost', roomJid: 'team@conference.remote.tld', nick: 'alice' };

	it('ends every remote room session when it stops, so a later start joins again', async () => {
		const server = makeServer();
		jest.spyOn(server as unknown as { send: () => Promise<void> }, 'send').mockResolvedValue();
		await server.start();
		await server.mucJoinRemoteRoom(join);
		expect(server.hasRemoteMucSession(join)).toBe(true);

		await server.stop();
		expect(server.hasRemoteMucSession(join)).toBe(false);

		await server.start();
		await server.mucJoinRemoteRoom(join);
		expect(server.hasRemoteMucSession(join)).toBe(true);
		await server.stop();
	});

	it('keeps no session when the join cannot be sent, so the next join tries again (remote-muc R5)', async () => {
		const server = makeServer();

		await expect(server.mucJoinRemoteRoom(join)).rejects.toThrow();
		expect(server.hasRemoteMucSession(join)).toBe(false);
		await expect(server.mucJoinRemoteRoom(join)).rejects.toThrow();
	});
});
