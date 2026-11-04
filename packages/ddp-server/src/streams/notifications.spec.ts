import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { invalidatePublicationUserCache, NotificationsModule } from '@rocket.chat/streamer';
import WebSocket from 'ws';

import { createStreamAdapter } from './StreamAdapter';
import type { IPacket } from '../IPacket';
import { Server } from '../Server';
import { makeSession, sentPackets } from '../__tests__/helpers';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	api: { broadcast: jest.fn().mockResolvedValue(undefined) },
	Authorization: { canReadRoom: jest.fn().mockResolvedValue(true) },
}));

jest.mock('@rocket.chat/models', () => ({
	Rooms: { findOneById: jest.fn() },
	Subscriptions: { find: jest.fn() },
	Users: { findOneById: jest.fn() },
}));

const findSubscriptions = jest.mocked(Subscriptions.find);
const findRoom = jest.mocked(Rooms.findOneById);
const findUser = jest.mocked(Users.findOneById);

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

// Lets every continuation of an already settled promise run.
const settle = () => new Promise((resolve) => setImmediate(resolve));

const listenerCount = (stream: unknown, event: string) => (stream as { listenerCount(event: string): number }).listenerCount(event);

function subscribePacket(id: string, name: string, eventName: string): IPacket {
	return { msg: 'sub', id, name, params: [eventName, false], method: '', version: '1', support: ['1'] };
}

function closeSession(session: ReturnType<typeof makeSession>) {
	session.ws.readyState = WebSocket.CLOSED;
	session.emit('close');
}

function holdRoomsLookup(rooms: string[]) {
	const lookup = deferred<{ rid: string }[]>();
	findSubscriptions.mockReturnValue({ toArray: () => lookup.promise } as any);
	return () => lookup.resolve(rooms.map((rid) => ({ rid })));
}

describe('Stream subscriptions served by the DDP server', () => {
	let server: Server;
	let notifications: NotificationsModule;

	beforeEach(() => {
		jest.clearAllMocks();
		findUser.mockResolvedValue({ _id: 'user1', roles: ['user'] } as any);
		server = new Server();
		notifications = new NotificationsModule(createStreamAdapter(server), 'self');
		notifications.configure();
	});

	afterEach(() => {
		invalidatePublicationUserCache('user1');
	});

	describe('rooms-changed on notify-user', () => {
		const roomsChanged = (id = 'sub1') => subscribePacket(id, 'stream-notify-user', 'user1/rooms-changed');

		it('follows the user rooms while subscribed and stops following them on unsubscribe', async () => {
			const session = makeSession();
			findSubscriptions.mockReturnValue({ toArray: async () => [{ rid: 'r1' }] } as any);

			await server.subscribe(session, roomsChanged());
			await settle();

			expect(sentPackets(session)).toEqual([{ msg: 'ready', subs: ['sub1'] }]);
			expect(listenerCount(notifications.streamUser, 'user1')).toBe(1);
			expect(listenerCount(notifications.streamUser, 'r1')).toBe(1);

			session.subscriptions.get('sub1')?.stop();

			expect(sentPackets(session)).toEqual([
				{ msg: 'ready', subs: ['sub1'] },
				{ msg: 'nosub', id: 'sub1' },
			]);
			expect(listenerCount(notifications.streamUser, 'user1')).toBe(0);
			expect(listenerCount(notifications.streamUser, 'r1')).toBe(0);
		});

		it('stops following the user rooms when the session closes', async () => {
			const session = makeSession();
			findSubscriptions.mockReturnValue({ toArray: async () => [{ rid: 'r1' }] } as any);

			await server.subscribe(session, roomsChanged());
			await settle();
			closeSession(session);

			expect(listenerCount(notifications.streamUser, 'user1')).toBe(0);
			expect(listenerCount(notifications.streamUser, 'r1')).toBe(0);
		});

		it('leaves no listener behind when the session closes while the user rooms are being looked up', async () => {
			const session = makeSession();
			const resolveRooms = holdRoomsLookup(['r1']);

			await server.subscribe(session, roomsChanged());
			closeSession(session);
			resolveRooms();
			await settle();

			expect(listenerCount(notifications.streamUser, 'user1')).toBe(0);
			expect(listenerCount(notifications.streamUser, 'r1')).toBe(0);
		});

		it('does not accumulate listeners across reconnects that each close during the lookup', async () => {
			for (let i = 0; i < 3; i++) {
				const session = makeSession();
				const resolveRooms = holdRoomsLookup(['r1']);

				await server.subscribe(session, roomsChanged());
				closeSession(session);
				resolveRooms();
				await settle();

				expect(listenerCount(notifications.streamUser, 'user1')).toBe(0);
				expect(listenerCount(notifications.streamUser, 'r1')).toBe(0);
			}
		});

		it('leaves no listener on any of the user rooms', async () => {
			const session = makeSession();
			const resolveRooms = holdRoomsLookup(['r1', 'r2', 'r3']);

			await server.subscribe(session, roomsChanged());
			closeSession(session);
			resolveRooms();
			await settle();

			for (const rid of ['user1', 'r1', 'r2', 'r3']) {
				expect(listenerCount(notifications.streamUser, rid)).toBe(0);
			}
		});

		it('neither writes nor queries for the session after it closed during the lookup', async () => {
			const session = makeSession();
			const resolveRooms = holdRoomsLookup(['r1']);

			await server.subscribe(session, roomsChanged());
			closeSession(session);
			resolveRooms();
			await settle();
			session.send.mockClear();

			notifications.streamUser.__emit('r1', 'updated', { _id: 'r1' });
			notifications.streamUser.__emit('user1', 'inserted', { rid: 'r2' });
			await settle();

			expect(session.send).not.toHaveBeenCalled();
			expect(findRoom).not.toHaveBeenCalled();
		});
	});

	describe('room-messages', () => {
		it('neither adds nor answers a subscription whose session closed while its room was being looked up', async () => {
			const session = makeSession();
			const room = deferred<any>();
			findRoom.mockReturnValue(room.promise);

			const subscribing = server.subscribe(session, subscribePacket('sub1', 'stream-room-messages', 'r1'));
			closeSession(session);
			room.resolve({ _id: 'r1', t: 'c' });
			await subscribing;
			await settle();

			expect(session.send).not.toHaveBeenCalled();
			expect(notifications.streamRoomMessage.subscriptions.size).toBe(0);
			expect(listenerCount(notifications.streamRoomMessage, 'user1')).toBe(0);
		});
	});
});
