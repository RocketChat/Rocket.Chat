import { Emitter } from '@rocket.chat/emitter';

import { S2SManager } from './S2SManager';
import { resolveConfig } from '../config';
import { QueueOverflowError } from '../errors';
import type { XMPPServerEventMap } from '../events';
import type { Logger } from '../logger';
import { xml } from '../xml/build';

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const message = (n: number) => xml('message', { from: 'alice@a.localhost', to: 'bob@b.localhost', id: `m${n}` }, xml('body', {}, `${n}`));

describe('S2SManager', () => {
	let manager: S2SManager;

	beforeEach(() => {
		manager = new S2SManager({
			config: resolveConfig({ domain: 'a.localhost', requireTls: false, outboundQueueLimit: 2, logger: silentLogger }),
			logger: silentLogger,
			// Never resolves, so the route stays connecting and every send is queued
			resolver: () => new Promise(() => undefined),
			events: new Emitter<XMPPServerEventMap>(),
			onStanza: () => undefined,
		});
	});

	afterEach(async () => {
		await manager.stopAll();
	});

	it('rejects a send beyond the queue limit and keeps the stanzas already queued (R10)', async () => {
		const settled: string[] = [];
		const queued = [1, 2].map((n) =>
			manager.sendStanza(message(n)).then(
				() => settled.push(`m${n} sent`),
				() => settled.push(`m${n} rejected`),
			),
		);

		const overflow = manager.sendStanza(message(3)).catch((error: unknown) => error);
		await new Promise((resolve) => setImmediate(resolve));

		expect(settled).toEqual([]);
		await expect(overflow).resolves.toBeInstanceOf(QueueOverflowError);

		await manager.stopAll();
		await Promise.all(queued);
	});
});

describe('S2SManager reconnection', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('gives up after three failed connection attempts, rejecting the queue (R16)', async () => {
		jest.spyOn(Math, 'random').mockReturnValue(0);
		let attempts = 0;
		const events = new Emitter<XMPPServerEventMap>();
		const failed: XMPPServerEventMap['connection.failed'][] = [];
		events.on('connection.failed', (event) => failed.push(event));
		const manager = new S2SManager({
			config: resolveConfig({ domain: 'a.localhost', port: 0, bindAddress: '127.0.0.1', requireTls: false, logger: silentLogger }),
			logger: silentLogger,
			resolver: async () => {
				attempts += 1;
				throw new Error('unreachable');
			},
			events,
			onStanza: () => undefined,
		});

		await manager.startListener();

		try {
			await expect(manager.sendStanza(message(1))).rejects.toThrow();
		} finally {
			await manager.stopAll();
		}

		expect(attempts).toBe(3);
		expect(failed.map((event) => event.attempts)).toEqual([3]);
	});
});
