import { api, ServiceClass } from '@rocket.chat/core-services';
import type { ISettingBase } from '@rocket.chat/core-typings';

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

const createSetting = (overrides: Partial<ISettingBase>): ISettingBase => ({
	_id: 'my_setting',
	_updatedAt: new Date(),
	type: 'string',
	public: false,
	env: false,
	i18nLabel: 'my_setting',
	value: 'value',
	packageValue: 'value',
	blocked: false,
	sorter: 0,
	ts: new Date(),
	createdAt: new Date(),
	...overrides,
});

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

	describe('settings events', () => {
		it('delivers a loggedIn setting to signed-in users and not to everyone', () => {
			const notifyAll = jest.spyOn(notifications, 'notifyAllInThisInstance');
			const notifyLogged = jest.spyOn(notifications, 'notifyLoggedInThisInstance');

			fire('watch.settings', { clientAction: 'updated', setting: createSetting({ loggedIn: true }) });

			expect(notifyAll).not.toHaveBeenCalled();
			expect(notifyLogged).toHaveBeenCalledWith('logged-settings-changed', 'updated', expect.objectContaining({ _id: 'my_setting' }));
		});

		it('never delivers a public setting as logged-settings-changed', () => {
			const notifyLogged = jest.spyOn(notifications, 'notifyLoggedInThisInstance');

			fire('watch.settings', { clientAction: 'updated', setting: createSetting({ public: true }) });

			expect(notifyLogged).not.toHaveBeenCalledWith('logged-settings-changed', expect.anything(), expect.anything());
		});

		it('delivers nothing for a hidden loggedIn setting', () => {
			const notifyAll = jest.spyOn(notifications, 'notifyAllInThisInstance');
			const notifyLogged = jest.spyOn(notifications, 'notifyLoggedInThisInstance');

			fire('watch.settings', { clientAction: 'updated', setting: createSetting({ loggedIn: true, hidden: true }) });

			expect(notifyAll).not.toHaveBeenCalled();
			expect(notifyLogged).not.toHaveBeenCalled();
		});
	});
});
