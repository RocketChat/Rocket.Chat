import { after, afterEach, beforeEach, describe, it } from 'node:test';

import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike, MockedFunction } from 'jest-mock';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
let clock: sinon.SinonFakeTimers;

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

	close = fn<FunctionLike>();

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

const useNotificationAllowedMock = {
	useNotificationAllowed: fn<FunctionLike>(),
};

const { useNotificationAllowed } = useNotificationAllowedMock as unknown as typeof import('./useNotificationAllowed');

const SDKClientMock = {
	sdk: {
		rest: {
			post: fn<FunctionLike>(),
		},
	},
};

const { sdk } = SDKClientMock as unknown as typeof import('../../lib/SDKClient');

const onClientMessageReceivedMock = {
	onClientMessageReceived: fn<FunctionLike>(),
};

const { onClientMessageReceived } = onClientMessageReceivedMock as unknown as typeof import('../../lib/onClientMessageReceived');

const { useNotification } = proxyquire.noCallThru().load<typeof import('./useNotification')>('./useNotification', {
	'./useNotificationAllowed': useNotificationAllowedMock,
	'../../lib/SDKClient': SDKClientMock,
	'../../lib/getUserAvatarURL': {
		getUserAvatarURL: fn<FunctionLike>(),
	},
	'../../lib/onClientMessageReceived': onClientMessageReceivedMock,
});

describe('useNotification', () => {
	const originalNotification = window.Notification;

	beforeEach(() => {
		mocker.clearAllMocks();
		MockNotification.listenersByInstance = [];
		MockNotification.instances = [];
		(window as any).Notification = MockNotification;
		(useNotificationAllowed as MockedFunction<typeof useNotificationAllowed>).mockReturnValue(true);
		(onClientMessageReceived as MockedFunction<typeof onClientMessageReceived>).mockImplementation((message: any) =>
			Promise.resolve(message),
		);
	});

	after(() => {
		(window as any).Notification = originalNotification;
	});

	describe('auto-close timer', () => {
		beforeEach(() => {
			clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
		});

		afterEach(() => {
			clock?.restore();
		});

		it('does not schedule an auto-close timer when the server does not provide a duration', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload());

			const [instance] = MockNotification.instances;
			clock.tick(60_000);

			expect(instance.close).not.toHaveBeenCalled();
		});

		it('honours a server-provided duration and closes the notification after it elapses', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().build(),
			});

			await result.current(buildPayload(undefined, 5));

			const [instance] = MockNotification.instances;

			clock.tick(4_999);
			expect(instance.close).not.toHaveBeenCalled();

			clock.tick(1);
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
			clock.tick(10 * 60_000);

			expect(instance.close).not.toHaveBeenCalled();
			expect(clock.countTimers()).toBe(0);

			const [replyListener] = MockNotification.listenersByInstance;
			replyListener({ response: 'late reply' });

			expect(mocked(sdk.rest.post)).toHaveBeenCalledWith('/v1/chat.sendMessage', {
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

			clock.tick(60_000);

			expect(instance.close).not.toHaveBeenCalled();
		});

		it('does not schedule an auto-close timer when requireInteraction is set, even with a duration', async () => {
			const { result } = renderHook(() => useNotification(), {
				wrapper: mockAppRoot().withUserPreference('desktopNotificationRequireInteraction', true).build(),
			});

			await result.current(buildPayload(undefined, 5));

			const [instance] = MockNotification.instances;
			clock.tick(60_000);

			expect(instance.close).not.toHaveBeenCalled();
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

			expect(mocked(sdk.rest.post)).toHaveBeenCalledWith('/v1/chat.sendMessage', {
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

			expect(mocked(sdk.rest.post)).toHaveBeenCalledWith('/v1/chat.sendMessage', {
				message: { _id: expect.any(String), rid: 'roomId', msg: 'reply text' },
			});
		});
	});
});
