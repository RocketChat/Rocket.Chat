import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './Sidebar.stories';
import { SidebarCollapseGroup } from './SidebarCollapseGroup';
import { SidebarCollapseGroupMenu } from './SidebarCollapseGroupMenu';
import { SidebarDivider } from './SidebarDivider';
import { SidebarItem } from './SidebarItem';
import SidebarLink from './SidebarLink';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Sidebar Default story]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
	it('should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[SidebarCollapseGroup]', () => {
	it('should render an `ItemGroupHeader` whose toggle collapses a list named by the title', async () => {
		const { container } = render(
			<SidebarCollapseGroup
				title='Favorites'
				defaultExpanded
				menu={
					<SidebarCollapseGroupMenu>
						<button type='button'>Options</button>
					</SidebarCollapseGroupMenu>
				}
			>
				<div role='listitem'>general</div>
			</SidebarCollapseGroup>,
		);

		const toggle = screen.getByRole('button', { name: 'Favorites' });
		const list = screen.getByRole('list', { name: 'Favorites' });

		expect(toggle).toHaveClass('rcx-item-group-title', 'rcx-sidebar-collapse-group__bar-button');
		expect(toggle.parentElement).toHaveClass('rcx-item-group-header', 'rcx-sidebar-collapse-group__bar');
		expect(list).toHaveClass('rcx-item-group', 'rcx-sidebar-collapse-group__panel--expanded');
		expect(toggle).toHaveAttribute('aria-controls', list.id);
		expect(toggle).not.toContainElement(screen.getByRole('button', { name: 'Options' }));
		expect(screen.getByRole('button', { name: 'Options' }).closest('.rcx-item__actions')).toHaveClass('rcx-item__actions--reveal-hover');

		await userEvent.click(toggle);

		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(list).not.toHaveClass('rcx-sidebar-collapse-group__panel--expanded');

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should let clicks and keys on the toggle reach the group handlers', async () => {
		const onClick = jest.fn();
		const onKeyDown = jest.fn();
		render(
			<SidebarCollapseGroup title='Favorites' expanded={false} onClick={onClick} onKeyDown={onKeyDown}>
				<div />
			</SidebarCollapseGroup>,
		);

		const toggle = screen.getByRole('button', { name: 'Favorites' });

		await userEvent.click(toggle);
		await userEvent.tab();
		expect(toggle).toHaveFocus();
		await userEvent.keyboard('{Enter}');

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(onKeyDown).toHaveBeenCalledTimes(1);
	});
});

describe('[SidebarDivider]', () => {
	it('should render a separator as `ItemDivider`', () => {
		render(<SidebarDivider />);

		expect(screen.getByRole('separator')).toHaveClass('rcx-item-divider', 'rcx-sidebar--divider');
	});
});

describe('[Sidebar insets]', () => {
	it('should inset the collapse group header, rows and links by `md`', () => {
		render(
			<>
				<SidebarCollapseGroup title='Favorites' defaultExpanded>
					<div role='listitem'>general</div>
				</SidebarCollapseGroup>
				<SidebarItem href='#general'>general</SidebarItem>
				<SidebarLink href='#directory'>Directory</SidebarLink>
			</>,
		);

		expect(screen.getByRole('button', { name: 'Favorites' }).parentElement).toHaveClass('rcx-item-group-header--inset-md');
		expect(screen.getByRole('link', { name: 'general' })).toHaveClass('rcx-item--inset-md');
		expect(screen.getByRole('link', { name: 'Directory' })).toHaveClass('rcx-item--inset-md');
	});
});
