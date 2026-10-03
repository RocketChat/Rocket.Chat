import net from 'node:net';

import { XMPPServer } from '../../src/XMPPServer';
import type { Logger } from '../../src/logger';
import type { XmppDnsResolver } from '../../src/s2s/dnsResolver';
import { XMPPServerService } from '../../src/service/XMPPServerService';

const settings = new Map<string, unknown>();
const findOneByUsername = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {
		onEvent = jest.fn();
	},
	License: { hasModule: async () => true },
	Settings: { get: async (key: string) => settings.get(key) },
	api: { broadcast: jest.fn() },
	Message: {},
	Room: {},
}));

jest.mock('@rocket.chat/models', () => ({
	Users: { findOneByUsername: (...args: unknown[]) => findOneByUsername(...args) },
	Rooms: { find: () => ({ toArray: async () => [] }) },
	Subscriptions: {},
	Messages: {},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: class {
		debug = jest.fn();

		info = jest.fn();

		warn = jest.fn();

		error = jest.fn();
	},
}));

jest.setTimeout(30000);

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const freePort = (): Promise<number> =>
	new Promise((resolve, reject) => {
		const probe = net.createServer();
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', () => {
			const { port } = probe.address() as net.AddressInfo;
			probe.close(() => resolve(port));
		});
	});

const waitFor = (check: () => boolean, timeoutMs = 15000): Promise<void> =>
	new Promise((resolve, reject) => {
		const started = Date.now();
		const timer = setInterval(() => {
			if (check()) {
				clearInterval(timer);
				resolve();
			} else if (Date.now() - started > timeoutMs) {
				clearInterval(timer);
				reject(new Error('Timed out'));
			}
		}, 25);
	});

describe('XMPPServerService handler observation', () => {
	const ports = new Map<string, number>();
	const resolver: XmppDnsResolver = async (domain) => [{ host: '127.0.0.1', port: ports.get(domain) as number }];
	const settled: { event: string; outcome: string }[] = [];
	const started: string[] = [];

	let service: XMPPServerService;
	let peer: XMPPServer;

	beforeAll(async () => {
		const servicePort = await freePort();
		ports.set('a.localhost', servicePort);
		settings.set('XMPP_Server_Enabled', true);
		settings.set('XMPP_Server_Domain', 'a.localhost');
		settings.set('XMPP_Server_Port', servicePort);

		service = new XMPPServerService({
			resolver,
			observeHandler: (event) => {
				started.push(event);
				return (outcome) => settled.push({ event, outcome });
			},
		});
		await service.started();
		if (!service.isRunning()) {
			throw new Error('The service did not start its XMPP listener');
		}

		peer = new XMPPServer(
			{ domain: 'b.localhost', port: 0, bindAddress: '127.0.0.1', requireTls: false, dialbackSecret: 'peer', logger: silentLogger },
			{ resolver },
		);
		await peer.start();
		ports.set('b.localhost', peer.getListeningPort() as number);
	});

	afterAll(async () => {
		await peer.stop();
		await service.stopped();
	});

	beforeEach(() => {
		started.length = 0;
		settled.length = 0;
		findOneByUsername.mockReset();
	});

	// Dialback only succeeds if the service reached the peer through the injected resolver
	it('reports a handled inbound message as ok', async () => {
		findOneByUsername.mockResolvedValue(null);

		await peer.sendChatMessage({ from: 'bob@b.localhost', to: 'alice@a.localhost', body: 'hi' });

		await waitFor(() => settled.length > 0);
		expect(started).toEqual(['message.received']);
		expect(settled).toEqual([{ event: 'message.received', outcome: 'ok' }]);
	});

	it('reports a handler that rejects as an error', async () => {
		findOneByUsername.mockRejectedValue(new Error('db down'));

		await peer.sendChatMessage({ from: 'bob@b.localhost', to: 'alice@a.localhost', body: 'hi' });

		await waitFor(() => settled.length > 0);
		expect(settled).toEqual([{ event: 'message.received', outcome: 'error' }]);
	});
});
