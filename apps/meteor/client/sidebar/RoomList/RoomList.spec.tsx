import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HTMLAttributes, ReactNode } from 'react';

import RoomList from './RoomList';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';

const mockCollapsedGroups: string[] = [];
const mockHandleClick = jest.fn();
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
	{ ...makeGroup('Channels', [rooms[0], rooms[1]], 3), activityFilterHours: 24 },
	makeGroup('Direct_Messages', [rooms[2]], 1),
	makeGroup('Empty_Group', [], 0),
];

const mockUseRoomList = jest.fn((_options: { collapsedGroups?: string[]; liftedFilters?: Record<string, number> }) => ({
	groups,
	groupsCount: [2, 1, 0],
	totalCount: 3,
}));

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

jest.mock('../hooks/useCategoryList', () => ({
	SIDEBAR_DYNAMIC_GROUP_KEYS: ['Unread', 'Favorites'],
}));

jest.mock('../hooks/useCollapsedGroups', () => ({
	useCollapsedGroups: () => ({
		collapsedGroups: mockCollapsedGroups,
		handleClick: mockHandleClick,
	}),
}));

jest.mock('../hooks/usePreventDefault', () => ({
	usePreventDefault: (ref: unknown) => mockUsePreventDefault(ref),
}));

jest.mock('../hooks/useRoomList', () => ({
	...jest.requireActual('../hooks/useRoomList'),
	useRoomList: (options: { collapsedGroups?: string[]; liftedFilters?: Record<string, number> }) => mockUseRoomList(options),
}));

jest.mock('../hooks/useShortcutOpenMenu', () => ({
	useShortcutOpenMenu: (ref: unknown) => mockUseShortcutOpenMenu(ref),
}));

jest.mock('./RoomListCollapser', () => ({
	__esModule: true,
	default: ({
		group,
		onToggleInactive,
		onActivityFilterChange,
	}: {
		group: SidebarRoomListGroup;
		onToggleInactive: () => void;
		onActivityFilterChange: (hours: number | undefined) => void;
	}) => (
		<>
			<button type='button' data-testid='group-header'>{`${group.title}:${group.unreadInfo.unread}`}</button>
			<button type='button' onClick={onToggleInactive}>{`toggle ${group.key}`}</button>
			<button type='button' onClick={() => onActivityFilterChange(24 * 7)}>{`filter ${group.key} by 7 days`}</button>
			<button type='button' onClick={() => onActivityFilterChange(undefined)}>{`clear ${group.key} filter`}</button>
		</>
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
				bufferSize: 240,
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

	it("lifts and restores a group's activity filter for the session from its header", async () => {
		render(<RoomList />, { wrapper: appRoot });

		expect(mockUseRoomList).toHaveBeenLastCalledWith(expect.objectContaining({ liftedFilters: {} }));

		await userEvent.click(screen.getByRole('button', { name: 'toggle Channels' }));
		expect(mockUseRoomList).toHaveBeenLastCalledWith(expect.objectContaining({ liftedFilters: { Channels: 24 } }));

		await userEvent.click(screen.getByRole('button', { name: 'toggle Channels' }));
		expect(mockUseRoomList).toHaveBeenLastCalledWith(expect.objectContaining({ liftedFilters: {} }));
	});

	it('drops the lift of a group when a window is chosen for it', async () => {
		render(<RoomList />, { wrapper: appRoot });

		await userEvent.click(screen.getByRole('button', { name: 'toggle Channels' }));
		expect(mockUseRoomList).toHaveBeenLastCalledWith(expect.objectContaining({ liftedFilters: { Channels: 24 } }));

		await userEvent.click(screen.getByRole('button', { name: 'filter Channels by 7 days' }));
		expect(mockUseRoomList).toHaveBeenLastCalledWith(expect.objectContaining({ liftedFilters: {} }));
	});

	it('announces the outcome of a chosen activity filter once the groups reflect it', async () => {
		const announcingAppRoot = mockAppRoot()
			.withJohnDoe()
			.withUserPreference('sidebarViewMode', 'extended')
			.withTranslations('en', 'core', {
				Channels: 'Channels',
				Last_7_days: 'Last 7 days',
				Inactive_rooms_hidden_in_group_one: '{{filter}}: {{count}} inactive room hidden in {{group}}',
				Inactive_rooms_hidden_in_group_other: '{{filter}}: {{count}} inactive rooms hidden in {{group}}',
				Activity_filter_cleared_in_group: 'Filter cleared in {{group}}',
			})
			.build();
		const { rerender } = render(<RoomList />, { wrapper: announcingAppRoot });

		expect(screen.getByRole('status')).toHaveTextContent('');

		await userEvent.click(screen.getByRole('button', { name: 'filter Channels by 7 days' }));
		expect(screen.getByRole('status')).toHaveTextContent('');

		mockUseRoomList.mockReturnValue({
			groups: [{ ...groups[0], activityFilterHours: 24 * 7, inactiveCount: 3 }, groups[1], groups[2]],
			groupsCount: [2, 1, 0],
			totalCount: 3,
		});
		rerender(<RoomList />);
		expect(screen.getByRole('status')).toHaveTextContent('Last 7 days: 3 inactive rooms hidden in Channels');

		await userEvent.click(screen.getByRole('button', { name: 'clear Channels filter' }));
		mockUseRoomList.mockReturnValue({
			groups: [{ ...groups[0], activityFilterHours: undefined, inactiveCount: 0 }, groups[1], groups[2]],
			groupsCount: [2, 1, 0],
			totalCount: 3,
		});
		rerender(<RoomList />);
		expect(screen.getByRole('status')).toHaveTextContent('Filter cleared in Channels');
	});

	it('stays quiet when a filter changes without a choice made here', () => {
		const { rerender } = render(<RoomList />, { wrapper: appRoot });

		mockUseRoomList.mockReturnValue({
			groups: [{ ...groups[0], activityFilterHours: 24 * 7, inactiveCount: 3 }, groups[1], groups[2]],
			groupsCount: [2, 1, 0],
			totalCount: 3,
		});
		rerender(<RoomList />);

		expect(screen.getByRole('status')).toHaveTextContent('');
	});
});
