import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useRoomMenuActions } from './useRoomMenuActions';
import { createFakeRoom, createFakeSubscription } from '../../../../../tests/mocks/data';

const mockRoom = createFakeRoom({ _id: 'room1', t: 'c', name: 'room1', fname: 'Room 1' });
const mockSubscription = createFakeSubscription({ name: 'room1', t: 'c', disableNotifications: false, rid: 'room1' });

jest.mock('../../../../../client/lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getUiText: () => 'leaveWarning',
		}),
	},
}));

jest.mock('../../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		close: jest.fn(),
	},
}));

// TODO: Update this mock when we get the mocked OmnichannelContext working
jest.mock('../../../../omnichannel/hooks/useOmnichannelPrioritiesMenu', () => ({
	useOmnichannelPrioritiesMenu: jest.fn(() => [{ id: 'priority', content: 'Priority', icon: 'priority', onClick: jest.fn() }]),
}));

const mockHookProps = {
	rid: 'room1',
	type: 'c',
	name: 'Room 1',
	isUnread: true,
	cl: true,
	roomOpen: true,
	hideDefaultOptions: false,
	href: '/channel/room1',
} as const;

describe('useRoomMenuActions', () => {
	it('should return all menu options for normal rooms', () => {
		const { result } = renderHook(() => useRoomMenuActions(mockHookProps), {
			wrapper: mockAppRoot()
				.withSubscriptions([{ ...mockSubscription, rid: 'room1' }] as unknown as SubscriptionWithRoom[])
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		const actions = result.current;
		expect(actions).toHaveLength(2);
		expect(actions[0].items).toHaveLength(4);
		expect(actions[1].title).toBe('Notifications');
		expect(actions[1].items).toHaveLength(2);
	});

	it('should return priorities section for omnichannel room', () => {
		const { result } = renderHook(() => useRoomMenuActions({ ...mockHookProps, type: 'l' }), {
			wrapper: mockAppRoot()
				.withSubscriptions([{ ...mockSubscription, ...mockRoom, t: 'l' }] as unknown as SubscriptionWithRoom[])
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		expect(result.current.length).toBe(2);
		expect(result.current[1].title).toBe('Priorities');
		expect(result.current.some((section) => section.title === 'Notifications')).toBe(false);
		expect(result.current[0].items).toHaveLength(2);
		expect(result.current[0].title).toBe('');
	});

	it('should not return any menu option if hideDefaultOptions', () => {
		const { result } = renderHook(() => useRoomMenuActions({ ...mockHookProps, hideDefaultOptions: true }), {
			wrapper: mockAppRoot()
				.withSubscriptions([{ ...mockSubscription, ...mockRoom }] as unknown as SubscriptionWithRoom[])
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', true)
				.build(),
		});

		expect(result.current).toHaveLength(0);
	});

	it('should not return favorite room option if setting is disabled', () => {
		const { result } = renderHook(() => useRoomMenuActions(mockHookProps), {
			wrapper: mockAppRoot()
				.withSubscriptions([{ ...mockSubscription, ...mockRoom }] as unknown as SubscriptionWithRoom[])
				.withPermission('leave-c')
				.withPermission('leave-p')
				.withSetting('Favorite_Rooms', false)
				.build(),
		});

		const actions = result.current;
		expect(actions).toHaveLength(2);
		expect(actions[0].items).toHaveLength(3);
		expect(actions[0].items.some((item) => item.id === 'toggleFavorite')).toBe(false);
		expect(actions[1].title).toBe('Notifications');
		expect(actions[1].items).toHaveLength(2);
	});
});
