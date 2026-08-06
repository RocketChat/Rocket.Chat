import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import type { ElementType, ReactNode } from 'react';
import { Children, createElement, forwardRef } from 'react';

import * as stories from './SidePanelInternal.stories';

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => (key === 'Side_panel' ? 'Side panel' : key) }),
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

const composed = composeStories(stories);
const testCases = Object.values(composed).map((Story) => [Story.storyName || 'Story', Story] as const);

// Intentionally not snapshotting `baseElement`: SidePanelInternal renders a `useId()`-derived
// id for the unread toggle label, which shifts with render order/count across the file and
// would make a whole-tree snapshot flaky (e.g. running a single story in isolation). Assert on
// semantics instead, per the story-specific tests below.
test.each(testCases)('renders %s without crashing', (_storyName, Story) => {
	render(<Story />);
	expect(screen.getByRole('tabpanel', { name: 'Side panel' })).toBeInTheDocument();
});

describe('SidePanelInternal', () => {
	it('renders side panel rooms through Virtua while preserving the list semantics', () => {
		const { Default } = composed;
		render(<Default />);

		const list = screen.getByRole('list', { name: 'Channels' });

		expect(screen.getByTestId('sidepanel-virtua-list')).toBe(list);
		const listItems = screen.getAllByRole('listitem');
		expect(listItems).toHaveLength(2);
		expect(listItems[0]).not.toHaveAttribute('index');
		expect(listItems[0]).toHaveTextContent('Alpha');
		expect(listItems[1]).toHaveTextContent('Beta');
		expect(screen.getByRole('link', { name: 'Alpha' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('aria-current', 'page');
	});

	it('renders the no-results state alongside an empty list when there are no rooms', () => {
		const { Empty } = composed;
		render(<Empty />);

		expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
		expect(screen.getByText('No_rooms')).toBeInTheDocument();
	});
});
