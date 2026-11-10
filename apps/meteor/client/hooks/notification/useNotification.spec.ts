import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useNotification } from './useNotification';
import { useNotificationAllowed } from './useNotificationAllowed';
import { createFakeSubscription } from '../../../tests/mocks/data';
import { sdk } from '../../lib/SDKClient';
import { onClientMessageReceived } from '../../lib/onClientMessageReceived';
import { openNotifications } from '../../lib/openNotifications';
import { Subscriptions } from '../../stores';

jest.mock('./useNotificationAllowed', () => ({
	useNotificationAllowed: jest.fn(),
}));

jest.mock('../../lib/onClientMessageReceived', () => ({
	onClientMessageReceived: jest.fn(),
}));

jest.mock('../../lib/SDKClient', () => ({
	sdk: {
		rest: {
			post: jest.fn(),
		},
	},
}));

jest.mock('../../lib/getUserAvatarURL', () => ({
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

			const [replyListener] = MockNotification.listenersByInstance;
			replyListener({ response: 'late reply' });

			expect(jest.mocked(sdk.rest.post)).toHaveBeenCalledWith('/v1/chat.sendMessage', {
				message: expect.objectContaining({ rid: 'roomId', msg: 'late reply' }),
			});
		});

		it('honours a notification that requires interaction even when the preference is disabled', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().withUserPreference('desktopNotificationRequireInteraction', false).build(),
			});

			await result.current({ ...buildPayload(undefined, 5), requireInteraction: true });

			const [instance] = MockNotification.instances;
			expect(instance.options?.requireInteraction).toBe(true);

			jest.advanceTimersByTime(60_000);

			expect(instance.close).not.toHaveBeenCalled();
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

	describe('open notifications', () => {
		it('leaves a conference ring open when its room is read', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});
			const payload = buildPayload();

			await result.current({ ...payload, payload: { ...payload.payload, conferenceId: 'conferenceId' } });
			await result.current(payload);
			openNotifications.closeReadNotifications({ rid: 'roomId', alert: false, unread: 0, tunread: [] });

			const [ring, message] = MockNotification.instances;
			expect(ring.close).not.toHaveBeenCalled();
			expect(message.close).toHaveBeenCalledTimes(1);
		});

		it('does not show a notification for a room read while the message was being prepared', async () => {
			Subscriptions.state.store(createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: new Date('2026-01-01T10:00:00Z') }));
			(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation(async (message: any) => {
				Subscriptions.state.store(createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: new Date('2026-01-01T10:05:00Z') }));
				return message;
			});
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			expect(MockNotification.instances).toHaveLength(0);
			Subscriptions.state.replaceAll([]);
		});

		it('does not show a notification for a room read for the first time while the message was being prepared', async () => {
			Subscriptions.state.store(createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: undefined }));
			(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation(async (message: any) => {
				Subscriptions.state.store(createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: new Date('2026-01-01T10:05:00Z') }));
				return message;
			});
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			expect(MockNotification.instances).toHaveLength(0);
			Subscriptions.state.replaceAll([]);
		});

		it('does not show a notification for a room left while the message was being prepared', async () => {
			Subscriptions.state.store(createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: new Date('2026-01-01T10:00:00Z') }));
			(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation(async (message: any) => {
				Subscriptions.state.replaceAll([]);
				return message;
			});
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			expect(MockNotification.instances).toHaveLength(0);
		});

		it('shows a notification whose subscription arrives while the message is being prepared', async () => {
			(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation(async (message: any) => {
				Subscriptions.state.store(createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: new Date('2026-01-01T10:05:00Z') }));
				return message;
			});
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			expect(MockNotification.instances).toHaveLength(1);
			Subscriptions.state.replaceAll([]);
		});

		it('shows a thread notification when its room is read but the thread stays unread', async () => {
			Subscriptions.state.store(createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: new Date('2026-01-01T10:00:00Z') }));
			(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation(async (message: any) => {
				Subscriptions.state.store(
					createFakeSubscription({ _id: 'subId', rid: 'roomId', ls: new Date('2026-01-01T10:05:00Z'), tunread: ['threadId'] }),
				);
				return message;
			});
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload('threadId'));

			expect(MockNotification.instances).toHaveLength(1);
			Subscriptions.state.replaceAll([]);
		});

		it('does not show a notification prepared before the user changed', async () => {
			(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation(async (message: any) => {
				openNotifications.closeAll();
				return message;
			});
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			expect(MockNotification.instances).toHaveLength(0);
		});
	});

	describe('quick reply', () => {
		it('includes tmid in the sendMessage payload when the notification is for a thread message', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload('threadId'));

			const [replyListener] = MockNotification.listenersByInstance;
			replyListener({ response: 'reply text' });

			expect(jest.mocked(sdk.rest.post)).toHaveBeenCalledWith('/v1/chat.sendMessage', {
				message: { _id: expect.any(String), rid: 'roomId', msg: 'reply text', tmid: 'threadId' },
			});
		});

		it('does not include tmid in the sendMessage payload when the notification is for a room message', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			const [replyListener] = MockNotification.listenersByInstance;
			replyListener({ response: 'reply text' });

			expect(jest.mocked(sdk.rest.post)).toHaveBeenCalledWith('/v1/chat.sendMessage', {
				message: { _id: expect.any(String), rid: 'roomId', msg: 'reply text' },
			});
		});
	});
});
