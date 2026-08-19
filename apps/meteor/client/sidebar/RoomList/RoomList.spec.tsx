import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';

import RoomList from './RoomList';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';

const mockCollapsedGroups: string[] = [];
const mockHandleClick = jest.fn();
const mockHandleKeyDown = jest.fn();
const mockMoveCategory = jest.fn();
const mockUsePreventDefault = jest.fn();
const mockUseShortcutOpenMenu = jest.fn();

const rooms = [
	{ _id: 'general', name: 'general' },
	{ _id: 'support', name: 'support' },
	{ _id: 'alice', name: 'alice' },
];

const emptyUnreadInfo = { userMentions: 0, groupMentions: 0, unread: 0, tunread: [], tunreadUser: [] };

const makeGroup = (key: string, groupRooms: typeof rooms, unread: number): SidebarRoomListGroup =>
	({
		key,
		title: key,
		translateTitle: true,
		showUnreads: false,
		keepUnreadsOnTop: false,
		collapsed: false,
		rooms: groupRooms,
		unreadInfo: { ...emptyUnreadInfo, unread },
		empty: groupRooms.length === 0,
	}) as unknown as SidebarRoomListGroup;

const groups = [
	makeGroup('Channels', [rooms[0], rooms[1]], 3),
	makeGroup('Direct_Messages', [rooms[2]], 1),
	makeGroup('Empty_Group', [], 0),
];

type MockSidebarVirtualListProps = {
	groups: {
		key: string;
		group: SidebarRoomListGroup;
		items: typeof rooms;
	}[];
	renderGroup: (group: SidebarRoomListGroup, groupIndex: number) => ReactNode;
	renderItem: (
		item: (typeof rooms)[number],
		itemIndex: number,
		group: SidebarRoomListGroup,
		groupIndex: number,
		rowIndex: number,
	) => ReactNode;
	getItemKey: (item: (typeof rooms)[number]) => string;
	bufferSize?: number;
};

const mockSidebarVirtualList = jest.fn(({ groups, renderGroup, renderItem, getItemKey }: MockSidebarVirtualListProps) => {
	let rowIndex = 0;

	return (
		<div data-testid='sidebar-virtual-list'>
			{groups.map(({ key, group, items }, groupIndex) => {
				rowIndex += 1;

				return (
					<section key={key} data-testid='virtual-group'>
						{renderGroup(group, groupIndex)}
						{items.map((item, itemIndex) => {
							const itemRowIndex = rowIndex;
							rowIndex += 1;

							return (
								<div key={getItemKey(item)} data-testid='virtual-item'>
									{renderItem(item, itemIndex, group, groupIndex, itemRowIndex)}
								</div>
							);
						})}
					</section>
				);
			})}
		</div>
	);
});

jest.mock('../components/SidebarVirtualList', () => ({
	__esModule: true,
	default: (props: MockSidebarVirtualListProps) => mockSidebarVirtualList(props),
}));

jest.mock('../../lib/RoomManager', () => ({
	useOpenedRoom: () => 'GENERAL',
}));

jest.mock('../categories/hooks/useMoveCategoryPosition', () => ({
	useMoveCategoryPosition: () => mockMoveCategory,
}));

jest.mock('../hooks/useAvatarTemplate', () => ({
	useAvatarTemplate: () => 'AvatarTemplate',
}));

jest.mock('../hooks/useCategoryList', () => ({
	SIDEBAR_DYNAMIC_GROUP_KEYS: ['Unread', 'Favorites'],
}));

jest.mock('../hooks/useCollapsedGroups', () => ({
	useCollapsedGroups: () => ({
		collapsedGroups: mockCollapsedGroups,
		handleClick: mockHandleClick,
		handleKeyDown: mockHandleKeyDown,
	}),
}));

jest.mock('../hooks/usePreventDefault', () => ({
	usePreventDefault: (ref: unknown) => mockUsePreventDefault(ref),
}));

jest.mock('../hooks/useRoomList', () => ({
	useRoomList: () => ({
		groups,
		groupsCount: [2, 1, 0],
		totalCount: 3,
	}),
}));

jest.mock('../hooks/useShortcutOpenMenu', () => ({
	useShortcutOpenMenu: (ref: unknown) => mockUseShortcutOpenMenu(ref),
}));

jest.mock('../hooks/useTemplateByViewMode', () => ({
	useTemplateByViewMode: () => 'SidebarItemTemplate',
}));

jest.mock('./RoomListCollapser', () => ({
	__esModule: true,
	default: ({ group }: { group: SidebarRoomListGroup }) => (
		<button type='button' data-testid='group-header'>{`${group.title}:${group.unreadInfo.unread}`}</button>
	),
}));

jest.mock('./RoomListRow', () => ({
	__esModule: true,
	default: ({ item }: { item: (typeof rooms)[number] }) => <div data-testid='room-row'>{item.name}</div>,
}));

jest.mock('./RoomListRowWrapper', () => ({
	__esModule: true,
	default: ({ children, ...props }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) => (
		<div data-testid='room-row-wrapper' {...props}>
			{children}
		</div>
	),
}));

const appRoot = mockAppRoot().withJohnDoe().withUserPreference('sidebarViewMode', 'extended').build();

describe('RoomList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('passes grouped room data to SidebarVirtualList', () => {
		render(<RoomList />, { wrapper: appRoot });

		expect(screen.getByTestId('sidebar-virtual-list')).toBeInTheDocument();
		expect(mockSidebarVirtualList).toHaveBeenCalledWith(
			expect.objectContaining({
				groups: [
					{ key: 'Channels', group: groups[0], items: [rooms[0], rooms[1]] },
					{ key: 'Direct_Messages', group: groups[1], items: [rooms[2]] },
					{ key: 'Empty_Group', group: groups[2], items: [] },
				],
				bufferSize: 25,
			}),
		);
		expect(screen.getAllByTestId('group-header').map((element) => element.textContent)).toEqual([
			'Channels:3',
			'Direct_Messages:1',
			'Empty_Group:0',
		]);
		expect(screen.getAllByTestId('room-row-wrapper')).toHaveLength(3);
		expect(screen.getAllByTestId('room-row-wrapper').map((element) => element.getAttribute('data-index'))).toEqual(['1', '2', '4']);
		expect(screen.getAllByTestId('room-row').map((element) => element.textContent)).toEqual(['general', 'support', 'alice']);
	});
});
