import type { IServiceClass } from '@rocket.chat/core-services';

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

const createService = () => {
	const handlers = new Map<string, (...args: any[]) => unknown>();

	const service = {
		onEvent: jest.fn((event: string, handler: (...args: any[]) => unknown) => handlers.set(event, handler)),
		onSettingChanged: jest.fn(),
	} as unknown as IServiceClass;

	const fire = (event: string, ...args: unknown[]) => {
		const handler = handlers.get(event);
		if (!handler) {
			throw new Error(`no handler for ${event}`);
		}
		return handler(...args);
	};

	return { service, fire };
};

describe('ListenersModule', () => {
	let notifications: NotificationsModule;
	let fire: ReturnType<typeof createService>['fire'];

	beforeEach(() => {
		notifications = new NotificationsModule(TestStreamer as any);
		const created = createService();
		fire = created.fire;
		new ListenersModule(created.service, notifications, { get: () => undefined });
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('video conference events', () => {
		it('delivers room.video-conference to this instance only', () => {
			const emit = jest.spyOn(notifications.streamRoom, '_emit');

			fire('room.video-conference', { rid: 'room1', callId: 'call1' });

			expect(emit).toHaveBeenCalledWith('room1/call1', [], undefined, false);
			expect(emit).toHaveBeenCalledWith('room1/videoconf', ['call1'], undefined, false);
			expect(emit).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), true);
		});

		it('delivers video-conference.updated to this instance only', () => {
			const emit = jest.spyOn(notifications.streamVideoConference, '_emit');

			fire('video-conference.updated', { callId: 'call1' });

			expect(emit).toHaveBeenCalledTimes(1);
			expect(emit).toHaveBeenCalledWith('call1/updated', [], undefined, false);
		});
	});
});
