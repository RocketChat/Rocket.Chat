import { MediaCall, VideoConf } from '@rocket.chat/core-services';
import { Subscriptions } from '@rocket.chat/models';

import { NotificationsModule } from './notifications.module';
import { Streamer, StreamerCentral } from './streamer.module';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	VideoConf: { validateAction: jest.fn() },
	MediaCall: { processSerializedSignal: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	...jest.requireActual('@rocket.chat/models'),
	Subscriptions: {
		countByRoomIdAndUserId: jest.fn(),
		findByRoomIdAndNotUserId: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

class TestStreamer extends Streamer<any> {
	registerPublication(): void {
		// noop
	}

	registerMethod(): void {
		// noop
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
		notifications = new NotificationsModule(TestStreamer as any);
		notifications.configure();
	});

	afterEach(() => {
		jest.restoreAllMocks();
		Object.keys(StreamerCentral.instances).forEach((name) => delete StreamerCentral.instances[name]);
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
});
