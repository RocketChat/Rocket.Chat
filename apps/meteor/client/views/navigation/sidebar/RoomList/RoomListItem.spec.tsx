import type { ItemSize } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomListItem from './RoomListItem';
import type { RoomListItemProps } from './RoomListItem';
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

describe.each<ItemSize>(['condensed', 'medium', 'extended'])('RoomListItem (%s)', (size) => {
	it('renders the room as a link to its route when it has an href', () => {
		renderItem({ size, 'href': '/channel/general', 'selected': true, 'aria-current': 'page' });

		const link = screen.getByRole('link', { name: 'general' });
		expect(link).toHaveAttribute('href', '/channel/general');
		expect(link).toHaveAttribute('aria-current', 'page');
	});

	it('renders the room as a button that runs onClick when it has no href', async () => {
		const onClick = jest.fn();
		renderItem({ size, onClick });

		await userEvent.click(screen.getByRole('button', { name: 'general' }));

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('describes the room with the icon label', () => {
		renderItem({ size, href: '/channel/general' });

		const icon = screen.getByRole('img', { name: 'Public channel' });
		expect(screen.getByRole('link', { name: 'general' })).toHaveAttribute('aria-describedby', icon.id);
	});

	it('keeps the badges and menu outside the room link', () => {
		renderItem({ size, href: '/channel/general' });

		const link = screen.getByRole('link', { name: 'general' });
		expect(link).not.toContainElement(screen.getByRole('status', { name: '3 unread messages' }));
	});

	it('has no accessibility violations', async () => {
		const { container } = renderItem({ size, href: '/channel/general' });

		expect(await axe(container)).toHaveNoViolations();
	});
});

it('shows the subtitle only in the extended size', () => {
	const { rerender } = renderItem({ size: 'condensed', href: '/channel/general' });
	expect(screen.queryByText('Rafael: release notes are up')).not.toBeInTheDocument();

	rerender(<RoomListItem room={room} title='general' href='/channel/general' size='extended' subtitle='Rafael: release notes are up' />);
	expect(screen.getByText('Rafael: release notes are up')).toBeInTheDocument();
});
