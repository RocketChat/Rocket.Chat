import { composeStories } from '@storybook/react-webpack5';
import { axe } from 'jest-axe';

import { SidebarItem, SidebarItemIcon, SidebarItemMenu, SidebarItemTitle } from '.';
import { render } from '../../../testing';
import SidebarLink from '../SidebarLink';
import * as stories from './SidebarItem.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('[SidebarItem Component]', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const tree = render(<Story />);
		expect(tree.baseElement).toMatchSnapshot();
	});

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
