import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';

import RoomListCollapser from './RoomListCollapser';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';

jest.mock('../../hooks/useIsEnterprise', () => ({
	useIsEnterprise: () => ({ data: { isEnterprise: true } }),
}));

jest.mock('../categories/CategoryMenu', () => ({
	__esModule: true,
	default: () => (
		<button type='button' aria-label='Options'>
			menu
		</button>
	),
}));

const makeGroup = (collapsed: boolean, unread = 0) =>
	({
		key: 'Channels',
		title: 'Channels',
		translateTitle: false,
		showUnreads: false,
		keepUnreadsOnTop: false,
		collapsed,
		rooms: [],
		unreadInfo: { userMentions: 0, groupMentions: 0, unread, tunread: [], tunreadUser: [] },
	}) as unknown as SidebarRoomListGroup;

const AppRoot = mockAppRoot().build();

const ListWrapper = ({ children }: { children: ReactNode }) => (
	<AppRoot>
		<div role='list'>{children}</div>
	</AppRoot>
);

const renderCollapser = (group: SidebarRoomListGroup, onClick = jest.fn()) =>
	render(
		<RoomListCollapser
			group={group}
			canMoveUp={false}
			canMoveDown={false}
			onMoveUp={jest.fn()}
			onMoveDown={jest.fn()}
			onToggleInactive={jest.fn()}
			onActivityFilterChange={jest.fn()}
			onClick={onClick}
		/>,
		{ wrapper: ListWrapper },
	);

describe('RoomListCollapser', () => {
	it('exposes the expanded state on the header button', () => {
		renderCollapser(makeGroup(false));

		expect(screen.getByRole('button', { name: 'Channels' })).toHaveAttribute('aria-expanded', 'true');
	});

	it('toggles the group from the header button', async () => {
		const onClick = jest.fn();
		renderCollapser(makeGroup(true), onClick);

		const button = screen.getByRole('button', { name: 'Channels' });
		expect(button).toHaveAttribute('aria-expanded', 'false');

		await userEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('toggles the group once per Enter key press', async () => {
		const onClick = jest.fn();
		renderCollapser(makeGroup(false), onClick);

		screen.getByRole('button', { name: 'Channels' }).focus();
		await userEvent.keyboard('{Enter}');

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('shows the unread badge only while collapsed', () => {
		const { rerender } = renderCollapser(makeGroup(false, 2));
		expect(screen.queryByRole('status')).not.toBeInTheDocument();

		rerender(
			<RoomListCollapser
				group={makeGroup(true, 2)}
				canMoveUp={false}
				canMoveDown={false}
				onMoveUp={jest.fn()}
				onMoveDown={jest.fn()}
				onToggleInactive={jest.fn()}
				onActivityFilterChange={jest.fn()}
				onClick={jest.fn()}
			/>,
		);
		expect(screen.getByRole('status')).toBeInTheDocument();
	});

	it('keeps the category menu outside the header button', async () => {
		renderCollapser(makeGroup(false));

		screen.getByRole('button', { name: 'Channels' }).focus();

		const menu = await screen.findByRole('button', { name: 'Options' });
		expect(screen.getByRole('button', { name: 'Channels' })).not.toContainElement(menu);
	});

	it('does not toggle the group from the category menu', async () => {
		const onClick = jest.fn();
		renderCollapser(makeGroup(false), onClick);

		screen.getByRole('button', { name: 'Channels' }).focus();

		const menu = await screen.findByRole('button', { name: 'Options' });
		await userEvent.click(menu);
		menu.focus();
		await userEvent.keyboard('{Enter}');

		expect(onClick).not.toHaveBeenCalled();
	});

	it('has no a11y violations', async () => {
		const { container } = renderCollapser(makeGroup(true, 2));

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

const makeFilteredGroup = (overrides: Partial<SidebarRoomListGroup> = {}): SidebarRoomListGroup =>
	({
		...makeGroup(false),
		activityFilterHours: 24 * 7,
		inactiveCount: 4,
		showingInactive: false,
		empty: false,
		...overrides,
	}) as SidebarRoomListGroup;

const FilterAppRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Activity_filter_label: 'Filter: {{filter}}',
		Last_24_hours: 'Last 24 hours',
		Last_7_days: 'Last 7 days',
		Days_count_one: '{{count}} day',
		Days_count_other: '{{count}} days',
		Hours_count_one: '{{count}} hour',
		Hours_count_other: '{{count}} hours',
		Show_inactive_one: 'Show {{count}} inactive',
		Show_inactive_other: 'Show {{count}} inactive',
		Hide_inactive: 'Hide inactive',
		No_inactive_rooms_hidden: 'No inactive rooms hidden',
	})
	.build();

const FilterListWrapper = ({ children }: { children: ReactNode }) => (
	<FilterAppRoot>
		<div role='list'>{children}</div>
	</FilterAppRoot>
);

const renderFilteredCollapser = (overrides: Partial<SidebarRoomListGroup> = {}) => {
	const handlers = { onClick: jest.fn(), onToggleInactive: jest.fn(), onActivityFilterChange: jest.fn() };

	render(
		<RoomListCollapser
			group={makeFilteredGroup(overrides)}
			canMoveUp
			canMoveDown
			onMoveUp={jest.fn()}
			onMoveDown={jest.fn()}
			{...handlers}
		/>,
		{ wrapper: FilterListWrapper },
	);

	return handlers;
};

const getChip = () => screen.getByRole('button', { name: 'Filter: Last 7 days' });

describe('the activity filter chip', () => {
	it('names the window the group is filtered by', () => {
		renderFilteredCollapser();

		expect(getChip()).toHaveTextContent('7 days');
	});

	it('shortens a one-day window to hours', () => {
		renderFilteredCollapser({ activityFilterHours: 24 });

		expect(screen.getByRole('button', { name: 'Filter: Last 24 hours' })).toHaveTextContent('24 hours');
	});

	it('names a window no preset matches by its length', () => {
		renderFilteredCollapser({ activityFilterHours: 36 });
		expect(screen.getByRole('button', { name: 'Filter: 36 hours' })).toHaveTextContent('36 hours');
	});

	it('counts a whole number of days in days', () => {
		renderFilteredCollapser({ activityFilterHours: 72 });
		expect(screen.getByRole('button', { name: 'Filter: 3 days' })).toHaveTextContent('3 days');
	});

	it('is pressed while the filter is applied, and tells how many rooms it hides', () => {
		renderFilteredCollapser();

		expect(getChip()).toHaveAttribute('aria-pressed', 'true');
		expect(getChip()).toHaveAttribute('title', 'Show 4 inactive');
	});

	it('is released while the filter is lifted for the session', () => {
		renderFilteredCollapser({ showingInactive: true });

		expect(getChip()).toHaveAttribute('aria-pressed', 'false');
		expect(getChip()).toHaveAttribute('title', 'Hide inactive');
	});

	it('toggles the filter without collapsing the group', async () => {
		const { onClick, onToggleInactive } = renderFilteredCollapser();

		await userEvent.click(getChip());

		expect(onToggleInactive).toHaveBeenCalledTimes(1);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('toggles from the keyboard without collapsing the group', async () => {
		const { onClick, onToggleInactive } = renderFilteredCollapser();

		getChip().focus();
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard(' ');

		expect(onToggleInactive).toHaveBeenCalledTimes(2);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('stays while the hidden rooms are showing, so the filter can be put back', () => {
		renderFilteredCollapser({ showingInactive: true });

		expect(getChip()).toBeInTheDocument();
	});

	it('stays as a sign, disabled, when the filter hides nothing', () => {
		renderFilteredCollapser({ inactiveCount: 0 });

		expect(getChip()).toBeDisabled();
		expect(getChip()).toHaveAttribute('aria-pressed', 'true');
		expect(getChip()).toHaveAttribute('title', 'No inactive rooms hidden');
	});

	it('is absent when the group has no filter', () => {
		renderFilteredCollapser({ activityFilterHours: undefined });

		expect(screen.queryByRole('button', { name: /Filter/ })).not.toBeInTheDocument();
	});

	it('is absent while the group is collapsed', () => {
		renderFilteredCollapser({ collapsed: true });

		expect(screen.queryByRole('button', { name: /Filter/ })).not.toBeInTheDocument();
	});

	it('has no a11y violations', async () => {
		const { container } = render(
			<RoomListCollapser
				group={makeFilteredGroup()}
				canMoveUp
				canMoveDown
				onMoveUp={jest.fn()}
				onMoveDown={jest.fn()}
				onToggleInactive={jest.fn()}
				onActivityFilterChange={jest.fn()}
				onClick={jest.fn()}
			/>,
			{ wrapper: FilterListWrapper },
		);

		expect(await axe(container)).toHaveNoViolations();
	});
});
