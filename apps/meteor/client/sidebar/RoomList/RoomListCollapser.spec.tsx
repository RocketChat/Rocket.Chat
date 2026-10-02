import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RoomListCollapser from './RoomListCollapser';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';

jest.mock('../../hooks/useIsEnterprise', () => ({
	useIsEnterprise: () => ({ data: { isEnterprise: true } }),
}));

jest.mock('../categories/CategoryMenu', () => ({
	__esModule: true,
	default: () => null,
}));

const makeGroup = (overrides: Partial<SidebarRoomListGroup> = {}): SidebarRoomListGroup => ({
	key: 'Channels',
	title: 'Channels',
	translateTitle: false,
	showUnreads: false,
	keepUnreadsOnTop: false,
	activityFilterHours: 24 * 7,
	inactiveCount: 4,
	showingInactive: false,
	collapsed: false,
	rooms: [],
	unreadInfo: { userMentions: 0, groupMentions: 0, tunread: [], tunreadUser: [], unread: 0 },
	empty: false,
	...overrides,
});

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Filter: 'Filter',
		Last_24_hours: 'Last 24 hours',
		Last_7_days: 'Last 7 days',
		Days_count_one: '{{count}} day',
		Days_count_other: '{{count}} days',
		Hours_count_one: '{{count}} hour',
		Hours_count_other: '{{count}} hours',
		Show_inactive_one: 'Show {{count}} inactive',
		Show_inactive_other: 'Show {{count}} inactive',
		Hide_inactive: 'Hide inactive',
	})
	.build();

const renderCollapser = (overrides: Partial<SidebarRoomListGroup> = {}) => {
	const handlers = { onClick: jest.fn(), onKeyDown: jest.fn(), onToggleInactive: jest.fn() };

	render(
		<RoomListCollapser group={makeGroup(overrides)} canMoveUp canMoveDown onMoveUp={jest.fn()} onMoveDown={jest.fn()} {...handlers} />,
		{
			wrapper: appRoot,
		},
	);

	return handlers;
};

const getChip = () => screen.getByRole('button', { name: 'Filter: Last 7 days' });

describe('the activity filter chip', () => {
	it('names the window the group is filtered by', () => {
		renderCollapser();

		expect(getChip()).toHaveTextContent('7 days');
	});

	it('shortens a one-day window to hours', () => {
		renderCollapser({ activityFilterHours: 24 });

		expect(screen.getByRole('button', { name: 'Filter: Last 24 hours' })).toHaveTextContent('24 hours');
	});

	it('names a window no preset matches by its length', () => {
		renderCollapser({ activityFilterHours: 36 });
		expect(screen.getByRole('button', { name: 'Filter: 36 hours' })).toHaveTextContent('36 hours');
	});

	it('counts a whole number of days in days', () => {
		renderCollapser({ activityFilterHours: 72 });
		expect(screen.getByRole('button', { name: 'Filter: 3 days' })).toHaveTextContent('3 days');
	});

	it('is pressed while the filter is applied, and tells how many rooms it hides', () => {
		renderCollapser();

		expect(getChip()).toHaveAttribute('aria-pressed', 'true');
		expect(getChip()).toHaveAttribute('title', 'Show 4 inactive');
	});

	it('is released while the filter is lifted for the session', () => {
		renderCollapser({ showingInactive: true });

		expect(getChip()).toHaveAttribute('aria-pressed', 'false');
		expect(getChip()).toHaveAttribute('title', 'Hide inactive');
	});

	it('toggles the filter without collapsing the group', async () => {
		const { onClick, onToggleInactive } = renderCollapser();

		await userEvent.click(getChip());

		expect(onToggleInactive).toHaveBeenCalledTimes(1);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('toggles from the keyboard without collapsing the group', async () => {
		const { onClick, onKeyDown, onToggleInactive } = renderCollapser();

		getChip().focus();
		await userEvent.keyboard('{Enter}');

		expect(onToggleInactive).toHaveBeenCalledTimes(1);
		expect(onKeyDown).not.toHaveBeenCalled();
		expect(onClick).not.toHaveBeenCalled();
	});

	it('stays while the hidden rooms are showing, so the filter can be put back', () => {
		renderCollapser({ showingInactive: true });

		expect(getChip()).toBeInTheDocument();
	});

	it('is absent when the filter hides nothing', () => {
		renderCollapser({ inactiveCount: 0 });

		expect(screen.queryByRole('button', { name: /Filter/ })).not.toBeInTheDocument();
	});

	it('is absent when the group has no filter', () => {
		renderCollapser({ activityFilterHours: undefined });

		expect(screen.queryByRole('button', { name: /Filter/ })).not.toBeInTheDocument();
	});

	it('is absent while the group is collapsed', () => {
		renderCollapser({ collapsed: true });

		expect(screen.queryByRole('button', { name: /Filter/ })).not.toBeInTheDocument();
	});
});
