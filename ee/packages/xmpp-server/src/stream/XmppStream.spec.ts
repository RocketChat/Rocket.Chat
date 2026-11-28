import net from 'node:net';

import { XmppStream } from './XmppStream';
import type { Logger } from '../logger';

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

describe('XmppStream.upgradeToTls', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it.each([
		['inbound', true],
		['outbound', false],
	])('rejects an %s upgrade whose TLS material cannot be loaded, and leaves nothing behind (s2s-connectivity R3)', async (_, isServer) => {
		const socket = new net.Socket();
		const stream = new XmppStream(socket, { logger: silentLogger });

		await expect(stream.upgradeToTls({ isServer, cert: 'not a certificate', key: 'not a key' })).rejects.toThrow();

		expect(socket.destroyed).toBe(true);
		expect(() => jest.advanceTimersByTime(60_000)).not.toThrow();
	});
});
