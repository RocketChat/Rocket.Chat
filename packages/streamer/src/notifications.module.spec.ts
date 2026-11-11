import { api, Authorization, MediaCall, Settings, VideoConf } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { NotificationsModule } from './notifications.module';
import { invalidate } from './publication-user-cache';
import { Streamer } from './streamer.module';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Authorization: { canAccessRoom: jest.fn() },
	VideoConf: { validateAction: jest.fn() },
	MediaCall: { processSerializedSignal: jest.fn() },
	Settings: { get: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	...jest.requireActual('@rocket.chat/models'),
	Rooms: { findOneById: jest.fn() },
	Subscriptions: {
		countByRoomIdAndUserId: jest.fn(),
		findByRoomIdAndNotUserId: jest.fn(),
	},
	Users: {
		findOneById: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

class TestStreamer extends Streamer<any> {
	static methods: Record<string, (this: unknown, eventName: string, ...args: unknown[]) => Promise<void>> = {};

	registerPublication(): void {
		// noop
	}

	registerMethod(methods: typeof TestStreamer.methods): void {
		Object.assign(TestStreamer.methods, methods);
	}

	changedPayload(): string {
		return 'payload';
	}
}

const validateAction = jest.mocked(VideoConf.validateAction);
const processSerializedSignal = jest.mocked(MediaCall.processSerializedSignal);
const countByRoomIdAndUserId = jest.mocked(Subscriptions.countByRoomIdAndUserId);
const findByRoomIdAndNotUserId = jest.mocked(Subscriptions.findByRoomIdAndNotUserId);

describe('NotificationsModule', () => {
	let notifications: NotificationsModule;

	beforeEach(() => {
		jest.spyOn(api, 'broadcast').mockResolvedValue();
		notifications = new NotificationsModule(TestStreamer as any, 'self');
		notifications.configure();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('room-data delivery', () => {
		const userId = 'room-data-preview-user';

		afterEach(() => {
			invalidate(userId);
		});

		it('shares a room lookup per emission while checking each recipient separately', async () => {
			const secondUserId = 'room-data-second-user';
			const firstUser = { _id: userId, roles: [] };
			const secondUser = { _id: secondUserId, roles: [] };
			const publicRoom = { _id: 'shared-preview-room', t: 'c' };
			const privateRoom = { ...publicRoom, t: 'p' };
			const firstSend = jest.fn();
			const secondSend = jest.fn();

			const makePublication = (id: string, send: typeof firstSend) => ({
				userId: id,
				_session: { userId: id, socket: { send } },
				_isDeactivated: () => false,
				onStop: jest.fn(),
				ready: jest.fn(),
			});

			invalidate(userId);
			invalidate(secondUserId);

			const findUser = jest.mocked(Users.findOneById);
			findUser.mockReset();
			findUser.mockImplementation(async (id) => (id === userId ? firstUser : secondUser) as any);

			const findRoom = jest.mocked(Rooms.findOneById);
			findRoom.mockReset();
			findRoom.mockResolvedValue(publicRoom as any);

			const canAccess = jest.mocked(Authorization.canAccessRoom);
			canAccess.mockReset();
			canAccess.mockResolvedValue(true);

			const stream = notifications.streamRoomData as unknown as Streamer<'room-data'>;

			try {
				await stream._publish(makePublication(userId, firstSend) as any, publicRoom._id, false);
				await stream._publish(makePublication(secondUserId, secondSend) as any, publicRoom._id, false);

				expect(stream.subscriptions.size).toBe(2);

				findRoom.mockClear();
				canAccess.mockClear();
				canAccess.mockImplementation(async (room, user) => room?.t === 'c' && user?._id === userId);

				const delivery = jest.spyOn(stream, 'sendToManySubscriptions');

				stream.emitWithoutBroadcast(publicRoom._id, publicRoom as any);
				await delivery.mock.results[0].value;

				expect(findRoom).toHaveBeenCalledTimes(1);
				expect(findRoom).toHaveBeenCalledWith(publicRoom._id);
				expect(canAccess).toHaveBeenCalledTimes(2);
				expect(canAccess).toHaveBeenCalledWith(publicRoom, firstUser);
				expect(canAccess).toHaveBeenCalledWith(publicRoom, secondUser);
				expect(firstSend).toHaveBeenCalledTimes(1);
				expect(secondSend).not.toHaveBeenCalled();

				findRoom.mockClear();
				canAccess.mockClear();
				firstSend.mockClear();
				secondSend.mockClear();
				delivery.mockClear();
				findRoom.mockResolvedValue(privateRoom as any);

				// Reuse the old payload: authorization must use a fresh database lookup.
				stream.emitWithoutBroadcast(publicRoom._id, publicRoom as any);
				await delivery.mock.results[0].value;

				expect(findRoom).toHaveBeenCalledTimes(1);
				expect(canAccess).toHaveBeenCalledTimes(2);
				expect(canAccess).toHaveBeenCalledWith(privateRoom, firstUser);
				expect(canAccess).toHaveBeenCalledWith(privateRoom, secondUser);
				expect(firstSend).not.toHaveBeenCalled();
				expect(secondSend).not.toHaveBeenCalled();
			} finally {
				invalidate(userId);
				invalidate(secondUserId);
			}
		});

		it('logs room lookup errors and blocks delivery', async () => {
			const user = { _id: userId, roles: [] };
			const room = { _id: 'preview-room', t: 'c' };
			const send = jest.fn();
			const publication = {
				userId,
				_session: { userId, socket: { send } },
				_isDeactivated: () => false,
				onStop: jest.fn(),
				ready: jest.fn(),
			};

			invalidate(userId);
			jest.mocked(Users.findOneById).mockResolvedValue(user as any);

			const findRoom = jest.mocked(Rooms.findOneById);
			findRoom.mockReset();
			findRoom.mockResolvedValue(room as any);

			const canAccess = jest.mocked(Authorization.canAccessRoom);
			canAccess.mockReset();
			canAccess.mockResolvedValue(true);

			const stream = notifications.streamRoomData as unknown as Streamer<'room-data'>;
			await stream._publish(publication as any, room._id);

			const logError = jest.mocked(new Logger('NotificationsModule').error);
			logError.mockClear();
			canAccess.mockClear();

			const error = new Error('Room lookup failed');
			findRoom.mockRejectedValueOnce(error);

			const delivery = jest.spyOn(stream, 'sendToManySubscriptions');
			stream.emitWithoutBroadcast(room._id, room as any);
			await delivery.mock.results[0].value;

			expect(send).not.toHaveBeenCalled();
			expect(canAccess).not.toHaveBeenCalled();
			expect(logError).toHaveBeenCalledWith({
				msg: 'Failed to check room-data access',
				roomId: room._id,
				err: error,
			});
		});

		it('stops delivering updates when a public room becomes inaccessible', async () => {
			const user = { _id: userId, roles: [] };
			const publicRoom = { _id: 'preview-room', t: 'c' };
			const privateRoom = { _id: 'preview-room', t: 'p' };
			const send = jest.fn();
			const publication = {
				userId,
				_session: { userId, socket: { send } },
				_isDeactivated: () => false,
				onStop: jest.fn(),
				ready: jest.fn(),
			};

			invalidate(userId);
			jest.mocked(Users.findOneById).mockResolvedValue(user as any);

			const findRoom = jest.mocked(Rooms.findOneById);
			findRoom.mockReset();
			findRoom.mockResolvedValue(publicRoom as any);

			const canAccess = jest.mocked(Authorization.canAccessRoom);
			canAccess.mockReset();
			canAccess.mockImplementation(async (room) => room?.t === 'c');

			const stream = notifications.streamRoomData as unknown as Streamer<'room-data'>;
			await stream._publish(publication as any, publicRoom._id);
			expect(publication.ready).toHaveBeenCalledTimes(1);

			const delivery = jest.spyOn(stream, 'sendToManySubscriptions');

			stream.emitWithoutBroadcast(publicRoom._id, publicRoom as any);
			await delivery.mock.results[0].value;
			expect(send).toHaveBeenCalledTimes(1);

			send.mockClear();
			delivery.mockClear();
			findRoom.mockClear();
			canAccess.mockClear();
			findRoom.mockResolvedValue(privateRoom as any);

			stream.emitWithoutBroadcast(privateRoom._id, privateRoom as any);
			await delivery.mock.results[0].value;

			expect(findRoom).toHaveBeenCalledWith(privateRoom._id);
			expect(canAccess).toHaveBeenCalledWith(privateRoom, user);
			expect(send).not.toHaveBeenCalled();
			expect(stream.subscriptions.size).toBe(1);
		});
	});

	describe('notify-user allowWrite', () => {
		// `isWriteAllowed` is public on the concrete Streamer class but not on the IStreamer
		// interface that `streamUser` is typed as, so cast to reach it.
		const writeAllowed = (eventName: string, ...args: unknown[]) =>
			(notifications.streamUser as unknown as Streamer<'notify-user'>).isWriteAllowed({ userId: 'userId' } as any, eventName, args);

		beforeEach(() => {
			validateAction.mockReset();
			validateAction.mockResolvedValue(true);
			processSerializedSignal.mockReset();
			processSerializedSignal.mockResolvedValue(undefined);
			countByRoomIdAndUserId.mockReset();
			findByRoomIdAndNotUserId.mockReset();
		});

		['force_logout', 'notification', 'message', 'uiInteraction', 'subscriptions-changed', 'webdav', 'banners'].forEach((event) => {
			it(`should deny a logged-in client writing "${event}" to another user's stream`, async () => {
				expect(await writeAllowed(`victim/${event}`, { foo: 'bar' })).toBe(false);
			});
		});

		it("should deny writes even to the client's own stream", async () => {
			expect(await writeAllowed(`userId/force_logout`, undefined)).toBe(false);
		});

		it('should accept "video-conference" and delegate authorization to VideoConf.validateAction', async () => {
			const result = await writeAllowed(`userId/video-conference`, {
				action: 'call-start',
				params: { callId: '123', uid: '456', rid: '789' },
			});

			expect(result).toBe(true);
			expect(validateAction).toHaveBeenCalledTimes(1);
			expect(validateAction).toHaveBeenCalledWith('call-start', 'userId', { callId: '123', uid: '456', rid: '789' });
		});

		it('should process "media-calls" signals server-side and never broadcast them', async () => {
			const signal = '{"type":"offer"}';
			const result = await writeAllowed(`userId/media-calls`, signal);

			expect(result).toBe(false);
			expect(processSerializedSignal).toHaveBeenCalledTimes(1);
			expect(processSerializedSignal).toHaveBeenCalledWith('userId', signal);
		});
	});

	describe('notify-room-users allowWrite', () => {
		const writeAllowed = (eventName: string, ...args: unknown[]) =>
			(notifications.streamRoomUsers as unknown as Streamer<'notify-room-users'>).isWriteAllowed(
				{ userId: 'attacker' } as any,
				eventName,
				args,
			);

		beforeEach(() => {
			countByRoomIdAndUserId.mockReset();
			countByRoomIdAndUserId.mockResolvedValue(1); // attacker is subscribed to the room
			findByRoomIdAndNotUserId.mockReset();
			findByRoomIdAndNotUserId.mockReturnValue({ toArray: async () => [{ u: { _id: 'victim' } }] } as any);
		});

		['force_logout', 'notification', 'message', 'uiInteraction', 'subscriptions-changed', 'webdav', 'banners'].forEach((event) => {
			it(`should deny and not relay an arbitrary "${event}" event to other room members`, async () => {
				const emitSpy = jest.spyOn(notifications.streamUser, 'emit');

				const result = await writeAllowed(`room1/${event}`, { foo: 'bar' });

				expect(result).toBe(false);
				expect(findByRoomIdAndNotUserId).not.toHaveBeenCalled();
				expect(emitSpy).not.toHaveBeenCalled();
			});
		});

		it('should not relay anything for a user not subscribed to the room', async () => {
			countByRoomIdAndUserId.mockResolvedValue(0);
			const emitSpy = jest.spyOn(notifications.streamUser, 'emit');

			const result = await writeAllowed('room1/video-conference', {
				action: 'call-start',
				params: { callId: '123', uid: 'victim', rid: 'room1' },
			});

			expect(result).toBe(false);
			expect(findByRoomIdAndNotUserId).not.toHaveBeenCalled();
			expect(emitSpy).not.toHaveBeenCalled();
		});

		['video-conference', 'userData'].forEach((event) => {
			it(`should relay "${event}" event to other room members`, async () => {
				const emitSpy = jest.spyOn(notifications.streamUser, 'emit');

				const result = await writeAllowed(`room1/${event}`, { foo: 'bar' });

				expect(result).toBe(false);
				expect(findByRoomIdAndNotUserId).toHaveBeenCalled();
				expect(emitSpy).toHaveBeenCalled();
			});
		});
	});

	describe('stream relay', () => {
		it('relays a broadcasting emit to the other processes, tagged with this origin', () => {
			const broadcast = jest.mocked(api.broadcast);

			notifications.streamCannedResponses.emit('canned-responses', { type: 'removed', _id: 'c1' });

			expect(broadcast).toHaveBeenCalledTimes(1);
			expect(broadcast).toHaveBeenCalledWith('stream', {
				stream: 'canned-responses',
				eventName: 'canned-responses',
				args: [{ type: 'removed', _id: 'c1' }],
				origin: 'self',
			});
		});

		it('relays emits on the presence stream too', () => {
			const broadcast = jest.mocked(api.broadcast);

			notifications.streamPresence.emit('uid1', ['alice', 1] as any);

			expect(broadcast).toHaveBeenCalledWith('stream', expect.objectContaining({ stream: 'user-presence', eventName: 'uid1' }));
		});

		it('does not relay an emit meant for this instance only', () => {
			const broadcast = jest.mocked(api.broadcast);

			notifications.notifyRoomInThisInstance('room1', 'user-activity', 'alice', []);

			expect(broadcast).not.toHaveBeenCalled();
		});

		it('delivers relayed events without relaying them again', () => {
			const broadcast = jest.mocked(api.broadcast);
			const emit = jest.spyOn(notifications.streamRoom, '_emit');

			notifications.deliverRelayed({ stream: 'notify-room', eventName: 'room1/user-activity', args: ['alice', []], origin: 'other' });

			expect(emit).toHaveBeenCalledWith('room1/user-activity', ['alice', []], undefined, false);
			expect(broadcast).not.toHaveBeenCalled();
		});

		it('ignores relayed events for a stream this process does not host', () => {
			expect(() => notifications.deliverRelayed({ stream: 'no-such-stream', eventName: 'x', args: [], origin: 'other' })).not.toThrow();
		});
	});

	describe('user activity', () => {
		const writeRoom = (userId: string | null, eventName: string, ...args: unknown[]) =>
			TestStreamer.methods['stream-notify-room'].call({ userId, connection: {} }, eventName, ...args);

		let emitToOne: jest.SpyInstance;

		beforeEach(() => {
			jest.mocked(Settings.get).mockResolvedValue(false);
			jest.mocked(Users.findOneById).mockResolvedValue({ username: 'alice' } as any);
			emitToOne = jest.spyOn(api, 'emitToOne').mockResolvedValue();
		});

		it('reports an accepted user-activity write to one instance of each listening service', async () => {
			await writeRoom('u1', 'room1/user-activity', 'alice', ['user-typing'], {});

			expect(emitToOne).toHaveBeenCalledTimes(1);
			expect(emitToOne).toHaveBeenCalledWith('room.user-activity', { rid: 'room1', uid: 'u1', activities: ['user-typing'] });
		});

		it('does not report a write the stream rejects', async () => {
			await writeRoom('u1', 'room1/user-activity', 'mallory', ['user-typing'], {});

			expect(emitToOne).not.toHaveBeenCalled();
		});

		it('does not report activity relayed from another process', () => {
			notifications.deliverRelayed({
				stream: 'notify-room',
				eventName: 'room1/user-activity',
				args: ['alice', ['user-typing']],
				origin: 'other',
			});

			expect(emitToOne).not.toHaveBeenCalled();
		});
	});
});
