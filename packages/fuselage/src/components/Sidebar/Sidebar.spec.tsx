import { composeStories } from '@storybook/react';
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

		expect(screen.getByText('You’ve reached the limit active contacts this month')).toBeInTheDocument();
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
					<SidebarCollapseGroupMenu data-testid='menu'>
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
		// oxlint-disable-next-line testing-library/no-node-access -- the `ItemGroupHeader` has no role, label or text of its own
		expect(toggle.parentElement).toHaveClass('rcx-item-group-header', 'rcx-sidebar-collapse-group__bar');
		expect(list).toHaveClass('rcx-item-group', 'rcx-sidebar-collapse-group__panel--expanded');
		expect(toggle).toHaveAttribute('aria-controls', list.id);
		expect(toggle).not.toContainElement(screen.getByRole('button', { name: 'Options' }));
		expect(screen.getByTestId('menu')).toHaveClass('rcx-item__actions', 'rcx-item__actions--reveal-hover');

		await userEvent.click(toggle);

		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(list).not.toHaveClass('rcx-sidebar-collapse-group__panel--expanded');

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should report the next state and follow the `expanded` prop when controlled', async () => {
		const onToggle = jest.fn();
		const { rerender } = render(
			<SidebarCollapseGroup title='Favorites' expanded onToggle={onToggle}>
				<div role='listitem'>general</div>
			</SidebarCollapseGroup>,
		);

		const toggle = screen.getByRole('button', { name: 'Favorites' });

		await userEvent.click(toggle);

		expect(onToggle).toHaveBeenCalledTimes(1);
		expect(onToggle).toHaveBeenLastCalledWith(false);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		rerender(
			<SidebarCollapseGroup title='Favorites' expanded={false} onToggle={onToggle}>
				<div role='listitem'>general</div>
			</SidebarCollapseGroup>,
		);

		expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	it('should report once per Enter press and ignore repeats', async () => {
		const onToggle = jest.fn();
		render(
			<SidebarCollapseGroup title='Favorites' expanded onToggle={onToggle}>
				<div role='listitem'>general</div>
			</SidebarCollapseGroup>,
		);

		screen.getByRole('button', { name: 'Favorites' }).focus();
		await userEvent.keyboard('{Enter>2}');

		expect(onToggle).toHaveBeenCalledTimes(1);
		expect(onToggle).toHaveBeenLastCalledWith(false);
	});

	it('should toggle itself and report the next state when uncontrolled', async () => {
		const onToggle = jest.fn();
		render(
			<SidebarCollapseGroup title='Favorites' defaultExpanded onToggle={onToggle}>
				<div role='listitem'>general</div>
			</SidebarCollapseGroup>,
		);

		const toggle = screen.getByRole('button', { name: 'Favorites' });

		await userEvent.click(toggle);

		expect(onToggle).toHaveBeenLastCalledWith(false);
		expect(toggle).toHaveAttribute('aria-expanded', 'false');
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

		// oxlint-disable-next-line testing-library/no-node-access -- the `ItemGroupHeader` has no role, label or text of its own
		expect(screen.getByRole('button', { name: 'Favorites' }).parentElement).toHaveClass('rcx-item-group-header--inset-md');
		expect(screen.getByRole('link', { name: 'general' })).toHaveClass('rcx-item--inset-md');
		expect(screen.getByRole('link', { name: 'Directory' })).toHaveClass('rcx-item--inset-md');
	});
});
