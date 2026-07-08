import { render, screen } from '@testing-library/react';
import type { ComponentProps, ElementType, ReactNode } from 'react';
import { Children, createElement, forwardRef } from 'react';

import { createSidePanel } from './SidePanelInternal';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => (key === 'Side_panel' ? 'Side panel' : key) }),
}));

jest.mock('@rocket.chat/fuselage', () => ({
	Box: ({
		alignItems: _alignItems,
		children,
		display: _display,
		fontScale: _fontScale,
		h: _h,
		htmlFor,
		is: Component = 'div',
		mie: _mie,
		withTruncatedText: _withTruncatedText,
		...props
	}: any) => (
		<Component htmlFor={htmlFor} {...props}>
			{children}
		</Component>
	),
	IconButton: ({ title, onClick }: any) => (
		<button type='button' aria-label={title} onClick={onClick}>
			{title}
		</button>
	),
	Sidepanel: ({ children, ...props }: any) => <section {...props}>{children}</section>,
	SidepanelHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	SidepanelHeaderTitle: ({ children }: any) => <span>{children}</span>,
	SidepanelList: forwardRef(({ children, ...props }: any, ref) => (
		<ul ref={ref as any} {...props}>
			{children}
		</ul>
	)),
	SidepanelListItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
	ToggleSwitch: ({ checked, id, onChange }: any) => <input id={id} type='checkbox' checked={checked} onChange={onChange} />,
}));

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useMergedRefs:
		(...refs: any[]) =>
		(node: unknown) => {
			refs.forEach((ref) => {
				if (typeof ref === 'function') {
					ref(node);
				}
			});
		},
}));

jest.mock('../../../lib/RoomManager', () => ({
	useOpenedRoom: () => 'room-2',
}));

jest.mock('../contexts/RoomsNavigationContext', () => ({
	useIsRoomFilter: () => false,
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useLayout: () => ({
		isTablet: false,
		sidePanel: {
			closeSidePanel: jest.fn(),
		},
	}),
}));

jest.mock('@rocket.chat/ui-client', () => ({
	CustomVirtuaScrollbars: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock(
	'virtua',
	() => ({
		Virtualizer: forwardRef(
			(
				{
					as: RootComponent = 'div',
					children,
					item: ItemComponent = 'div',
				}: {
					as?: ElementType;
					children: ReactNode;
					item?: ElementType;
				},
				ref,
			) =>
				createElement(
					RootComponent,
					{ ref, 'data-testid': 'sidepanel-virtua-list' },
					Children.map(children, (child, index) => createElement(ItemComponent, { index }, child)),
				),
		),
	}),
	{ virtual: true },
);

const RoomItem = ({
	room,
	openedRoom,
	isRoomFilter,
}: {
	room: { _id: string; name: string };
	openedRoom: string | undefined;
	isRoomFilter: boolean;
}) => (
	<a href={`/room/${room._id}`} aria-current={openedRoom === room._id ? 'page' : undefined} data-room-filter={isRoomFilter}>
		{room.name}
	</a>
);

const SidePanel = createSidePanel(RoomItem);

const rooms: ComponentProps<typeof SidePanel>['rooms'] = [
	{ _id: 'room-1', name: 'Alpha' },
	{ _id: 'room-2', name: 'Beta' },
];

it('renders side panel rooms through Virtua while preserving the list semantics', () => {
	render(<SidePanel title='Rooms' currentTab='all' unreadOnly={false} toggleUnreadOnly={jest.fn()} rooms={rooms} />);

	const list = screen.getByRole('list', { name: 'Channels' });

	expect(screen.getByTestId('sidepanel-virtua-list')).toBe(list);
	const listItems = screen.getAllByRole('listitem');
	expect(listItems).toHaveLength(2);
	expect(listItems[0]).not.toHaveAttribute('index');
	expect(screen.getByRole('link', { name: 'Alpha' })).toBeInTheDocument();
	expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('aria-current', 'page');
});
