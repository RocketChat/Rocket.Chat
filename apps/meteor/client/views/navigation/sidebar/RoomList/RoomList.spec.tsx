import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import RoomList from './RoomList';

type GroupedVirtuosoMockProps = {
	groupCounts: number[];
	groupContent: (index: number) => ReactNode;
	itemContent?: (index: number, groupIndex: number) => ReactNode;
	computeItemKey?: (index: number) => string;
	components?: {
		Item?: (props: { children: ReactNode }) => ReactNode;
		Group?: (props: { children: ReactNode }) => ReactNode;
		List?: (props: { children: ReactNode }) => ReactNode;
	};
};

const mockGroupedVirtuoso = jest.fn(
	({ groupCounts, groupContent, itemContent, computeItemKey, components }: GroupedVirtuosoMockProps) => {
		const Item = components?.Item ?? (({ children }: { children: ReactNode }) => <div>{children}</div>);
		const Group = components?.Group ?? (({ children }: { children: ReactNode }) => <div>{children}</div>);
		const List = components?.List ?? (({ children }: { children: ReactNode }) => <div>{children}</div>);

		// Mirrors how GroupedVirtuoso assigns keys: computeItemKey receives the
		// flat index (group headers occupy a slot each) and its result becomes
		// the React key of the rendered row, falling back to the index itself.
		const children: ReactNode[] = [];
		let flatIndex = 0;
		let dataIndex = 0;
		groupCounts.forEach((count, groupIndex) => {
			const headerIndex = flatIndex;
			children.push(
				<Group key={computeItemKey?.(headerIndex) ?? headerIndex}>{groupContent(groupIndex)}</Group>,
			);
			flatIndex += 1;
			for (let i = 0; i < count; i++) {
				const itemFlatIndex = flatIndex;
				const index = dataIndex;
				children.push(
					<Item key={computeItemKey?.(itemFlatIndex) ?? itemFlatIndex}>{itemContent?.(index, groupIndex)}</Item>,
				);
				flatIndex += 1;
				dataIndex += 1;
			}
		});
		return <List>{children}</List>;
	},
);

jest.mock('react-virtuoso', () => ({
	GroupedVirtuoso: (props: GroupedVirtuosoMockProps) => mockGroupedVirtuoso(props),
}));

const mockUseSideBarRoomsList = jest.fn();

jest.mock('../../contexts/RoomsNavigationContext', () => ({
	useSideBarRoomsList: (...args: unknown[]) => mockUseSideBarRoomsList(...args),
	sidePanelFiltersConfig: {
		unread: { title: 'Unread' },
	},
}));

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	VirtualizedScrollbars: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock('../hooks/usePreventDefault', () => ({
	usePreventDefault: () => jest.fn(),
}));

jest.mock('../hooks/useShortcutOpenMenu', () => ({
	useShortcutOpenMenu: () => jest.fn(),
}));

jest.mock('./useSidebarListNavigation', () => ({
	useSidebarListNavigation: () => ({ current: null }),
}));

jest.mock('./RoomListCollapser', () => ({
	__esModule: true,
	default: ({ groupTitle }: { groupTitle: string }) => <div data-testid='group-header'>{groupTitle}</div>,
}));

// A row that keeps the open state of its context menu in local state, like the
// real row does: if React reuses this row instance for another room, the menu
// stays open but now acts on that other room.
jest.mock('./RoomListRow', () => {
	const { useState } = jest.requireActual('react');
	return {
		__esModule: true,
		default: ({ item }: { item: { _id: string; name: string } }) => {
			const [menuOpen, setMenuOpen] = useState(false);
			return (
				<div data-testid='room-row' data-room-id={item._id}>
					<span>{item.name}</span>
					<button type='button' data-testid={`open-menu-${item._id}`} onClick={() => setMenuOpen(true)}>
						Open menu
					</button>
					{menuOpen && <div data-testid='open-menu'>Menu for {item.name}</div>}
				</div>
			);
		},
	};
});

const roomA = { _id: 'room-a', rid: 'room-a', name: 'Room A' };
const roomB = { _id: 'room-b', rid: 'room-b', name: 'Room B' };
const roomC = { _id: 'room-c', rid: 'room-c', name: 'Room C' };

const unreadInfo = { userMentions: 0, groupMentions: 0, unread: 1, tunread: [], tunreadUser: [] };

const roomsListState = (rooms: typeof roomA[]) => ({
	roomListGroups: [{ group: 'unread', rooms, unreadInfo }],
	groupCounts: [rooms.length],
	totalCount: rooms.length,
	collapsedGroups: [],
	handleClick: jest.fn(),
});

const appRoot = mockAppRoot().withJohnDoe().build();

describe('RoomList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('keys rows by room id', () => {
		mockUseSideBarRoomsList.mockReturnValue(roomsListState([roomA, roomB, roomC]));
		render(<RoomList />, { wrapper: appRoot });

		const computeItemKey = mockGroupedVirtuoso.mock.calls[0][0].computeItemKey as (index: number) => string;
		expect(computeItemKey).toEqual(expect.any(Function));
		// Flat index 0 is the group header; rooms follow at 1, 2, 3.
		expect(computeItemKey(0)).toBe('group-unread');
		expect(computeItemKey(1)).toBe('room-a');
		expect(computeItemKey(2)).toBe('room-b');
		expect(computeItemKey(3)).toBe('room-c');
	});

	it('keeps an open menu on the same room when the list shifts', () => {
		mockUseSideBarRoomsList.mockReturnValue(roomsListState([roomA, roomB, roomC]));
		const { rerender } = render(<RoomList />, { wrapper: appRoot });

		fireEvent.click(screen.getByTestId('open-menu-room-b'));
		expect(screen.getByTestId('open-menu')).toHaveTextContent('Menu for Room B');

		// Room A is marked as read and leaves the list, shifting rooms B and C up.
		mockUseSideBarRoomsList.mockReturnValue(roomsListState([roomB, roomC]));
		rerender(<RoomList />);

		expect(screen.getByTestId('open-menu')).toHaveTextContent('Menu for Room B');
	});
});
