import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import tls from 'node:tls';

import { Emitter } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import { resolveConfig } from '../../src/config';
import type { XMPPServerEventMap } from '../../src/events';
import type { Logger } from '../../src/logger';
import { S2SManager } from '../../src/s2s/S2SManager';
import { generateDialbackKey } from '../../src/s2s/dialback';
import type { XmppDnsResolver } from '../../src/s2s/dnsResolver';
import { xml } from '../../src/xml/build';

jest.setTimeout(30000);

const STREAM_ERROR_WAIT_MS = 2000;
const AUTH_TIMEOUT_MS = 1000;

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');

const secretOf = (domain: string) => `secret-of-${domain}`;

async function waitUntil(condition: () => boolean, timeoutMs = 5000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (!condition()) {
		if (Date.now() > deadline) {
			throw new Error('Timed out');
		}
		await new Promise((resolve) => setTimeout(resolve, 20));
	}
}

/** A peer speaking raw XML to the server under test, so it can send what a real server never would. */
class RawPeer {
	private buffer = '';

	private constructor(private socket: net.Socket) {
		this.listen(socket);
	}

	private listen(socket: net.Socket): void {
		socket.setEncoding('utf8');
		socket.on('data', (chunk: string) => {
			this.buffer += chunk;
		});
	}

	/** A connected peer that has sent nothing yet. */
	static async connect(port: number): Promise<RawPeer> {
		const socket = net.connect(port, '127.0.0.1');
		socket.setNoDelay(true);
		await new Promise<void>((resolve, reject) => socket.once('connect', resolve).once('error', reject));
		return new RawPeer(socket);
	}

	/** The next connection the server under test opens to `server`. */
	static accept(server: net.Server): Promise<RawPeer> {
		return new Promise((resolve) => server.once('connection', (socket: net.Socket) => resolve(new RawPeer(socket))));
	}

	static async open(port: number, from: string, to: string): Promise<{ peer: RawPeer; streamId: string }> {
		const peer = await RawPeer.connect(port);
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

	/** Takes the server side of a TLS handshake on this connection, after `<proceed/>`. */
	async acceptTls(options: { cert: string; key: string }): Promise<void> {
		this.socket.removeAllListeners('data');
		const secure = new tls.TLSSocket(this.socket, { isServer: true, ...options });
		await new Promise<void>((resolve, reject) => secure.once('secure', resolve).once('error', reject));
		this.socket = secure;
		this.listen(secure);
	}

	/** Forgets what was received so far, so a pattern matches only what arrives next. */
	clear(): void {
		this.buffer = '';
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

	/** The condition of the stream error the server sent, once it has also closed the stream. */
	async streamError(): Promise<string> {
		const [, condition] = await this.waitFor(/<stream:error>\s*<([a-z-]+)/, STREAM_ERROR_WAIT_MS);
		await this.waitFor(/<\/stream:error>\s*<\/stream:stream>/, STREAM_ERROR_WAIT_MS);
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
	const dispatched: Element[] = [];

	const startServer = async (domain: string): Promise<void> => {
		const manager = new S2SManager({
			config: resolveConfig({
				domain,
				port: 0,
				bindAddress: '127.0.0.1',
				requireTls: false,
				dialbackSecret: secretOf(domain),
				inboundAuthTimeoutMs: AUTH_TIMEOUT_MS,
				logger: silentLogger,
			}),
			logger: silentLogger,
			resolver: loopbackResolver,
			events: new Emitter<XMPPServerEventMap>(),
			onStanza: (stanza) => {
				dispatched.push(stanza);
			},
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
		dispatched.length = 0;
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

	it('dispatches a stanza with both domains in their normalized spelling (addressing R4)', async () => {
		const peer = await authenticatedPeer();
		peer.write(`<message from='alice@A.Localhost./phone' to='Bob@B.LOCALHOST'><body>x</body></message>`);
		await waitUntil(() => dispatched.length > 0);
		expect(dispatched[0].attrs).toMatchObject({ from: 'alice@a.localhost/phone', to: 'Bob@b.localhost' });
	});

	it('closes a connection that authenticates no domain in time with connection-timeout (R17)', async () => {
		const { peer } = await RawPeer.open(ports.get('b.localhost') as number, 'a.localhost', 'b.localhost');
		peers.push(peer);
		const [, condition] = await peer.waitFor(/<stream:error>\s*<([a-z-]+)/, AUTH_TIMEOUT_MS * 3);
		expect(condition).toBe('connection-timeout');
	});

	it('keeps an authenticated connection open past the deadline (R17)', async () => {
		const peer = await authenticatedPeer();
		await new Promise((resolve) => setTimeout(resolve, AUTH_TIMEOUT_MS * 1.5));
		peer.write(`<message from='alice@a.localhost' to='bob@b.localhost'><body>x</body></message>`);
		await waitUntil(() => dispatched.length > 0);
		expect(dispatched[0].attrs.from).toBe('alice@a.localhost');
	});

	// Known defect: ../../docs/specs/s2s-connectivity.md#d1-an-xml-declaration-split-across-reads-closes-the-stream
	it.skip('opens a stream whose XML declaration arrives split across reads (R7, D1)', async () => {
		const peer = await RawPeer.connect(ports.get('b.localhost') as number);
		peers.push(peer);
		peer.write('<?xm');
		await new Promise((resolve) => setTimeout(resolve, 100));
		peer.write(
			"l version='1.0'?><stream:stream xmlns='jabber:server' xmlns:stream='http://etherx.jabber.org/streams' xmlns:db='jabber:server:dialback' from='a.localhost' to='b.localhost' version='1.0'>",
		);
		const [features] = await peer.waitFor(/<stream:features>[\s\S]*<\/stream:features>/);
		expect(features).not.toContain('stream:error');
	});
});

describe('Negotiation elements an outbound stream holds (s2s-connectivity R19)', () => {
	const LIMIT = 32;
	const OVERFLOW_WARNING = 'Too many unrequested negotiation elements';

	const ports = new Map<string, number>();
	const resolver: XmppDnsResolver = async (domain) => {
		const port = ports.get(domain);
		if (!port) {
			throw new Error(`No test route for domain ${domain}`);
		}
		return [{ host: '127.0.0.1', port }];
	};

	const warnings: string[] = [];
	const recordingLogger: Logger = {
		...silentLogger,
		warn: (_obj, msg) => {
			if (msg) {
				warnings.push(msg);
			}
		},
		child: () => recordingLogger,
	};

	const events = new Emitter<XMPPServerEventMap>();
	const peers: RawPeer[] = [];
	let manager: S2SManager;
	let hostileServer: net.Server;
	let hostilePort: number;

	/** Elements in the dialback namespace that no step of ours asked for. */
	const unrequested = (count: number) => '<db:result/>'.repeat(count);

	/** What the hostile server says when b.localhost connects to it: a header and empty features, so dialback follows. */
	const hostileHeader = (id: string) =>
		`<?xml version='1.0'?><stream:stream xmlns='jabber:server' xmlns:stream='http://etherx.jabber.org/streams' xmlns:db='jabber:server:dialback' from='evil.localhost' to='b.localhost' id='${id}' version='1.0'><stream:features/>`;

	/** A peer claims evil.localhost on b.localhost; resolves once b.localhost asked the hostile server to verify the key. */
	const claimHostileDomain = async () => {
		const verifyConnection = RawPeer.accept(hostileServer);
		const { peer } = await RawPeer.open(ports.get('b.localhost') as number, 'evil.localhost', 'b.localhost');
		peers.push(peer);
		peer.write(`<db:result from='evil.localhost' to='b.localhost'>${'0'.repeat(64)}</db:result>`);

		const authoritative = await verifyConnection;
		peers.push(authoritative);
		await authoritative.waitFor(/<stream:stream[^>]*>/);
		authoritative.write(hostileHeader('verify'));
		const [, id] = await authoritative.waitFor(/<db:verify[^>]*\sid=["']([^"']+)["']/);
		const validAnswer = `<db:verify from='evil.localhost' to='b.localhost' id='${id}' type='valid'/>`;
		return { peer, authoritative, validAnswer };
	};

	/** The type of the db:result b.localhost echoed to the claiming peer. */
	const verdictFor = async (peer: RawPeer) => (await peer.waitFor(/<db:result[^>]*type=["'](\w+)["']/))[1];

	beforeAll(async () => {
		hostileServer = net.createServer();
		await new Promise<void>((resolve) => hostileServer.listen(0, '127.0.0.1', resolve));
		hostilePort = (hostileServer.address() as net.AddressInfo).port;

		manager = new S2SManager({
			config: resolveConfig({
				domain: 'b.localhost',
				port: 0,
				bindAddress: '127.0.0.1',
				requireTls: false,
				tls: { cert: fixture('b.localhost.cert.pem'), key: fixture('b.localhost.key.pem') },
				dialbackSecret: secretOf('b.localhost'),
				logger: recordingLogger,
			}),
			logger: recordingLogger,
			resolver,
			events,
			onStanza: () => undefined,
		});
		await manager.startListener();
		ports.set('b.localhost', manager.listeningPort as number);
	});

	beforeEach(() => {
		ports.set('evil.localhost', hostilePort);
	});

	afterEach(() => {
		peers.splice(0).forEach((peer) => peer.destroy());
		warnings.length = 0;
	});

	afterAll(async () => {
		await manager.stopAll();
		hostileServer.close();
	});

	it('completes a verification with as many unrequested elements held as the limit allows', async () => {
		const { peer, authoritative, validAnswer } = await claimHostileDomain();
		authoritative.write(unrequested(LIMIT));
		authoritative.write(validAnswer);
		expect(await verdictFor(peer)).toBe('valid');
	});

	it('closes a verification stream with policy-violation on the first element past the limit, and gives the error verdict', async () => {
		const { peer, authoritative } = await claimHostileDomain();
		authoritative.write(unrequested(LIMIT + 1));
		expect(await authoritative.streamError()).toBe('policy-violation');
		expect(await verdictFor(peer)).toBe('error');
	});

	it('does not count elements outside the stream, TLS, SASL and dialback namespaces', async () => {
		const { peer, authoritative, validAnswer } = await claimHostileDomain();
		authoritative.write('<message/>'.repeat(LIMIT * 3));
		authoritative.write(validAnswer);
		expect(await verdictFor(peer)).toBe('valid');
	});

	it('gives the error verdict when the limit is crossed in the same read as a valid answer', async () => {
		const { peer, authoritative, validAnswer } = await claimHostileDomain();
		authoritative.write(validAnswer + unrequested(LIMIT + 1));
		expect(await verdictFor(peer)).toBe('error');
	});

	it('stops handling elements once the limit closed the stream', async () => {
		const { authoritative } = await claimHostileDomain();
		authoritative.write(unrequested(LIMIT * 30));
		expect(await authoritative.streamError()).toBe('policy-violation');
		expect(warnings.filter((warning) => warning === OVERFLOW_WARNING)).toHaveLength(1);
	});

	/** Sends a message to evil.localhost and resolves with the connection b.localhost opens for it, its header already received. */
	const outboundToHostile = async (): Promise<RawPeer> => {
		const connection = RawPeer.accept(hostileServer);
		manager
			.sendStanza(xml('message', { from: 'alice@b.localhost', to: 'mallory@evil.localhost' }, xml('body', {}, 'x')))
			.catch(() => undefined);
		const remote = await connection;
		peers.push(remote);
		await remote.waitFor(/<stream:stream[^>]*>/);
		return remote;
	};

	it('does not report a connection whose peer crosses the limit right after accepting dialback', async () => {
		const established: string[] = [];
		const off = events.on('connection.established', ({ domain, direction }) => established.push(`${direction}:${domain}`));

		try {
			const remote = await outboundToHostile();
			remote.write(hostileHeader('outbound'));
			await remote.waitFor(/<db:result[^>]*>[^<]+<\/db:result>/);
			// Later attempts find no route, so the queued message is rejected instead of reconnecting to a server nobody answers on
			ports.delete('evil.localhost');
			remote.write(`<db:result from='evil.localhost' to='b.localhost' type='valid'/>${unrequested(LIMIT + 1)}`);

			expect(await remote.streamError()).toBe('policy-violation');
			await new Promise((resolve) => setTimeout(resolve, 200));
			expect(established).not.toContain('outbound:evil.localhost');
		} finally {
			off();
		}
	});

	it('does not report a connection whose peer crosses the limit right after accepting SASL EXTERNAL', async () => {
		const established: string[] = [];
		const off = events.on('connection.established', ({ domain, direction }) => established.push(`${direction}:${domain}`));
		const streamHeader = (id: string, features: string) =>
			`<stream:stream xmlns='jabber:server' xmlns:stream='http://etherx.jabber.org/streams' xmlns:db='jabber:server:dialback' from='evil.localhost' to='b.localhost' id='${id}' version='1.0'><stream:features>${features}</stream:features>`;

		try {
			const remote = await outboundToHostile();
			remote.write(`<?xml version='1.0'?>${streamHeader('plain', "<starttls xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>")}`);
			await remote.waitFor(/<starttls/);
			remote.write("<proceed xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>");
			await remote.acceptTls({ cert: fixture('a.localhost.cert.pem'), key: fixture('a.localhost.key.pem') });

			await remote.waitFor(/<stream:stream[^>]*>/);
			remote.write(
				streamHeader('secure', "<mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><mechanism>EXTERNAL</mechanism></mechanisms>"),
			);
			await remote.waitFor(/<auth[^>]*mechanism=["']EXTERNAL["']/);
			remote.clear();
			remote.write("<success xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>");

			await remote.waitFor(/<stream:stream[^>]*>/);
			ports.delete('evil.localhost');
			// The features follow the header in a later read, so they answer a step that is already waiting
			remote.write(streamHeader('authenticated', '').replace('<stream:features></stream:features>', ''));
			await new Promise((resolve) => setTimeout(resolve, 100));
			remote.write(`<stream:features/>${unrequested(LIMIT + 1)}`);

			expect(await remote.streamError()).toBe('policy-violation');
			await new Promise((resolve) => setTimeout(resolve, 200));
			expect(established).not.toContain('outbound:evil.localhost');
		} finally {
			off();
		}
	});
});
