import { renderHook } from '@testing-library/react-hooks';

import { useRoomMenuActions } from './useRoomMenuActions';

const mockSubscription = { name: 'room1', t: 'c', f: true, disableNotifications: false };

jest.mock('@rocket.chat/ui-contexts', () => ({
	usePermission: jest.fn(() => true),
	useRouter: jest.fn(() => ({ navigate: jest.fn() })),
	useSetting: jest.fn(() => true),
	useUserSubscription: jest.fn(() => mockSubscription),
}));

jest.mock('../../hooks/menuActions/useLeaveRoom', () => ({
	useLeaveRoomAction: jest.fn(() => jest.fn()),
}));
jest.mock('../../hooks/menuActions/useToggleFavoriteAction', () => ({
	useToggleFavoriteAction: jest.fn(() => jest.fn()),
}));
jest.mock('../../hooks/menuActions/useToggleNotificationsAction', () => ({
	useToggleNotificationAction: jest.fn(() => jest.fn()),
}));
jest.mock('../../hooks/menuActions/useToggleReadAction', () => ({
	useToggleReadAction: jest.fn(() => jest.fn()),
}));
jest.mock('../../hooks/useHideRoomAction', () => ({
	useHideRoomAction: jest.fn(() => jest.fn()),
}));
jest.mock('../../omnichannel/hooks/useOmnichannelPrioritiesMenu', () => ({
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
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns all menu options for normal rooms', () => {
		const { result } = renderHook(() => useRoomMenuActions(mockHookProps));

		const actions = result.current;

		expect(actions).toHaveLength(2);
		expect(actions[0].items).toHaveLength(4);
		expect(actions[1].title).toBe('Notifications');
		expect(actions[1].items).toHaveLength(2);
	});

	it('returns priorities section for omnichannel room', () => {
		const { result } = renderHook(() => useRoomMenuActions({ ...mockHookProps, type: 'l' }));

		expect(result.current.length).toBe(2);
		expect(result.current[1].title).toBe('Priorities');
		expect(result.current.some((section) => section.title === 'Notifications')).toBe(false);
		expect(result.current[0].items).toHaveLength(2);
		expect(result.current[0].title).toBe('');
	});

	it('does not return any menu options if hideDefaultOptions', () => {
		const { result } = renderHook(() => useRoomMenuActions({ ...mockHookProps, hideDefaultOptions: true }));

		expect(result.current).toHaveLength(1);
		expect(result.current[0].items).toHaveLength(0);
		expect(result.current[0].title).toBe('');
	});
});
