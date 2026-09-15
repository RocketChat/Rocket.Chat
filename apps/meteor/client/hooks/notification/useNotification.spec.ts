import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useNotification } from './useNotification';
import { useNotificationAllowed } from './useNotificationAllowed';
import { onClientMessageReceived } from '../../lib/onClientMessageReceived';

jest.mock('./useNotificationAllowed', () => ({
	useNotificationAllowed: jest.fn(),
}));

jest.mock('../../lib/onClientMessageReceived', () => ({
	onClientMessageReceived: jest.fn(),
}));

jest.mock('../../../app/utils/client/lib/SDKClient', () => ({
	sdk: {
		rest: {
			post: jest.fn(),
		},
	},
}));

jest.mock('../../../app/utils/client', () => ({
	getUserAvatarURL: jest.fn(),
}));

type NotificationEventListener = (event: { response: string }) => void;

class MockNotification {
	static permission: NotificationPermission = 'granted';

	static listenersByInstance: NotificationEventListener[] = [];

	static instances: MockNotification[] = [];

	title: string;

	options: NotificationOptions | undefined;

	onclick: (() => void) | null = null;

	constructor(title: string, options?: NotificationOptions) {
		this.title = title;
		this.options = options;
		MockNotification.instances.push(this);
	}

	close = jest.fn();

	addEventListener(type: 'reply', listener: NotificationEventListener): void {
		if (type === 'reply') {
			MockNotification.listenersByInstance.push(listener);
		}
	}
}

const buildPayload = (tmid?: string, duration?: number): INotificationDesktop => ({
	title: 'title',
	text: 'text',
	...(duration !== undefined && { duration }),
	payload: {
		_id: 'msgId',
		rid: 'roomId',
		...(tmid && { tmid }),
		sender: { _id: 'senderId', username: 'sender' },
		type: 'c',
		name: 'roomName',
		message: { msg: 'text' },
		audioNotificationValue: 'default',
	},
});

describe('useNotification', () => {
	const originalNotification = window.Notification;

	beforeEach(() => {
		jest.clearAllMocks();
		MockNotification.listenersByInstance = [];
		MockNotification.instances = [];
		(window as any).Notification = MockNotification;
		(useNotificationAllowed as jest.MockedFunction<typeof useNotificationAllowed>).mockReturnValue(true);
		(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation((message: any) =>
			Promise.resolve(message),
		);
	});

	afterAll(() => {
		(window as any).Notification = originalNotification;
	});

	describe('auto-close timer', () => {
		beforeEach(() => {
			jest.useFakeTimers();
		});

		afterEach(() => {
			jest.useRealTimers();
		});

		it('does not schedule an auto-close timer when the server does not provide a duration', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			const [instance] = MockNotification.instances;
			jest.advanceTimersByTime(60_000);

			expect(instance.close).not.toHaveBeenCalled();
		});

		it('honours a server-provided duration and closes the notification after it elapses', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload(undefined, 5));

			const [instance] = MockNotification.instances;

			jest.advanceTimersByTime(4_999);
			expect(instance.close).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);
			expect(instance.close).toHaveBeenCalledTimes(1);
		});

		it('leaves a notification without a duration open indefinitely, so a late quick reply can still reach it', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			const [instance] = MockNotification.instances;

			// Desktop clients keep such a notification actionable (a Windows Action
			// Center card stays repliable), so the client must not declare it over.
			jest.advanceTimersByTime(10 * 60_000);

			expect(instance.close).not.toHaveBeenCalled();
			expect(jest.getTimerCount()).toBe(0);
		});

		it('does not schedule an auto-close timer when requireInteraction is set, even with a duration', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().withUserPreference('desktopNotificationRequireInteraction', true).build(),
			});

			await result.current(buildPayload(undefined, 5));

			const [instance] = MockNotification.instances;
			jest.advanceTimersByTime(60_000);

			expect(instance.close).not.toHaveBeenCalled();
		});
	});
});
