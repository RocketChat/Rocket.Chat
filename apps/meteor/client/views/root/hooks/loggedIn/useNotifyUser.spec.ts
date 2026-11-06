import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useNotifyUser } from './useNotifyUser';
import { createFakeSubscription, createFakeUser } from '../../../../../tests/mocks/data';
import { openNotifications } from '../../../../lib/openNotifications';

const mockStreamCallbacks = new Map<string, (...args: unknown[]) => void>();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useStream: () => (key: string, callback: (...args: unknown[]) => void) => {
		mockStreamCallbacks.set(key, callback);
		return () => undefined;
	},
}));
jest.mock('./useDesktopNotification', () => ({ useDesktopNotification: () => jest.fn() }));

it('closes the notifications of a room when the server reports it read', () => {
	const user = createFakeUser();
	renderHook(() => useNotifyUser(user), { wrapper: mockAppRoot().build() });
	const notification = { close: jest.fn() } as unknown as Notification;
	openNotifications.track('roomA', notification);

	act(() =>
		mockStreamCallbacks.get(`${user._id}/subscriptions-changed`)?.(
			'updated',
			createFakeSubscription({ rid: 'roomA', alert: false, unread: 0, tunread: [] }),
		),
	);

	expect(notification.close).toHaveBeenCalledTimes(1);
});
