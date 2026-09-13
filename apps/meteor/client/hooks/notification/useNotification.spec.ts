import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useNotification } from './useNotification';
import { useNotificationAllowed } from './useNotificationAllowed';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
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

	title: string;

	options: NotificationOptions | undefined;

	onclick: (() => void) | null = null;

	constructor(title: string, options?: NotificationOptions) {
		this.title = title;
		this.options = options;
	}

	addEventListener(type: 'reply', listener: NotificationEventListener): void {
		if (type === 'reply') {
			MockNotification.listenersByInstance.push(listener);
		}
	}

	close(): void {
		// no-op
	}
}

const buildPayload = (tmid?: string): INotificationDesktop => ({
	title: 'title',
	text: 'text',
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
		(window as any).Notification = MockNotification;
		(useNotificationAllowed as jest.MockedFunction<typeof useNotificationAllowed>).mockReturnValue(true);
		(onClientMessageReceived as jest.MockedFunction<typeof onClientMessageReceived>).mockImplementation((message: any) =>
			Promise.resolve(message),
		);
	});

	afterAll(() => {
		(window as any).Notification = originalNotification;
	});

	it('includes tmid in the sendMessage payload when the notification is for a thread message', async () => {
		const { result } = renderHook(() => useNotification(), {
			wrapper: mockAppRoot().build(),
		});

		await result.current(buildPayload('threadId'));

		await waitFor(() => expect(MockNotification.listenersByInstance).toHaveLength(1));

		MockNotification.listenersByInstance[0]({ response: 'reply text' });

		expect(sdk.rest.post).toHaveBeenCalledWith(
			'/v1/chat.sendMessage',
			expect.objectContaining({
				message: expect.objectContaining({
					rid: 'roomId',
					msg: 'reply text',
					tmid: 'threadId',
				}),
			}),
		);
	});

	it('does not include tmid in the sendMessage payload when the notification is for a room message', async () => {
		const { result } = renderHook(() => useNotification(), {
			wrapper: mockAppRoot().build(),
		});

		await result.current(buildPayload());

		await waitFor(() => expect(MockNotification.listenersByInstance).toHaveLength(1));

		MockNotification.listenersByInstance[0]({ response: 'reply text' });

		expect(sdk.rest.post).toHaveBeenCalledWith(
			'/v1/chat.sendMessage',
			expect.objectContaining({
				message: expect.objectContaining({ rid: 'roomId', msg: 'reply text' }),
			}),
		);
		const [, body] = (sdk.rest.post as jest.Mock).mock.calls[0];
		expect('tmid' in body.message).toBe(false);
	});
});
