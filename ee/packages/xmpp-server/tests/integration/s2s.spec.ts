import fs from 'node:fs';
import path from 'node:path';

import { Emitter } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import { resolveConfig } from '../../src/config';
import type { XMPPServerEventMap } from '../../src/events';
import type { Logger } from '../../src/logger';
import { S2SManager } from '../../src/s2s/S2SManager';
import type { XmppDnsResolver } from '../../src/s2s/dnsResolver';
import { xml } from '../../src/xml/build';

jest.setTimeout(30000);

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');

type TestServer = {
	manager: S2SManager;
	events: Emitter<XMPPServerEventMap>;
	received: Element[];
};

describe('S2S integration: two servers over localhost', () => {
	const ports = new Map<string, number>();

	const loopbackResolver: XmppDnsResolver = async (domain) => {
		const port = ports.get(domain);
		if (!port) {
			throw new Error(`No test route for domain ${domain}`);
		}
		return [{ host: '127.0.0.1', port }];
	};

	/** Starts a server for `domain`; `routable: false` leaves the domain's address pointing at the earlier server. */
	const startServer = async (domain: string, { routable = true } = {}): Promise<TestServer> => {
		const events = new Emitter<XMPPServerEventMap>();
		const received: Element[] = [];

		const manager = new S2SManager({
			config: resolveConfig({
				domain,
				port: 0,
				bindAddress: '127.0.0.1',
				tls: { cert: fixture(`${domain}.cert.pem`), key: fixture(`${domain}.key.pem`) },
				dialbackSecret: `secret-of-${domain}`,
				connectTimeoutMs: 5000,
				logger: silentLogger,
			}),
			logger: silentLogger,
			resolver: loopbackResolver,
			events,
			onStanza: (stanza) => {
				received.push(stanza);
			},
		});

		await manager.startListener();
		if (routable) {
			ports.set(domain, manager.listeningPort as number);
		}
		return { manager, events, received };
	};

	let serverA: TestServer;
	let serverB: TestServer;

	beforeAll(async () => {
		serverA = await startServer('a.localhost');
		serverB = await startServer('b.localhost');
	});

	afterAll(async () => {
		await serverA.manager.stopAll();
		await serverB.manager.stopAll();
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
					reject(new Error('Timed out waiting for condition'));
				}
			}, 25);
		});

	it('delivers a message A → B with STARTTLS + dialback (s2s-connectivity R3, R5, R14)', async () => {
		const established: string[] = [];
		serverB.events.on('connection.established', (e) => established.push(`${e.direction}:${e.domain}:${e.authMethod}:${e.tls}`));

		await serverA.manager.sendStanza(
			xml('message', { from: 'alice@a.localhost', to: 'bob@b.localhost', type: 'chat', id: 'm1' }, xml('body', {}, 'hello world')),
		);

		const message = await waitFor(() => serverB.received.find((el) => el.attrs.id === 'm1'));
		expect(message.getChildText('body')).toBe('hello world');
		expect(message.attrs.from).toBe('alice@a.localhost');

		// Self-signed fixtures cannot pass SASL EXTERNAL, so B authenticates a.localhost by dialback
		expect(established).toContain('inbound:a.localhost:dialback:true');
	});

	it('delivers in the reverse direction over its own connection (s2s-connectivity R9)', async () => {
		await serverB.manager.sendStanza(
			xml('message', { from: 'bob@b.localhost', to: 'alice@a.localhost', type: 'chat', id: 'm2' }, xml('body', {}, 'right back')),
		);

		const message = await waitFor(() => serverA.received.find((el) => el.attrs.id === 'm2'));
		expect(message.getChildText('body')).toBe('right back');
	});

	it('queues stanzas while the connection is being established and flushes in order (s2s-connectivity R10)', async () => {
		// A second a.localhost server has no route to b.localhost yet, so the first send has to connect
		const fresh = await startServer('a.localhost', { routable: false });
		const ids = ['q1', 'q2', 'q3'];
		try {
			const sends = ids.map((id) =>
				fresh.manager.sendStanza(xml('message', { from: 'alice@a.localhost', to: `bob@b.localhost`, id }, xml('body', {}, id))),
			);
			expect(fresh.manager.getConnectionStatus('b.localhost')).toBe('connecting');
			await Promise.all(sends);
			await waitFor(() => (ids.every((id) => serverB.received.some((el) => el.attrs.id === id)) ? true : undefined));
		} finally {
			await fresh.manager.stopAll();
		}

		const receivedIds = serverB.received.filter((el) => ids.includes(el.attrs.id)).map((el) => el.attrs.id);
		expect(receivedIds).toEqual(ids);
	});

	// Known defect: ../../docs/specs/s2s-connectivity.md#d2-stopping-the-server-drops-stanzas-not-yet-written-out
	it.skip('delivers every stanza already sent when the server stops (s2s-connectivity R18, D2)', async () => {
		const fresh = await startServer('a.localhost', { routable: false });
		const ids = ['s1', 's2', 's3'];
		await Promise.all(
			ids.map((id) =>
				fresh.manager.sendStanza(xml('message', { from: 'alice@a.localhost', to: `bob@b.localhost`, id }, xml('body', {}, id))),
			),
		);
		await fresh.manager.stopAll();

		await expect(waitFor(() => (ids.every((id) => serverB.received.some((el) => el.attrs.id === id)) ? true : undefined))).resolves.toBe(
			true,
		);
	});

	it('rejects stanzas addressed to domains that cannot be reached (s2s-connectivity R16)', async () => {
		await expect(
			serverA.manager.sendStanza(xml('message', { from: 'alice@a.localhost', to: 'bob@unreachable.localhost' }, xml('body', {}, 'x'))),
		).rejects.toThrow();
	}, 60000);

	it('rejects stanzas claiming a foreign origin domain (s2s-connectivity R15)', async () => {
		await expect(
			serverA.manager.sendStanza(xml('message', { from: 'mallory@evil.localhost', to: 'bob@b.localhost' }, xml('body', {}, 'x'))),
		).rejects.toThrow('not originated by the local domain');
	});
});
