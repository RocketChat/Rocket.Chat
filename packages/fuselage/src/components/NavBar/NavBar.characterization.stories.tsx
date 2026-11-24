import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import NavBar from './NavBar';
import NavBarDivider from './NavBarDivider';
import NavBarGroup from './NavBarGroup';
import NavBarItem from './NavBarItem';
import NavBarSection from './NavBarSection';
import { ariaSnapshot, computed, expectForwards, expectKeyboardActivation, expectTabOrder, isJsdom, shellClasses } from '../../testing/g0';
import { Menu, MenuItem } from '../Menu';

// G0 characterization of the NavBar family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/NavBar',
	component: NavBar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NavBar>;

type Story = StoryObj<typeof NavBar>;

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlers = () => ({ onClick: fn(), onKeyDown: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onFocus: fn(), onBlur: fn() });
const navHandlers = handlers();
const sectionHandlers = handlers();
// ButtonGroup forwards the click only
const groupHandlers = { onClick: fn() };
const itemHandlers = handlers();
const childHandlers = handlers();
const itemRef = createRef<HTMLElement>();

export const PartsForwarding: Story = {
	render: () => (
		<NavBar {...attributes('nav')} {...navHandlers}>
			<NavBarSection {...attributes('section')} {...sectionHandlers}>
				<NavBarGroup {...attributes('group')} role='toolbar' {...groupHandlers}>
					<NavBarItem {...attributes('item')} ref={itemRef} icon='home' {...itemHandlers} />
				</NavBarGroup>
				<NavBarGroup>
					<NavBarItem {...attributes('child')} {...childHandlers}>
						<button type='button' className='child'>
							Child
						</button>
					</NavBarItem>
				</NavBarGroup>
			</NavBarSection>
		</NavBar>
	),
	play: async ({ canvasElement }) => {
		const nav = canvasElement.querySelector('#nav-id') as HTMLElement;
		await expect(nav.tagName).toBe('NAV');
		await expectForwards(canvasElement, nav, { ...attributes('nav'), handlers: navHandlers });
		await expect(nav).toHaveClass('rcx-navbar');

		const section = canvasElement.querySelector('#section-id') as HTMLElement;
		await expect(section.tagName).toBe('SPAN');
		await expectForwards(canvasElement, section, { ...attributes('section'), handlers: sectionHandlers });

		const group = canvasElement.querySelector('#group-id') as HTMLElement;
		await expectForwards(canvasElement, group, { ...attributes('group'), handlers: groupHandlers });
		await expect(group).toHaveAttribute('role', 'toolbar');

		const item = canvasElement.querySelector('#item-id') as HTMLElement;
		await expect(item.tagName).toBe('BUTTON');
		await expectForwards(canvasElement, item, { ...attributes('item'), ref: itemRef, handlers: itemHandlers });
		await expect(item).toHaveClass('rcx-navbar-item');

		// Without an icon the item hands everything to the element it wraps, whatever the element
		const child = canvasElement.querySelector('#child-id') as HTMLElement;
		await expect(child).toHaveTextContent('Child');
		await expectForwards(canvasElement, child, { ...attributes('child'), handlers: childHandlers });
		await expect(child).toHaveClass('child', 'rcx-navbar-item');
	},
};

export const SectionDividers: Story = {
	render: () => (
		<>
			<NavBarSection id='three'>
				<NavBarGroup>
					<NavBarItem icon='home' aria-label='Home' />
				</NavBarGroup>
				<NavBarGroup>
					<NavBarItem icon='store' aria-label='Marketplace' />
				</NavBarGroup>
				<NavBarGroup>
					<NavBarItem icon='cog' aria-label='Settings' />
				</NavBarGroup>
			</NavBarSection>
			<NavBarSection id='one'>
				<NavBarGroup>
					<NavBarItem icon='home' aria-label='Home' />
				</NavBarGroup>
				{false}
				{null}
				text between groups
			</NavBarSection>
			<NavBarSection id='empty' />
			<NavBarDivider id='divider' className='consumer-divider' />
		</>
	),
	play: async ({ canvasElement }) => {
		const dividers = (id: string) => canvasElement.querySelectorAll(`#${id} .rcx-navbar-divider`);
		// A divider goes between two groups and never after the last one
		await expect(dividers('three')).toHaveLength(2);
		await expect(dividers('one')).toHaveLength(0);
		await expect(dividers('empty')).toHaveLength(0);
		await expect(canvasElement.querySelectorAll('#three .rcx-navbar-group')).toHaveLength(3);
		await expect(canvasElement.querySelector('#divider')).toHaveClass('rcx-navbar-divider', 'consumer-divider');
	},
};

const onSelect = fn();

// What GenericMenu and Menu give their `is` component: react-aria's trigger props, the ref and the Menu's own
export const MenuTrigger: Story = {
	render: () => (
		<NavBar>
			<NavBarSection>
				<NavBarGroup>
					<Menu is={NavBarItem} icon='pencil-box' title='Create new' placement='bottom-end' onAction={onSelect}>
						<MenuItem key='dm'>Direct message</MenuItem>
						<MenuItem key='channel'>Channel</MenuItem>
						<MenuItem key='team'>Team</MenuItem>
					</Menu>
				</NavBarGroup>
			</NavBarSection>
		</NavBar>
	),
	play: async ({ canvasElement }) => {
		const trigger = canvasElement.querySelector('button') as HTMLElement;
		await expect(trigger).toHaveClass('rcx-navbar-item');
		await expect(trigger).toHaveAttribute('aria-haspopup', 'true');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(trigger).toHaveAttribute('title', 'Create new');
		await expect(trigger).toHaveAccessibleName('Create new');

		const items = () => [...document.querySelectorAll<HTMLElement>('[role=menuitem]')];
		trigger.focus();
		await userEvent.keyboard('{Enter}');
		await expect(items()).toHaveLength(3);
		await expect(items()).toContain(document.activeElement);
		const first = document.activeElement;
		await userEvent.keyboard('{ArrowDown}');
		await expect(document.activeElement).not.toBe(first);
		await expect(items()).toContain(document.activeElement);
		await userEvent.keyboard('{Escape}');
		await expect(items()).toHaveLength(0);
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await userEvent.click(trigger);
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect(items()).toHaveLength(3);
		await userEvent.click(items()[1]);
		await expect(onSelect).toHaveBeenCalledWith('channel');
		await expect(items()).toHaveLength(0);
	},
};

const onItem = fn();

export const Keyboard: Story = {
	render: () => (
		<NavBar>
			<NavBarSection>
				<NavBarGroup role='toolbar'>
					<NavBarItem icon='home' aria-label='Home' id='nav-home' onClick={onItem} />
					<NavBarItem icon='store' aria-label='Marketplace' id='nav-store' />
					<NavBarItem icon='cog' aria-label='Settings' id='nav-cog' />
				</NavBarGroup>
			</NavBarSection>
		</NavBar>
	),
	play: async ({ canvasElement }) => {
		await expectTabOrder(['#nav-home', '#nav-store', '#nav-cog'].map((selector) => canvasElement.querySelector(selector) as HTMLElement));
		await expectKeyboardActivation(canvasElement.querySelector('#nav-home') as HTMLElement, onItem);
	},
};

const Bars = () => (
	<NavBar aria-label='Navbar' id='bar'>
		<NavBarSection id='left'>
			<NavBarGroup role='toolbar' aria-label='Pages'>
				<NavBarItem icon='home' aria-label='Home' id='item-home' />
				<NavBarItem icon='store' aria-label='Marketplace' pressed />
			</NavBarGroup>
			<NavBarGroup aria-label='Tools'>
				<NavBarItem icon='cog' aria-label='Settings' />
			</NavBarGroup>
		</NavBarSection>
		<NavBarSection id='right'>
			<NavBarGroup>
				<NavBarItem icon='bell' aria-label='Notifications' />
			</NavBarGroup>
		</NavBarSection>
	</NavBar>
);

export const ClassContract: Story = {
	render: () => <Bars />,
	play: async ({ canvasElement }) => {
		await expect(shellClasses(canvasElement)).toBe(
			[
				'root > nav: rcx-navbar',
				'root > nav > span[0]: rcx-navbar-section',
				'root > nav > span[0] > div[0]: rcx-navbar-group',
				'root > nav > span[0] > div[0] > button[0]: rcx-navbar-item',
				'root > nav > span[0] > div[0] > button[1]: rcx-navbar-item',
				'root > nav > span[0] > hr: rcx-navbar-divider',
				'root > nav > span[0] > div[1]: rcx-navbar-group',
				'root > nav > span[0] > div[1] > button: rcx-navbar-item',
				'root > nav > span[1]: rcx-navbar-section',
				'root > nav > span[1] > div: rcx-navbar-group',
				'root > nav > span[1] > div > button: rcx-navbar-item',
			].join('\n'),
		);
	},
};

export const AccessibilityTree: Story = {
	render: () => <Bars />,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- navigation "Navbar":',
				'  - toolbar "Pages":',
				'    - button "Home"',
				'    - button "Marketplace"',
				'  - group "Tools":',
				'    - button "Settings"',
				'  - group:',
				'    - button "Notifications"',
			].join('\n'),
		);
	},
};

export const ComputedLayout: Story = {
	render: () => <Bars />,
	play: async ({ canvasElement }) => {
		// jsdom loads no stylesheet
		if (isJsdom()) return;
		const find = (selector: string) => canvasElement.querySelector(selector) as Element;

		const nav = find('#bar');
		await expect(computed(nav, 'display')).toBe('flex');
		await expect(computed(nav, 'justify-content')).toBe('space-between');
		await expect(computed(nav, 'align-items')).toBe('center');
		await expect(computed(nav, 'padding-top')).toBe('8px');
		await expect(computed(nav, 'padding-bottom')).toBe('8px');
		await expect(computed(nav, 'padding-left')).toBe('16px');
		await expect(computed(nav, 'padding-right')).toBe('16px');
		await expect(computed(nav, 'border-bottom-width')).toBe('1px');
		await expect(computed(nav, 'border-bottom-style')).toBe('solid');
		await expect(computed(nav, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');

		await expect(computed(find('#left'), 'display')).toBe('flex');
		await expect(computed(find('#left'), 'align-items')).toBe('center');
		await expect(computed(find('#left .rcx-navbar-divider'), 'height')).not.toBe('0px');
	},
};
