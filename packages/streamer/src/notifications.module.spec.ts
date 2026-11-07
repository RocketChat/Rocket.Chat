import { api, Authorization, MediaCall, Settings, VideoConf } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { NotificationsModule } from './notifications.module';
import { invalidate } from './publication-user-cache';
import { Streamer } from './streamer.module';
import type { IPublication } from './types';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Authorization: { canReadRoom: jest.fn() },
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

	describe('discussion message delivery', () => {
		const user = { _id: 'discussion-reader', username: 'charlie', roles: ['user'] } as IUser;
		const discussion = { _id: 'discussion-id', t: 'p', prid: 'parent-id' } as IRoom;

		beforeEach(() => {
			jest.mocked(Rooms.findOneById).mockReset().mockResolvedValue(discussion);
			jest.mocked(Users.findOneById).mockReset().mockResolvedValue(user);
			jest.mocked(Authorization.canReadRoom).mockReset().mockResolvedValue(false);
		});

		afterEach(() => invalidate(user._id));

		it('stops delivering to an existing subscriber after the discussion becomes private', async () => {
			const send = jest.fn();
			const subscription = {
				eventName: discussion._id,
				subscription: { userId: user._id, _session: { socket: { send } } } as unknown as IPublication,
			};
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;
			jest.mocked(Rooms.findOneById).mockResolvedValueOnce({ ...discussion, t: 'c' });
			jest.mocked(Authorization.canReadRoom).mockResolvedValueOnce(true);

			await stream.sendToManySubscriptions(new Set([subscription]), undefined, discussion._id, [], 'public-message');
			expect(send).toHaveBeenCalledWith('public-message');
			send.mockClear();

			await stream.sendToManySubscriptions(new Set([subscription]), undefined, discussion._id, [], 'private-message');
			expect(send).not.toHaveBeenCalled();
			expect(Authorization.canReadRoom).toHaveBeenCalledWith(discussion, user);
		});

		it('continues delivering to an authorized private discussion member', async () => {
			jest.mocked(Authorization.canReadRoom).mockResolvedValue(true);
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;

			expect(await stream.isEmitAllowed({ userId: user._id } as IPublication, discussion._id)).toBe(true);
			expect(Authorization.canReadRoom).toHaveBeenCalledWith(discussion, user);
		});

		it('checks private discussion access for an existing anonymous subscriber', async () => {
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;

			expect(await stream.isEmitAllowed({ userId: null } as IPublication, discussion._id)).toBe(false);
			expect(Authorization.canReadRoom).toHaveBeenCalledWith(discussion, undefined);
		});

		it('preserves delivery rules for rooms that are not discussions', async () => {
			jest.mocked(Rooms.findOneById).mockResolvedValue({ _id: 'room-id', t: 'p' } as IRoom);
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;

			expect(await stream.isEmitAllowed({ userId: user._id } as IPublication, 'room-id')).toBe(true);
			expect(Authorization.canReadRoom).not.toHaveBeenCalled();
		});

		it.each(['c', 'p'] as const)('looks up a regular %s room once for all recipients', async (t) => {
			jest.mocked(Rooms.findOneById).mockResolvedValue({ _id: 'room-id', t } as IRoom);
			const sends = Array.from({ length: 20 }, () => jest.fn());
			const subscriptions = new Set(
				sends.map((send) => ({
					eventName: 'room-id',
					subscription: { userId: user._id, _session: { socket: { send } } } as unknown as IPublication,
				})),
			);
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;

			await stream.sendToManySubscriptions(subscriptions, undefined, 'room-id', [], 'message');

			expect(Rooms.findOneById).toHaveBeenCalledTimes(1);
			expect(Authorization.canReadRoom).not.toHaveBeenCalled();
			for (const send of sends) {
				expect(send).toHaveBeenCalledWith('message');
			}
		});

		it('shares the discussion lookup while authorizing recipients independently', async () => {
			const allowedSend = jest.fn();
			const deniedSend = jest.fn();
			jest.mocked(Authorization.canReadRoom).mockImplementation(async (_room, reader) => reader?._id === user._id);
			const subscriptions = new Set(
				[
					[user._id, allowedSend],
					[null, deniedSend],
				].map(([userId, send]) => ({
					eventName: discussion._id,
					subscription: { userId, _session: { socket: { send } } } as unknown as IPublication,
				})),
			);
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;

			await stream.sendToManySubscriptions(subscriptions, undefined, discussion._id, [], 'message');

			expect(Rooms.findOneById).toHaveBeenCalledTimes(1);
			expect(Authorization.canReadRoom).toHaveBeenCalledTimes(2);
			expect(allowedSend).toHaveBeenCalledWith('message');
			expect(deniedSend).not.toHaveBeenCalled();
		});

		it('stops delivering public discussion messages after access is revoked', async () => {
			const publicDiscussion = { ...discussion, t: 'c' } as IRoom;
			jest.mocked(Rooms.findOneById).mockResolvedValue(publicDiscussion);
			jest.mocked(Authorization.canReadRoom).mockResolvedValueOnce(true).mockResolvedValue(false);
			const send = jest.fn();
			const subscriptions = new Set([
				{
					eventName: discussion._id,
					subscription: { userId: user._id, _session: { socket: { send } } } as unknown as IPublication,
				},
			]);
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;

			await stream.sendToManySubscriptions(subscriptions, undefined, discussion._id, [], 'before');
			expect(send).toHaveBeenCalledWith('before');
			send.mockClear();
			await stream.sendToManySubscriptions(subscriptions, undefined, discussion._id, [], 'after');

			expect(send).not.toHaveBeenCalled();
			expect(Rooms.findOneById).toHaveBeenCalledTimes(2);
			expect(Authorization.canReadRoom).toHaveBeenCalledWith(publicDiscussion, user);
		});

		it('denies delivery when the room no longer exists', async () => {
			jest.mocked(Rooms.findOneById).mockResolvedValue(null);
			const stream = notifications.streamRoomMessage as Streamer<'room-messages'>;

			expect(await stream.isEmitAllowed({ userId: user._id } as IPublication, discussion._id)).toBe(false);
			expect(Authorization.canReadRoom).not.toHaveBeenCalled();
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
