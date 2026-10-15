import net from 'node:net';

import { Emitter } from '@rocket.chat/emitter';

import { resolveConfig } from '../../src/config';
import type { XMPPServerEventMap } from '../../src/events';
import type { Logger } from '../../src/logger';
import { S2SManager } from '../../src/s2s/S2SManager';
import { generateDialbackKey } from '../../src/s2s/dialback';
import type { XmppDnsResolver } from '../../src/s2s/dnsResolver';

jest.setTimeout(30000);

const STREAM_ERROR_WAIT_MS = 2000;

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const secretOf = (domain: string) => `secret-of-${domain}`;

/** A peer speaking raw XML to the server under test, so it can send what a real server never would. */
class RawPeer {
	private buffer = '';

	private constructor(private readonly socket: net.Socket) {
		socket.setEncoding('utf8');
		socket.on('data', (chunk: string) => {
			this.buffer += chunk;
		});
	}

	static async open(port: number, from: string, to: string): Promise<{ peer: RawPeer; streamId: string }> {
		const socket = net.connect(port, '127.0.0.1');
		await new Promise<void>((resolve, reject) => socket.once('connect', resolve).once('error', reject));
		const peer = new RawPeer(socket);
		peer.write(
			`<?xml version='1.0'?><stream:stream xmlns='jabber:server' xmlns:stream='http://etherx.jabber.org/streams' xmlns:db='jabber:server:dialback' from='${from}' to='${to}' version='1.0'>`,
		);
		const [, streamId] = await peer.waitFor(/<stream:stream[^>]*\sid=["']([^"']+)["']/);
		await peer.waitFor(/<\/stream:features>/);
		return { peer, streamId };
	}

	write(data: string): void {
		this.socket.write(data);
	}

	async waitFor(pattern: RegExp, timeoutMs = 10_000): Promise<RegExpMatchArray> {
		const deadline = Date.now() + timeoutMs;
		for (;;) {
			const match = this.buffer.match(pattern);
			if (match) {
				return match;
			}
			if (Date.now() > deadline) {
				throw new Error(`Timed out waiting for ${pattern}; received: ${this.buffer}`);
			}
			await new Promise((resolve) => setTimeout(resolve, 20));
		}
	}

	async streamError(): Promise<string> {
		const [, condition] = await this.waitFor(/<stream:error>\s*<([a-z-]+)/, STREAM_ERROR_WAIT_MS);
		return condition;
	}

	destroy(): void {
		this.socket.destroy();
	}
}

describe('Inbound stanza addressing (s2s-connectivity R6)', () => {
	const ports = new Map<string, number>();
	const loopbackResolver: XmppDnsResolver = async (domain) => {
		const port = ports.get(domain);
		if (!port) {
			throw new Error(`No test route for domain ${domain}`);
		}
		return [{ host: '127.0.0.1', port }];
	};

	const managers: S2SManager[] = [];
	const peers: RawPeer[] = [];

	const startServer = async (domain: string): Promise<void> => {
		const manager = new S2SManager({
			config: resolveConfig({
				domain,
				port: 0,
				bindAddress: '127.0.0.1',
				requireTls: false,
				dialbackSecret: secretOf(domain),
				logger: silentLogger,
			}),
			logger: silentLogger,
			resolver: loopbackResolver,
			events: new Emitter<XMPPServerEventMap>(),
			onStanza: () => undefined,
		});
		await manager.startListener();
		managers.push(manager);
		ports.set(domain, manager.listeningPort as number);
	};

	/** A stream to b.localhost on which a.localhost has authenticated by dialback, with a.localhost's real secret. */
	const authenticatedPeer = async (): Promise<RawPeer> => {
		const { peer, streamId } = await RawPeer.open(ports.get('b.localhost') as number, 'a.localhost', 'b.localhost');
		peers.push(peer);
		const key = generateDialbackKey(secretOf('a.localhost'), 'b.localhost', 'a.localhost', streamId);
		peer.write(`<db:result from='a.localhost' to='b.localhost'>${key}</db:result>`);
		await peer.waitFor(/<db:result[^>]*type=["']valid["']/);
		return peer;
	};

	beforeAll(async () => {
		await startServer('a.localhost');
		await startServer('b.localhost');
	});

	afterEach(() => {
		peers.splice(0).forEach((peer) => peer.destroy());
	});

	afterAll(async () => {
		await Promise.all(managers.map((manager) => manager.stopAll()));
	});

	it('closes the stream with not-authorized when a stanza arrives before any domain authenticated (R6)', async () => {
		const { peer } = await RawPeer.open(ports.get('b.localhost') as number, 'a.localhost', 'b.localhost');
		peers.push(peer);
		peer.write(`<message from='alice@a.localhost' to='bob@b.localhost'><body>x</body></message>`);
		expect(await peer.streamError()).toBe('not-authorized');
	});

	it('closes the stream with invalid-from for a from domain not authenticated on it (R6)', async () => {
		const peer = await authenticatedPeer();
		peer.write(`<message from='mallory@evil.localhost' to='bob@b.localhost'><body>x</body></message>`);
		expect(await peer.streamError()).toBe('invalid-from');
	});

	it('closes the stream with host-unknown for a to domain this server does not serve (R6)', async () => {
		const peer = await authenticatedPeer();
		peer.write(`<message from='alice@a.localhost' to='bob@elsewhere.localhost'><body>x</body></message>`);
		expect(await peer.streamError()).toBe('host-unknown');
	});

	it.each([
		['from', `<message to='bob@b.localhost'><body>x</body></message>`],
		['to', `<message from='alice@a.localhost'><body>x</body></message>`],
	])('closes the stream with improper-addressing for a stanza without %s (R6)', async (_, stanza) => {
		const peer = await authenticatedPeer();
		peer.write(stanza);
		expect(await peer.streamError()).toBe('improper-addressing');
	});
});
