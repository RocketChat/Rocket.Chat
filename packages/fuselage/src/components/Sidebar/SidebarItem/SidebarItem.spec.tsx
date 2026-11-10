import { composeStories } from '@storybook/react-webpack5';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import { SidebarItem, SidebarItemActions, SidebarItemIcon, SidebarItemLink, SidebarItemMenu, SidebarItemTitle } from '.';
import { render } from '../../../testing';
import SidebarLink from '../SidebarLink';
import * as stories from './SidebarItem.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('[SidebarItem Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render an `Item` link that keeps the `SidebarItem` classes', () => {
		const { getByRole } = render(
			<SidebarItem href='#general' selected level={2}>
				<SidebarItemTitle unread>general</SidebarItemTitle>
			</SidebarItem>,
		);

		const link = getByRole('link', { name: 'general' });
		expect(link).toHaveClass(
			'rcx-item',
			'rcx-item--selected',
			'rcx-sidebar-item',
			'rcx-sidebar-item--selected',
			'rcx-sidebar-item--level-2',
		);
		expect(link.firstElementChild).toHaveClass('rcx-item__title', 'rcx-sidebar-item__title', 'rcx-sidebar-item__title--highlighted');
	});

	it('should name the icon by its label, and hide it without one', () => {
		const { getByRole, container } = render(
			<SidebarItem href='#general'>
				<SidebarItemIcon icon='lock' label='Private channel' />
				<SidebarItemIcon icon='star' />
				<SidebarItemTitle>general</SidebarItemTitle>
			</SidebarItem>,
		);

		expect(getByRole('img', { name: 'Private channel' })).toHaveClass('rcx-item__icon', 'rcx-sidebar-item__icon');
		expect(container.querySelectorAll('.rcx-item__icon[aria-hidden="true"]')).toHaveLength(1);
	});

	it('should reveal the menu on hover and keep the `__menu` wrapper', () => {
		const { container } = render(
			<SidebarItem href='#general'>
				<SidebarItemTitle>general</SidebarItemTitle>
				<SidebarItemMenu>
					<button type='button'>Options</button>
				</SidebarItemMenu>
			</SidebarItem>,
		);

		expect(container.querySelector('.rcx-sidebar-item__menu-wrapper')).toHaveClass('rcx-item__actions', 'rcx-item__actions--reveal-hover');
		expect(container.querySelector('button')?.parentElement).toHaveClass('rcx-sidebar-item__menu');
	});

	it('should keep the `SidebarLink` title a direct child of the link', () => {
		const { getByRole } = render(
			<SidebarLink href='#home' icon='home'>
				Home
			</SidebarLink>,
		);

		const link = getByRole('link', { name: 'Home' });
		expect(link).toHaveClass('rcx-item', 'rcx-sidebar-link');
		expect(link.querySelector(':scope > .rcx-sidebar-item__title')).not.toBe(null);
	});
});

const { RoomRowCondensed, RoomRowMedium, RoomRowExtended } = composeStories(stories);

describe('[SidebarItem container rows]', () => {
	test.each([
		['condensed', RoomRowCondensed],
		['medium', RoomRowMedium],
		['extended', RoomRowExtended],
	])('should keep every button out of the links in %s rows', (_, Story) => {
		render(<Story />);

		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(4);
		links.forEach((link) => {
			expect(within(link).queryAllByRole('button')).toHaveLength(0);
		});
	});

	test.each([
		['condensed', RoomRowCondensed],
		['medium', RoomRowMedium],
		['extended', RoomRowExtended],
	])('should name each link by its title alone in %s rows', (_, Story) => {
		render(<Story />);

		expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['design-team', 'product', 'marketing', 'support']);
	});

	it('should name the link by its `aria-label` when one is given', () => {
		render(
			<SidebarItem is='div'>
				<SidebarItemTitle>
					<SidebarItemLink href='#general' aria-label='general, 3 unread'>
						general
					</SidebarItemLink>
				</SidebarItemTitle>
			</SidebarItem>,
		);

		expect(screen.getByRole('link', { name: 'general, 3 unread' })).toBeInTheDocument();
	});

	it('should render a `div` row with the link and actions beside each other', async () => {
		const onLinkClick = jest.fn();
		const onAccept = jest.fn();

		const { container } = render(
			<SidebarItem is='div' href='#ignored' highlighted>
				<SidebarItemTitle>
					<SidebarItemLink href='#support' onClick={onLinkClick}>
						support
					</SidebarItemLink>
				</SidebarItemTitle>
				<SidebarItemMenu>
					<button type='button'>Options</button>
				</SidebarItemMenu>
				<SidebarItemActions>
					<button type='button' onClick={onAccept}>
						Accept
					</button>
				</SidebarItemActions>
			</SidebarItem>,
		);

		const row = container.firstElementChild;
		expect(row?.tagName).toBe('DIV');
		expect(row).toHaveClass('rcx-item', 'rcx-sidebar-item', 'rcx-item--highlighted');
		expect(row).not.toHaveAttribute('href');
		expect(row).not.toHaveAttribute('role');

		expect(screen.getByRole('link', { name: 'support' })).toHaveClass('rcx-item__link', 'rcx-sidebar-item__link');
		expect(screen.getByRole('button', { name: 'Accept' }).closest('.rcx-item__actions')).toHaveClass('rcx-sidebar-item__actions');
		expect(screen.getByRole('button', { name: 'Accept' }).closest('.rcx-item__actions')).not.toHaveClass('rcx-item__actions--reveal-hover');

		await userEvent.click(screen.getByRole('button', { name: 'Options' }));
		await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
		expect(onLinkClick).not.toHaveBeenCalled();
		expect(onAccept).toHaveBeenCalledTimes(1);

		await userEvent.click(screen.getByRole('link', { name: 'support' }));
		expect(onLinkClick).toHaveBeenCalledTimes(1);
	});

	it('should keep rendering the default row as an anchor', () => {
		const { container } = render(
			<SidebarItem href='#general'>
				<SidebarItemTitle>general</SidebarItemTitle>
			</SidebarItem>,
		);

		const row = container.firstElementChild;
		expect(row?.tagName).toBe('A');
		expect(row).toHaveClass('rcx-item', 'rcx-sidebar-item');
		expect(row).toHaveAttribute('href', '#general');
	});
});
