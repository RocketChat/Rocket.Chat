import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomListCollapser from './RoomListCollapser';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Channels: 'Channels',
		unread_messages_counter_one: '{{count}} unread message',
		unread_messages_counter_other: '{{count}} unread messages',
	})
	.build();

const renderCollapser = ({ collapsed = false, unread = 0, onClick = jest.fn() } = {}) =>
	render(
		<RoomListCollapser
			group='channels'
			groupTitle='Channels'
			collapsedGroups={collapsed ? ['channels'] : []}
			onClick={onClick}
			unreadCount={{ userMentions: 0, groupMentions: 0, unread, tunread: [], tunreadUser: [], tunreadGroup: [] }}
		/>,
		{ wrapper: appRoot },
	);

describe('RoomListCollapser', () => {
	it('names the group after its title, leaving the state to the toggle', () => {
		renderCollapser();

		expect(screen.getByRole('group', { name: 'Channels' })).toBeInTheDocument();
	});

	it('does not point the toggle at a panel it does not render', () => {
		renderCollapser();

		expect(screen.getByRole('button', { name: 'Channels' })).not.toHaveAttribute('aria-controls');
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	it('exposes the expanded state on the toggle button', () => {
		renderCollapser({ collapsed: true });

		expect(screen.getByRole('button', { name: 'Channels' })).toHaveAttribute('aria-expanded', 'false');
	});

	it('toggles once per click and once per Enter or Space', async () => {
		const onClick = jest.fn();
		renderCollapser({ onClick });

		const toggle = screen.getByRole('button', { name: 'Channels' });
		await userEvent.click(toggle);
		toggle.focus();
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard(' ');

		expect(onClick).toHaveBeenCalledTimes(3);
	});

	it('shows the unread badge only while collapsed', () => {
		const { rerender } = renderCollapser({ unread: 2 });
		expect(screen.queryByRole('status')).not.toBeInTheDocument();

		rerender(
			<RoomListCollapser
				group='channels'
				groupTitle='Channels'
				collapsedGroups={['channels']}
				onClick={jest.fn()}
				unreadCount={{ userMentions: 0, groupMentions: 0, unread: 2, tunread: [], tunreadUser: [], tunreadGroup: [] }}
			/>,
		);

		expect(screen.getByRole('status', { name: '2 unread messages' })).toHaveTextContent('2');
	});

	it('has no accessibility violations', async () => {
		const { container } = renderCollapser({ collapsed: true, unread: 2 });

		expect(await axe(container)).toHaveNoViolations();
	});
});
