import fs from 'node:fs';
import path from 'node:path';

import { XMPPServer } from '../../src/XMPPServer';
import type { IncomingChatMessage } from '../../src/events';
import type { Logger } from '../../src/logger';
import type { XmppDnsResolver } from '../../src/s2s/dnsResolver';

jest.setTimeout(30000);

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');

describe('Routing integration: message + presence over S2S', () => {
	const ports = new Map<string, number>();
	const resolver: XmppDnsResolver = async (domain) => [{ host: '127.0.0.1', port: ports.get(domain) as number }];

	const startServer = async (domain: string): Promise<XMPPServer> => {
		const server = new XMPPServer(
			{
				domain,
				port: 0,
				bindAddress: '127.0.0.1',
				tls: { cert: fixture(`${domain}.cert.pem`), key: fixture(`${domain}.key.pem`) },
				dialbackSecret: `secret-of-${domain}`,
				logger: silentLogger,
			},
			{ resolver },
		);
		await server.start();
		ports.set(domain, server.getListeningPort() as number);
		return server;
	};

	let serverA: XMPPServer;
	let serverB: XMPPServer;

	beforeAll(async () => {
		serverA = await startServer('a.localhost');
		serverB = await startServer('b.localhost');
	});

	afterAll(async () => {
		await serverA.stop();
		await serverB.stop();
	});

	const waitFor = <T>(check: () => T | undefined, timeoutMs = 15000): Promise<T> =>
		new Promise((resolve, reject) => {
			const started = Date.now();
			const timer = setInterval(() => {
				const value = check();
				if (value !== undefined) {
					clearInterval(timer);
					resolve(value);
				} else if (Date.now() - started > timeoutMs) {
					clearInterval(timer);
					reject(new Error('Timed out'));
				}
			}, 25);
		});

	it('delivers sendChatMessage as a message.received event on the peer', async () => {
		const received: IncomingChatMessage[] = [];
		serverB.on('message.received', (msg) => received.push(msg));

		await serverA.sendChatMessage({ from: 'alice@a.localhost', to: 'bob@b.localhost', body: 'hey bob', id: 'r1' });

		const message = await waitFor(() => received.find((m) => m.id === 'r1'));
		expect(message.body).toBe('hey bob');
		expect(message.from).toBe('alice@a.localhost');
	});

	it('delivers presence as a presence.received event', async () => {
		const statuses: string[] = [];
		serverB.on('presence.received', (p) => statuses.push(`${p.availability}:${p.show ?? ''}`));

		await serverA.sendPresence({ from: 'alice@a.localhost', to: 'bob@b.localhost', availability: 'available', show: 'away' });

		await waitFor(() => (statuses.includes('available:away') ? true : undefined));
		expect(statuses).toContain('available:away');
	});

	it('surfaces a subscription request', async () => {
		const requests: { from: string; to: string }[] = [];
		serverB.on('presence.subscriptionRequest', (r) => requests.push(r));

		await serverA.sendSubscription({ from: 'alice@a.localhost', to: 'bob@b.localhost', type: 'subscribe' });

		const request = await waitFor(() => requests.find((r) => r.from === 'alice@a.localhost'));
		expect(request.to).toBe('bob@b.localhost');
	});
});
