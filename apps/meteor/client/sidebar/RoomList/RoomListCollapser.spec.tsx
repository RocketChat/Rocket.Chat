import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomListCollapser from './RoomListCollapser';
import type { SidebarRoomListGroup } from '../hooks/useRoomList';

jest.mock('../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: () => ({ data: true }),
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

const renderCollapser = (group: SidebarRoomListGroup, onClick = jest.fn()) =>
	render(
		<RoomListCollapser group={group} canMoveUp={false} canMoveDown={false} onMoveUp={jest.fn()} onMoveDown={jest.fn()} onClick={onClick} />,
		{ wrapper: mockAppRoot().build() },
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

	it('has no a11y violations', async () => {
		const { container } = renderCollapser(makeGroup(true, 2));

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
