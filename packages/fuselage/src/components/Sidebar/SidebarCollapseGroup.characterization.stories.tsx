import type { Meta, StoryObj } from '@storybook/react';
import { createRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { expect, fireEvent, fn, userEvent } from 'storybook/test';

import { SidebarCollapseGroup } from './SidebarCollapseGroup';
import { SidebarCollapseGroupMenu } from './SidebarCollapseGroupMenu';
import { SidebarItem, SidebarItemBadge, SidebarItemLink, SidebarItemTitle, SidebarListItem } from './SidebarItem';
import { ariaSnapshot, expectForwards, expectKeyboardActivation, expectTabOrder, shellClasses } from '../../testing/g0';
import { IconButton } from '../Button';

// G0 characterization of SidebarCollapseGroup, SidebarGroupTitle and SidebarCollapseGroupMenu on their develop implementation.
// A rewrite passes these unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/SidebarCollapseGroup',
	component: SidebarCollapseGroup,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof SidebarCollapseGroup>;

type Story = StoryObj<typeof SidebarCollapseGroup>;

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const row = (name: string) => (
	<SidebarListItem>
		<SidebarItem is='div'>
			<SidebarItemTitle>
				<SidebarItemLink href={`#${name}`} onClick={(event) => event.preventDefault()}>
					{name}
				</SidebarItemLink>
			</SidebarItemTitle>
		</SidebarItem>
	</SidebarListItem>
);

const rootHandlers = { onClick: fn(), onKeyDown: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onMouseLeave: fn() };
const panelRef = createRef<HTMLDivElement>();
const onPointerEnter = fn();

// The props RoomListCollapser puts on the group: the role of an older list, the toggle handlers and the label
export const RootForwarding: Story = {
	render: () => (
		<SidebarCollapseGroup
			{...attributes('group')}
			ref={panelRef}
			role='listitem'
			title='Favorites'
			defaultExpanded
			{...rootHandlers}
			onPointerEnter={onPointerEnter}
		>
			{row('general')}
		</SidebarCollapseGroup>
	),
	play: async ({ canvasElement }) => {
		const root = canvasElement.querySelector('#group-id') as HTMLElement;
		await expect(root).toHaveAttribute('role', 'listitem');
		await expectForwards(canvasElement, root, { ...attributes('group'), handlers: rootHandlers });
		await fireEvent.pointerOver(root);
		await expect(onPointerEnter).toHaveBeenCalled();
		await expect(root).toHaveClass('rcx-sidebar-collapse-group');
		// With its own label the group is not named by its title
		await expect(root).not.toHaveAttribute('aria-labelledby');

		// The ref reaches the list of rows, not the root
		await expect(panelRef.current).toHaveAttribute('role', 'list');
		await expect(root).toContainElement(panelRef.current);
		await expect(panelRef.current).not.toBe(root);
	},
};

export const DefaultRoleAndName: Story = {
	render: () => (
		<>
			<SidebarCollapseGroup title='Favorites' defaultExpanded>
				{row('general')}
			</SidebarCollapseGroup>
			<SidebarCollapseGroup title='Dragged' defaultExpanded dragging>
				{row('random')}
			</SidebarCollapseGroup>
		</>
	),
	play: async ({ canvasElement }) => {
		const [group, dragged] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-sidebar-collapse-group')];
		await expect(group).toHaveAttribute('role', 'group');
		const heading = group.querySelector('h4') as HTMLElement;
		await expect(group).toHaveAttribute('aria-labelledby', heading.id);
		await expect(group.querySelector('[role=list]')).toHaveAttribute('aria-labelledby', heading.id);
		await expect(group).not.toHaveClass('rcx-item-group--dragging');
		await expect(dragged).toHaveClass('rcx-item-group--dragging');
	},
};

const onToggle = fn();

// The group as RoomListCollapser drives it: `expanded` from the app and the toggles on the root, which the bar's events reach
const AppGroup = () => {
	const [expanded, setExpanded] = useState(true);
	const toggle = () => {
		onToggle();
		setExpanded((current) => !current);
	};
	const toggleOnEnterOrSpace = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.repeat || !['Enter', 'Space'].includes(event.code)) return;
		event.preventDefault();
		toggle();
	};
	return (
		<SidebarCollapseGroup title='Favorites' expanded={expanded} onClick={toggle} onKeyDown={toggleOnEnterOrSpace}>
			{row('general')}
		</SidebarCollapseGroup>
	);
};

export const ControlledByTheApp: Story = {
	render: () => <AppGroup />,
	play: async ({ canvasElement }) => {
		onToggle.mockClear();
		const bar = canvasElement.querySelector('[role=button]') as HTMLElement;
		const panel = () => canvasElement.querySelector('.rcx-sidebar-collapse-group__panel') as HTMLElement;
		await expect(bar).toHaveAttribute('aria-expanded', 'true');
		await expect(panel()).toHaveClass('rcx-sidebar-collapse-group__panel--expanded');

		await userEvent.click(bar);
		await expect(onToggle).toHaveBeenCalledTimes(1);
		await expect(bar).toHaveAttribute('aria-expanded', 'false');
		await expect(panel()).not.toHaveClass('rcx-sidebar-collapse-group__panel--expanded');

		bar.focus();
		await userEvent.keyboard('{Enter}');
		await expect(onToggle).toHaveBeenCalledTimes(2);
		await expect(bar).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard(' ');
		await expect(onToggle).toHaveBeenCalledTimes(3);
		await expect(bar).toHaveAttribute('aria-expanded', 'false');

		// A held key repeats the keydown, and the group must not flicker
		await fireEvent.keyDown(bar, { code: 'Enter', repeat: true });
		await expect(onToggle).toHaveBeenCalledTimes(3);
		await expect(bar).toHaveAttribute('aria-expanded', 'false');
	},
};

export const OwnCollapsing: Story = {
	render: () => (
		<>
			<SidebarCollapseGroup id='own' title='Own' defaultExpanded>
				{row('general')}
			</SidebarCollapseGroup>
			<SidebarCollapseGroup id='fixed' title='Fixed' expanded>
				{row('random')}
			</SidebarCollapseGroup>
		</>
	),
	play: async ({ canvasElement }) => {
		const bar = (id: string) => canvasElement.querySelector(`#${id} [role=button]`) as HTMLElement;
		const panel = (id: string) => canvasElement.querySelector(`#${id} .rcx-sidebar-collapse-group__panel`) as HTMLElement;

		const toggle = bar('own');
		await expect(toggle).toHaveAttribute('tabindex', '0');
		await expect(toggle).toHaveAttribute('aria-controls', panel('own').id);
		await userEvent.click(toggle);
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(panel('own')).not.toHaveClass('rcx-sidebar-collapse-group__panel--expanded');
		// A click leaves the focus where the pointer was, not on the bar
		await expect(toggle).not.toHaveFocus();

		toggle.focus();
		await userEvent.keyboard('{Enter}');
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard(' ');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.keyDown(toggle, { code: 'Space', repeat: true });
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await fireEvent.keyDown(toggle.querySelector('h4') as HTMLElement, { code: 'Enter' });
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');

		// Nothing toggles a group whose `expanded` belongs to the consumer
		await userEvent.click(bar('fixed'));
		await expect(bar('fixed')).toHaveAttribute('aria-expanded', 'true');
	},
};

const menuHandlers = { onClick: fn(), onFocus: fn(), onMouseEnter: fn() };

export const MenuForwarding: Story = {
	render: () => (
		<SidebarCollapseGroup
			title='Favorites'
			defaultExpanded
			menu={
				<SidebarCollapseGroupMenu {...attributes('menu')} {...menuHandlers}>
					<IconButton size='mini' icon='kebab' aria-label='Options' />
				</SidebarCollapseGroupMenu>
			}
		>
			{row('general')}
		</SidebarCollapseGroup>
	),
	play: async ({ canvasElement }) => {
		const menu = canvasElement.querySelector('#menu-id') as HTMLElement;
		await expectForwards(canvasElement, menu, { ...attributes('menu'), handlers: menuHandlers });
		await expect(menu).toHaveClass('rcx-item__actions--reveal-hover', 'rcx-sidebar-collapse-group__menu-wrapper');
		await expect(menu.querySelector('button')).toHaveAccessibleName('Options');
		await expect(menu.querySelector('.rcx-sidebar-collapse-group__menu')).not.toBeNull();
		const bar = canvasElement.querySelector('[role=button]') as HTMLElement;
		// The menu belongs to the header, beside the toggle and never inside it
		await expect(bar).not.toContainElement(menu);
		await expect(bar.parentElement).toContainElement(menu);
		await expect(canvasElement.querySelectorAll('.rcx-item__actions--reveal-hover button')).toHaveLength(1);
	},
};

const pinned = (root: Element) =>
	shellClasses(root)
		.split('\n')
		.map((line) => {
			const [path, classes] = line.split(': ');
			const kept = classes.split(' ').filter((name) => !/--(empty|unread)$|__heading$|__title$/.test(name));
			return kept.length ? `${path}: ${kept.join(' ')}` : null;
		})
		.filter(Boolean)
		.join('\n');

export const ClassContract: Story = {
	render: () => (
		<SidebarCollapseGroup
			title='Favorites'
			defaultExpanded
			badge={<SidebarItemBadge>1</SidebarItemBadge>}
			menu={
				<SidebarCollapseGroupMenu>
					<IconButton size='mini' icon='kebab' aria-label='Options' />
				</SidebarCollapseGroupMenu>
			}
		>
			{row('general')}
		</SidebarCollapseGroup>
	),
	play: async ({ canvasElement }) => {
		// The keyboard hook finds a group title by `rcx-item-group-title`, and its rows through the list items around them
		await expect(pinned(canvasElement)).toBe(
			[
				'root > div: rcx-sidebar-collapse-group',
				'root > div > div[0]: rcx-item-group-header rcx-sidebar-collapse-group__bar',
				'root > div > div[0] > div[0]: rcx-item-group-title rcx-sidebar-collapse-group__bar-button',
				'root > div > div[0] > div[1]: rcx-item__actions--reveal-hover rcx-sidebar-collapse-group__menu-wrapper',
				'root > div > div[0] > div[1] > div > span: rcx-sidebar-collapse-group__menu',
				'root > div > div[1]: rcx-item-group rcx-sidebar-collapse-group__panel rcx-sidebar-collapse-group__panel--expanded',
				'root > div > div[1] > div: rcx-sidebar-item__list-item',
				'root > div > div[1] > div > div: rcx-item rcx-sidebar-item rcx-sidebar-item--level-1',
				'root > div > div[1] > div > div > div > a: rcx-item__link rcx-sidebar-item__link',
			].join('\n'),
		);
		const title = canvasElement.querySelector('.rcx-item-group-title') as HTMLElement;
		await expect(title.closest('.rcx-item-group-header')).not.toBeNull();
	},
};

export const AccessibilityTree: Story = {
	render: () => (
		<>
			<SidebarCollapseGroup
				title='Favorites'
				defaultExpanded
				aria-label='Collapse Favorites'
				badge={
					<SidebarItemBadge role='status' aria-label='unread'>
						1
					</SidebarItemBadge>
				}
				menu={
					<SidebarCollapseGroupMenu>
						<IconButton size='mini' icon='kebab' aria-label='Options' />
					</SidebarCollapseGroupMenu>
				}
			>
				{row('general')}
			</SidebarCollapseGroup>
			<SidebarCollapseGroup title='Teams' defaultExpanded>
				{row('design')}
			</SidebarCollapseGroup>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group "Collapse Favorites":',
				'  - button "Favorites" [expanded]:',
				'    - heading "Favorites" [level=4]',
				'  - button "Options"',
				'  - list "Favorites":',
				'    - listitem:',
				'      - link "general"',
				'- group "Teams":',
				'  - button "Teams" [expanded]:',
				'    - heading "Teams" [level=4]',
				'  - list "Teams":',
				'    - listitem:',
				'      - link "design"',
			].join('\n'),
		);
	},
};

export const Keyboard: Story = {
	render: () => (
		<SidebarCollapseGroup
			title='Favorites'
			defaultExpanded
			menu={
				<SidebarCollapseGroupMenu>
					<IconButton size='mini' icon='kebab' aria-label='Options' id='group-menu' />
				</SidebarCollapseGroupMenu>
			}
		>
			{row('general')}
			{row('random')}
		</SidebarCollapseGroup>
	),
	play: async ({ canvasElement }) => {
		const bar = canvasElement.querySelector('[role=button]') as HTMLElement;
		const links = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-item__link')];
		await expectTabOrder([bar, canvasElement.querySelector('#group-menu') as HTMLElement, ...links]);
		const toggled = fn();
		bar.addEventListener('keydown', toggled);
		await expectKeyboardActivation(bar, toggled);
		await expect(bar).toHaveAttribute('aria-expanded', 'true');
	},
};
