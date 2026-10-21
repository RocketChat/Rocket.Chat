import { api, ServiceClass } from '@rocket.chat/core-services';

import { ListenersModule } from './listeners.module';
import { NotificationsModule } from './notifications.module';
import { Streamer } from './streamer.module';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

class TestStreamer extends Streamer<any> {
	registerPublication(): void {
		// no-op for unit test subclass
	}

	registerMethod(): void {
		// no-op for unit test subclass
	}

	changedPayload(): string {
		return 'payload';
	}
}

class TestService extends ServiceClass {
	protected name = 'test';
}

describe('ListenersModule', () => {
	let notifications: NotificationsModule;
	let service: TestService;

	const fire: TestService['emit'] = (...args) => service.emit(...args);

	beforeEach(() => {
		jest.spyOn(api, 'broadcast').mockResolvedValue();
		notifications = new NotificationsModule(TestStreamer as any, 'self');
		service = new TestService();
		new ListenersModule(service, notifications, { get: () => undefined });
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('video conference events', () => {
		it('delivers room.video-conference to this instance only', () => {
			const emit = jest.spyOn(notifications.streamRoom, '_emit');

			fire('room.video-conference', { rid: 'room1', callId: 'call1' });

			expect(emit).toHaveBeenCalledTimes(2);
			expect(emit).toHaveBeenCalledWith('room1/call1', [], undefined, false);
			expect(emit).toHaveBeenCalledWith('room1/videoconf', ['call1'], undefined, false);
		});

		it('delivers video-conference.updated to this instance only', () => {
			const emit = jest.spyOn(notifications.streamVideoConference, '_emit');

			fire('video-conference.updated', { callId: 'call1' });

			expect(emit).toHaveBeenCalledTimes(1);
			expect(emit).toHaveBeenCalledWith('call1/updated', [], undefined, false);
		});

		it('does not relay video conference events to other processes', () => {
			const broadcast = jest.mocked(api.broadcast);

			fire('room.video-conference', { rid: 'room1', callId: 'call1' });
			fire('video-conference.updated', { callId: 'call1' });

			expect(broadcast).not.toHaveBeenCalled();
		});
	});

	describe('stream relay', () => {
		it('delivers relayed stream events from other processes to local subscribers', () => {
			const emit = jest.spyOn(notifications.streamRoom, '_emit');

			fire('stream', { stream: 'notify-room', eventName: 'room1/user-activity', args: ['alice', ['user-typing']], origin: 'other' });

			expect(emit).toHaveBeenCalledWith('room1/user-activity', ['alice', ['user-typing']], undefined, false);
		});

		it('drops relayed stream events this process emitted itself', () => {
			const emit = jest.spyOn(notifications.streamRoom, '_emit');

			fire('stream', { stream: 'notify-room', eventName: 'room1/user-activity', args: [], origin: 'self' });

			expect(emit).not.toHaveBeenCalled();
		});
	});

	describe('room messages', () => {
		const message = { _id: 'm1', rid: 'room1', msg: 'public copy' };
		const copy = { _id: 'm1', rid: 'room1', msg: 'alice copy' };

		const roomEmit = () => {
			jest
				.spyOn(notifications.streamRoomMessage, 'changedPayload')
				.mockImplementation((_collection, _id, fields) => JSON.stringify(fields));
			return jest.spyOn(notifications.streamRoomMessage, '_emit').mockReturnValue(true);
		};

		const deliveredTo = (emit: jest.SpyInstance, eventName: string, userId: string) => {
			const call = emit.mock.calls.find(([name]) => name === eventName);
			const transform = call?.[4];
			const result = transform?.(notifications.streamRoomMessage, { eventName, subscription: { userId } }, eventName, call?.[1], {});
			return result ? JSON.parse(result).args[0].msg : result;
		};

		it('sends the same payload to every subscriber of an unrestricted message', () => {
			roomEmit();
			const shared = jest.spyOn(notifications.streamRoomMessage, 'emitWithoutBroadcast').mockReturnValue(true);

			fire('watch.messages', { message } as any);

			expect(shared).toHaveBeenCalledWith('room1', message);
		});

		it('sends nothing to subscribers outside the readers', () => {
			const emit = roomEmit();

			fire('watch.messages', { message, readers: ['alice'] } as any);

			expect(deliveredTo(emit, 'room1', 'alice')).toBe('public copy');
			expect(deliveredTo(emit, 'room1', 'bob')).toBe(false);
			expect(deliveredTo(emit, '__my_messages__', 'bob')).toBe(false);
		});

		it('sends each reader their own copy', () => {
			const emit = roomEmit();

			fire('watch.messages', { message, variants: [{ readers: ['alice'], message: copy }] } as any);

			expect(deliveredTo(emit, 'room1', 'alice')).toBe('alice copy');
			expect(deliveredTo(emit, 'room1', 'bob')).toBe('public copy');
			expect(deliveredTo(emit, '__my_messages__', 'alice')).toBe('alice copy');
		});
	});
});
