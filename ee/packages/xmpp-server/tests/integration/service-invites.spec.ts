import net from 'node:net';

import { Room } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { mockModel } from '@rocket.chat/models/testing';

import { XMPPServer } from '../../src/XMPPServer';
import type { Logger } from '../../src/logger';
import type { XmppDnsResolver } from '../../src/s2s/dnsResolver';
import { XMPPServerService } from '../../src/service/XMPPServerService';

const settings = new Map<string, unknown>();

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {
		onEvent = jest.fn();
	},
	License: { hasModule: async () => true },
	Settings: { get: async (key: string) => settings.get(key) },
	api: { broadcast: jest.fn() },
	Message: {},
	Room: { addUserToRoom: jest.fn(), create: jest.fn() },
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

describe('XMPPServerService: invitations', () => {
	const mockRoom = jest.mocked(Room);
	const roomJid = 'team@conference.b.localhost';
	const localUser = { _id: 'alice-id', username: 'alice' };
	const inviter = { _id: 'bob-id', username: 'bob@b.localhost' };
	let roomWithThatJid: Partial<IRoom> | null = null;
	const upsertXMPPUser = jest.fn(async () => inviter);

	beforeAll(() => {
		mockModel('Users', {
			findOneByUsername: async (username: string) => (username === localUser.username ? localUser : null),
			findOneById: async () => null,
			upsertXMPPUser,
		});
		mockModel('Rooms', {
			findByXMPPRole: () => ({ toArray: async () => [] }),
			findOneByXMPPMucJid: async () => roomWithThatJid,
			findOneById: async () => null,
		});
	});

	const ports = new Map<string, number>();
	const resolver: XmppDnsResolver = async (domain) => [
		{ host: '127.0.0.1', port: ports.get(domain.replace(/^conference\./, '')) as number },
	];
	const settled: { event: string; outcome: string }[] = [];
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
			observeHandler: (event) => (outcome) => settled.push({ event, outcome }),
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
		peer.mucCreateRoom({ roomId: 'team', public: false });
	});

	afterAll(async () => {
		await peer.stop();
		await service.stopped();
	});

	beforeEach(() => {
		settled.length = 0;
		mockRoom.addUserToRoom.mockReset();
		mockRoom.create.mockReset();
		upsertXMPPUser.mockClear();
	});

	const inviteAliceAndWait = async () => {
		peer.mucInvite({ roomId: 'team', inviteeJid: 'alice@a.localhost', inviterJid: inviter.username });
		await waitFor(() => settled.some(({ event }) => event === 'muc.inviteReceived'));
		expect(settled).toEqual([{ event: 'muc.inviteReceived', outcome: 'ok' }]);
	};

	it('adds the invitee to the room that mirrors the remote room (R1)', async () => {
		roomWithThatJid = {
			_id: 'mirror-id',
			xmppFederation: { version: 1, role: 'remote-muc', muc: roomJid, origin: 'conference.b.localhost' },
		};

		await inviteAliceAndWait();

		expect(mockRoom.addUserToRoom).toHaveBeenCalledWith('mirror-id', localUser, inviter);
	});

	// A hosted room keeps the JID it was created with, so one created under a former domain is not on ours
	it('never adds the invitee to a room this server hosts, whatever its JID (R14)', async () => {
		roomWithThatJid = { _id: 'hosted-id', xmppFederation: { version: 1, role: 'host-muc', muc: roomJid, origin: 'a.localhost' } };

		await inviteAliceAndWait();

		expect(mockRoom.addUserToRoom).not.toHaveBeenCalled();
		expect(mockRoom.create).not.toHaveBeenCalled();
		expect(upsertXMPPUser).not.toHaveBeenCalled();
	});
});
