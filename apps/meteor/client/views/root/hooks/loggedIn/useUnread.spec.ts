import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useUnread } from './useUnread';
import { createFakeSubscription } from '../../../../../tests/mocks/data';

const setBadge = jest.fn();

const unreadRoom = (unread: number) => createFakeSubscription({ unread, alert: unread > 0, unreadAlert: 'default' });

const alertOnlyRoom = (unreadAlert: 'default' | 'all' | 'nothing') => createFakeSubscription({ unread: 0, alert: true, unreadAlert });

describe('useUnread', () => {
	describe('when the desktop app is present', () => {
		beforeEach(() => {
			Object.assign(window, { RocketChatDesktop: { setBadge } });
		});

		afterEach(() => {
			delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
			setBadge.mockClear();
		});

		it('should push the total unread count as the badge', () => {
			renderHook(() => useUnread(), {
				wrapper: mockAppRoot()
					.withSubscriptions([unreadRoom(2), unreadRoom(3)])
					.build(),
			});

			expect(setBadge).toHaveBeenLastCalledWith(5);
		});

		it('should push the alert indicator for an alert-only room when the unreadAlert preference is on', () => {
			renderHook(() => useUnread(), {
				wrapper: mockAppRoot()
					.withUserPreference('unreadAlert', true)
					.withSubscriptions([alertOnlyRoom('default')])
					.build(),
			});

			expect(setBadge).toHaveBeenLastCalledWith('•');
		});

		it('should push no badge for an alert-only room when the unreadAlert preference is off', () => {
			renderHook(() => useUnread(), {
				wrapper: mockAppRoot()
					.withUserPreference('unreadAlert', false)
					.withSubscriptions([alertOnlyRoom('default')])
					.build(),
			});

			expect(setBadge).toHaveBeenLastCalledWith(0);
		});

		it('should push the alert indicator for a room set to alert on all messages, even when the preference is off', () => {
			renderHook(() => useUnread(), {
				wrapper: mockAppRoot()
					.withUserPreference('unreadAlert', false)
					.withSubscriptions([alertOnlyRoom('all')])
					.build(),
			});

			expect(setBadge).toHaveBeenLastCalledWith('•');
		});

		it('should push no badge for a room set to alert on nothing', () => {
			renderHook(() => useUnread(), {
				wrapper: mockAppRoot()
					.withUserPreference('unreadAlert', true)
					.withSubscriptions([alertOnlyRoom('nothing')])
					.build(),
			});

			expect(setBadge).toHaveBeenLastCalledWith(0);
		});
	});

	describe('when the desktop app is absent', () => {
		it('should not throw', () => {
			expect(() =>
				renderHook(() => useUnread(), {
					wrapper: mockAppRoot()
						.withSubscriptions([unreadRoom(1)])
						.build(),
				}),
			).not.toThrow();
		});
	});
});
