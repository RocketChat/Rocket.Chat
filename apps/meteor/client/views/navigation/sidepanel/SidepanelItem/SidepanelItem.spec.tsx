import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
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
	it('links the title to the room', () => {
		renderItem();

		expect(screen.getByRole('link', { name: 'general' })).toHaveAttribute('href', '/channel/general');
	});

	it('keeps the row controls outside the link', () => {
		renderItem({
			parentRoom: <span role='button'>Parent</span>,
			menu: <button type='button'>Options</button>,
		});

		const link = screen.getByRole('link', { name: 'general' });
		act(() => link.focus());

		expect(link).not.toContainElement(screen.getByRole('status', { name: '3 unread messages' }));
		expect(link).not.toContainElement(screen.getByRole('button', { name: 'Parent' }));
		expect(link).not.toContainElement(screen.getByRole('button', { name: 'Options' }));
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
