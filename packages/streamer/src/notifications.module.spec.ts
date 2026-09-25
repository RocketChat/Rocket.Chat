import { api, MediaCall, Settings, VideoConf } from '@rocket.chat/core-services';
import { Subscriptions, Users } from '@rocket.chat/models';

import { NotificationsModule } from './notifications.module';
import { Streamer } from './streamer.module';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	VideoConf: { validateAction: jest.fn() },
	MediaCall: { processSerializedSignal: jest.fn() },
	Settings: { get: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	...jest.requireActual('@rocket.chat/models'),
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

	describe('user activity hook', () => {
		const writeRoom = (userId: string | null, eventName: string, ...args: unknown[]) =>
			TestStreamer.methods['stream-notify-room'].call({ userId, connection: {} }, eventName, ...args);

		beforeEach(() => {
			jest.mocked(Settings.get).mockResolvedValue(false);
			jest.mocked(Users.findOneById).mockResolvedValue({ username: 'alice' } as any);
		});

		it('reports an accepted user-activity write', async () => {
			const handler = jest.fn();
			notifications.onUserActivity(handler);

			await writeRoom('u1', 'room1/user-activity', 'alice', ['user-typing'], {});

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({ rid: 'room1', uid: 'u1', activities: ['user-typing'] });
		});

		it('does not report a write the stream rejects', async () => {
			const handler = jest.fn();
			notifications.onUserActivity(handler);

			await writeRoom('u1', 'room1/user-activity', 'mallory', ['user-typing'], {});

			expect(handler).not.toHaveBeenCalled();
		});

		it('stops reporting once the handler is removed', async () => {
			const handler = jest.fn();
			const off = notifications.onUserActivity(handler);
			off();

			await writeRoom('u1', 'room1/user-activity', 'alice', [], {});

			expect(handler).not.toHaveBeenCalled();
		});
	});
});
