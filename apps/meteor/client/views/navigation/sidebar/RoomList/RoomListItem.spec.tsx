import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomListItem from './RoomListItem';
import type { RoomListItemProps, RoomListItemViewMode } from './RoomListItem';
import { createFakeSubscription } from '../../../../../tests/mocks/data';

const room = createFakeSubscription({ t: 'c', name: 'general', fname: 'general' });

const renderItem = (props: Partial<RoomListItemProps> = {}) =>
	render(
		<div role='list'>
			<div role='listitem'>
				<RoomListItem
					room={room}
					title='general'
					icon={<i className='icon' />}
					iconLabel='Public channel'
					badges={<span role='status' aria-label='3 unread messages' />}
					menu={
						<button type='button' aria-label='Options'>
							menu
						</button>
					}
					subtitle='Rafael: release notes are up'
					{...(props as object)}
				/>
			</div>
		</div>,
		{ wrapper: mockAppRoot().build() },
	);

describe.each<RoomListItemViewMode>(['condensed', 'medium', 'extended'])('RoomListItem (%s)', (viewMode) => {
	it('renders the room as a link to its route when it has an href', () => {
		renderItem({ viewMode, 'href': '/channel/general', 'selected': true, 'aria-current': 'page' });

		const link = screen.getByRole('link', { name: 'general' });
		expect(link).toHaveAttribute('href', '/channel/general');
		expect(link).toHaveAttribute('aria-current', 'page');
	});

	it('renders the room as a button that runs onClick when it has no href', async () => {
		const onClick = jest.fn();
		renderItem({ viewMode, onClick });

		await userEvent.click(screen.getByRole('button', { name: 'general' }));

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('describes the room with the icon label', () => {
		renderItem({ viewMode, href: '/channel/general' });

		const icon = screen.getByRole('img', { name: 'Public channel' });
		expect(screen.getByRole('link', { name: 'general' })).toHaveAttribute('aria-describedby', icon.id);
	});

	it('runs onClick when the room link is clicked', async () => {
		const onClick = jest.fn((event: Event) => event.preventDefault());
		renderItem({ viewMode, href: '/channel/general', onClick: onClick as unknown as RoomListItemProps['onClick'] });

		await userEvent.click(screen.getByRole('link', { name: 'general' }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('hides the avatar when showAvatar is false', () => {
		const { rerender } = renderItem({ viewMode, href: '/channel/general' });
		expect(screen.getByRole('figure')).toBeInTheDocument();

		rerender(<RoomListItem room={room} title='general' href='/channel/general' viewMode={viewMode} showAvatar={false} />);
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
	});

	it('keeps the badges and menu outside the room link', () => {
		renderItem({ viewMode, href: '/channel/general' });

		const link = screen.getByRole('link', { name: 'general' });
		expect(link).not.toContainElement(screen.getByRole('status', { name: '3 unread messages' }));
	});

	it('has no accessibility violations', async () => {
		const { container } = renderItem({ viewMode, href: '/channel/general' });

		expect(await axe(container)).toHaveNoViolations();
	});
});

it('shows the subtitle only in the extended view mode', () => {
	const { rerender } = renderItem({ viewMode: 'condensed', href: '/channel/general' });
	expect(screen.queryByText('Rafael: release notes are up')).not.toBeInTheDocument();

	rerender(
		<RoomListItem room={room} title='general' href='/channel/general' viewMode='extended' subtitle='Rafael: release notes are up' />,
	);
	expect(screen.getByText('Rafael: release notes are up')).toBeInTheDocument();
});
