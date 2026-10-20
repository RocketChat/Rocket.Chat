import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import SidePanelItem from './SidepanelItem';
import type { SidePanelItemProps } from './SidepanelItem';

const renderItem = (props: Partial<SidePanelItemProps> = {}) =>
	render(
		<div role='list'>
			<div role='listitem'>
				<SidePanelItem
					href='/channel/general'
					selected={false}
					title='general'
					avatar={null}
					icon={null}
					unread={false}
					subtitle='Rafael: release notes are up'
					badges={<span role='status' aria-label='3 unread messages' />}
					{...props}
				/>
			</div>
		</div>,
		{ wrapper: mockAppRoot().build() },
	);

describe('SidePanelItem', () => {
	it('renders the whole row as a link to the room', () => {
		renderItem();

		const link = screen.getByRole('link', { name: 'general' });
		expect(link).toHaveAttribute('href', '/channel/general');
		expect(link).toHaveTextContent('Rafael: release notes are up');
		expect(link).toContainElement(screen.getByRole('status', { name: '3 unread messages' }));
	});

	it('marks the selected room as the current page', () => {
		renderItem({ selected: true });

		expect(screen.getByRole('link', { name: 'general' })).toHaveAttribute('aria-current', 'page');
	});

	it('has no accessibility violations', async () => {
		const { container } = renderItem();

		expect(await axe(container)).toHaveNoViolations();
	});
});
