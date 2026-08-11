import fs from 'node:fs';
import path from 'node:path';

import { XMPPServer } from '../../src/XMPPServer';
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

/**
 * Exercises the MUC protocol over real S2S: server A hosts a room, and a user on
 * server B joins it, then messages flow both ways. No external peer required.
 */
describe('MUC integration: hosted room joined across servers', () => {
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
		// The MUC service domain resolves to the same host as the server domain
		ports.set(server.mucDomain, server.getListeningPort() as number);
		return server;
	};

	let hostServer: XMPPServer;
	let remoteServer: XMPPServer;

	beforeAll(async () => {
		hostServer = await startServer('a.localhost');
		remoteServer = await startServer('b.localhost');
	});

	afterAll(async () => {
		await hostServer.stop();
		await remoteServer.stop();
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

	// Regression: only the user who accepted the invite held a session, so every other local
	// member of a mirrored room was silently unable to speak.
	it('gives every local user of a remote room their own session', async () => {
		hostServer.mucCreateRoom({ roomId: 'crowd', public: true });

		const roomJid = `crowd@${hostServer.mucDomain}`;
		const hostSideJoins: string[] = [];
		const hostMessages: string[] = [];
		hostServer.on('muc.occupantJoined', (e) => hostSideJoins.push(e.nick));
		hostServer.on('muc.messageReceived', (e) => hostMessages.push(`${e.fromNick}:${e.body}`));

		await remoteServer.mucJoinRemoteRoom({ localJid: 'carol@b.localhost', roomJid, nick: 'carol' });
		await remoteServer.mucJoinRemoteRoom({ localJid: 'dave@b.localhost', roomJid, nick: 'dave' });
		await waitFor(() => (hostSideJoins.includes('carol') && hostSideJoins.includes('dave') ? true : undefined));

		await remoteServer.mucSendToRemoteRoom({ localJid: 'dave@b.localhost', roomJid, body: 'from dave', id: 'g2' });
		expect(await waitFor(() => hostMessages.find((m) => m === 'dave:from dave'))).toBe('dave:from dave');

		// A user with no session must fail loudly instead of dropping the message
		await expect(remoteServer.mucSendToRemoteRoom({ localJid: 'erin@b.localhost', roomJid, body: 'lost' })).rejects.toThrow(/No session/);
	});

	it('invites a remote user into a hosted room and lets them accept', async () => {
		hostServer.mucCreateRoom({ roomId: 'invited', public: false });
		hostServer.mucAddLocalOccupant({
			roomId: 'invited',
			localJid: 'diego@a.localhost',
			nick: 'diego',
			role: 'moderator',
		});

		const roomJid = `invited@${hostServer.mucDomain}`;
		const localAlice = 'alice@b.localhost';
		const invites: { roomJid: string; fromJid: string; toLocalJid: string }[] = [];
		const hostSideJoins: string[] = [];

		remoteServer.on('muc.inviteReceived', (e) => invites.push(e));
		hostServer.on('muc.occupantJoined', (e) => hostSideJoins.push(e.nick));

		hostServer.mucInvite({ roomId: 'invited', inviteeJid: localAlice, inviterJid: 'diego@a.localhost', reason: 'join us' });

		const invite = await waitFor(() => invites.find((i) => i.roomJid === roomJid));
		expect(invite).toMatchObject({ toLocalJid: localAlice, fromJid: 'diego@a.localhost' });

		// Accepting the invite is a plain join of the advertised room
		await remoteServer.mucJoinRemoteRoom({ localJid: localAlice, roomJid: invite.roomJid, nick: 'alice' });
		await waitFor(() => (hostSideJoins.includes('alice') ? true : undefined));

		// The roster the newcomer receives includes the local (virtual) member who invited her
		expect(hostServer.listMucOccupants('invited')?.map((o) => o.nick)).toEqual(expect.arrayContaining(['diego', 'alice']));
	});

	it('lets a remote user join a hosted room and exchange groupchat', async () => {
		hostServer.mucCreateRoom({ roomId: 'team', public: true });

		const roomJid = `team@${hostServer.mucDomain}`;
		const localBob = 'bob@b.localhost';

		const joined: string[] = [];
		const hostSideJoins: string[] = [];
		const remoteMessages: string[] = [];
		const hostMessages: string[] = [];

		remoteServer.on('muc.remoteJoined', (e) => joined.push(e.roomJid));
		remoteServer.on('muc.remoteMessage', (e) => remoteMessages.push(`${e.fromNick}:${e.body}`));
		hostServer.on('muc.occupantJoined', (e) => hostSideJoins.push(e.nick));
		hostServer.on('muc.messageReceived', (e) => hostMessages.push(`${e.fromNick}:${e.body}`));

		await remoteServer.mucJoinRemoteRoom({ localJid: localBob, roomJid, nick: 'bob' });

		// Host sees the occupant, and the remote side resolves its own join on status 110
		await waitFor(() => (hostSideJoins.includes('bob') ? true : undefined));
		await waitFor(() => (joined.includes(roomJid) ? true : undefined));

		// A message the host broadcasts reaches the remote occupant
		hostServer.mucBroadcastMessage({ roomId: 'team', fromNick: 'system', body: 'welcome' });
		const received = await waitFor(() => remoteMessages.find((m) => m.endsWith(':welcome')));
		expect(received).toBe('system:welcome');

		// A message the remote occupant sends is reflected and surfaced on the host
		await remoteServer.mucSendToRemoteRoom({ localJid: localBob, roomJid, body: 'hello all', id: 'g1' });
		const hostSaw = await waitFor(() => hostMessages.find((m) => m === 'bob:hello all'));
		expect(hostSaw).toBe('bob:hello all');
	});
});
