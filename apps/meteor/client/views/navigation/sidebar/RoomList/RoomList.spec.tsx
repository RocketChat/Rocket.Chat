import { render } from '@testing-library/react';

import RoomList from './RoomList';

const mockGroupedVirtuoso = jest.fn();

jest.mock('react-virtuoso', () => ({
	GroupedVirtuoso: (props: any) => {
		mockGroupedVirtuoso(props);
		return null;
	},
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserId: () => 'user-id',
}));

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useResizeObserver: () => ({ ref: { current: null } }),
}));

jest.mock('../hooks/usePreventDefault', () => ({
	usePreventDefault: () => jest.fn(),
}));

jest.mock('../hooks/useShortcutOpenMenu', () => ({
	useShortcutOpenMenu: () => jest.fn(),
}));

const mockRoomListGroups = [
	{
		group: 'unread' as const,
		rooms: [
			{ _id: 'room-1', rid: 'rid-1' },
			{ rid: 'rid-2' },
		] as any[],
		unreadInfo: { userMentions: 0, groupMentions: 0, unread: 0, tunread: [], tunreadUser: [] },
	},
	{
		group: 'channels' as const,
		rooms: [{ _id: 'room-3', rid: 'rid-3' }] as any[],
		unreadInfo: { userMentions: 0, groupMentions: 0, unread: 0, tunread: [], tunreadUser: [] },
	},
];

let mockCollapsedGroups: string[] = [];

jest.mock('../../contexts/RoomsNavigationContext', () => ({
	useSideBarRoomsList: () => ({
		roomListGroups: mockRoomListGroups,
		groupCounts: mockRoomListGroups.map((g) => (mockCollapsedGroups.includes(g.group) ? 0 : g.rooms.length)),
		collapsedGroups: mockCollapsedGroups,
		handleClick: jest.fn(),
		totalCount: mockRoomListGroups.reduce((acc, g) => acc + (mockCollapsedGroups.includes(g.group) ? 0 : g.rooms.length), 0),
	}),
	sidePanelFiltersConfig: {
		unread: { title: 'Unread' },
		channels: { title: 'Channels' },
	},
}));

describe('RoomList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCollapsedGroups = [];
	});

	it('passes computeItemKey to GroupedVirtuoso keying headers and items by group and id', () => {
		render(<RoomList />);

		expect(mockGroupedVirtuoso).toHaveBeenCalled();
		const { computeItemKey } = mockGroupedVirtuoso.mock.calls[0][0];

		expect(computeItemKey(0)).toBe('header-unread');
		expect(computeItemKey(1)).toBe('unread-room-1');
		expect(computeItemKey(2)).toBe('unread-rid-2');
		expect(computeItemKey(3)).toBe('header-channels');
		expect(computeItemKey(4)).toBe('channels-room-3');
		expect(computeItemKey(99)).toBe(99);
	});

	it('accounts for collapsed groups in computeItemKey', () => {
		mockCollapsedGroups = ['unread'];
		render(<RoomList />);

		expect(mockGroupedVirtuoso).toHaveBeenCalled();
		const { computeItemKey } = mockGroupedVirtuoso.mock.calls[0][0];

		expect(computeItemKey(0)).toBe('header-unread');
		expect(computeItemKey(1)).toBe('header-channels');
		expect(computeItemKey(2)).toBe('channels-room-3');
	});
});
