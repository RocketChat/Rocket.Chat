import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import type { MouseEvent } from 'react';
import { expect, fn } from 'storybook/test';

import Sidepanel from './Sidepanel';
import SidepanelDivider from './SidepanelDivider';
import SidepanelHeader from './SidepanelHeader';
import SidepanelHeaderTitle from './SidepanelHeaderTitle';
import SidepanelList from './SidepanelList';
import SidepanelListItem from './SidepanelListItem';
import SidepanelSection from './SidepanelSection';
import SidepanelSectionAction from './SidepanelSectionAction';
import { ariaSnapshot, computed, expectForwards, expectTabOrder, isJsdom, shellClasses } from '../../testing/g0';
import { IconButton } from '../Button';
import { SidebarItem, SidebarItemCol, SidebarItemContent, SidebarItemRow, SidebarItemTitle } from '../Sidebar';

// G0 characterization of the Sidepanel family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md. The first story covers the props a virtualizer (react-virtuoso) gives
// the Sidepanel's `List` and `Item`.
export default {
	title: 'Characterization/Sidepanel',
	component: SidepanelList,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof SidepanelList>;

type Story = StoryObj<typeof SidepanelList>;

export const VirtualizerProps: Story = {
	render: () => (
		<SidepanelList
			id='panel-list'
			data-testid='virtuoso-item-list'
			style={{ boxSizing: 'border-box', marginTop: 0, paddingTop: 120, paddingBottom: 40, visibility: 'visible' }}
		>
			<SidepanelListItem id='panel-row' style={{ overflowAnchor: 'none' }} data-index='3' data-known-size='44' data-item-index='3' />
		</SidepanelList>
	),
	play: async ({ canvasElement }) => {
		const list = canvasElement.querySelector('#panel-list') as HTMLElement;
		await expect(list).toHaveAttribute('data-testid', 'virtuoso-item-list');
		await expect(list.style.paddingTop).toBe('120px');
		await expect(list.style.paddingBottom).toBe('40px');
		await expect(list.style.marginTop).toBe('0px');
		await expect(list.style.boxSizing).toBe('border-box');
		await expect(list.style.visibility).toBe('visible');
		const row = canvasElement.querySelector('#panel-row') as HTMLElement;
		await expect(row).toHaveAttribute('role', 'listitem');
		await expect(row.style.overflowAnchor).toBe('none');
		await expect(row).toHaveAttribute('data-index', '3');
		await expect(row).toHaveAttribute('data-known-size', '44');
		await expect(row).toHaveAttribute('data-item-index', '3');
	},
};

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlers = () => ({ onClick: fn(), onKeyDown: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onFocus: fn(), onBlur: fn() });

const partNames = ['panel', 'header', 'headertitle', 'section', 'sectionaction', 'list', 'listitem'] as const;
const partHandlers = Object.fromEntries(partNames.map((name) => [name, handlers()])) as Record<
	(typeof partNames)[number],
	ReturnType<typeof handlers>
>;
const listRef = createRef<HTMLDivElement>();
const itemRef = createRef<HTMLDivElement>();

export const PartsForwarding: Story = {
	render: () => (
		<Sidepanel {...attributes('panel')} {...partHandlers.panel}>
			<SidepanelHeader {...attributes('header')} {...partHandlers.header}>
				<SidepanelHeaderTitle {...attributes('headertitle')} {...partHandlers.headertitle}>
					Title
				</SidepanelHeaderTitle>
			</SidepanelHeader>
			<SidepanelSection {...attributes('section')} {...partHandlers.section}>
				<SidepanelSectionAction {...attributes('sectionaction')} {...partHandlers.sectionaction} />
			</SidepanelSection>
			<SidepanelList {...attributes('list')} ref={listRef} {...partHandlers.list}>
				<SidepanelListItem {...attributes('listitem')} ref={itemRef} {...partHandlers.listitem} />
			</SidepanelList>
		</Sidepanel>
	),
	play: async ({ canvasElement }) => {
		const refs = { list: listRef, listitem: itemRef } as const;
		for (const name of partNames) {
			const element = canvasElement.querySelector(`#${name}-id`) as HTMLElement;
			await expect(element.tagName).toBe('DIV');
			await expectForwards(canvasElement, element, {
				...attributes(name),
				ref: name === 'list' || name === 'listitem' ? refs[name] : undefined,
				handlers: partHandlers[name],
			});
		}
		await expect(canvasElement.querySelector('#list-id')).toHaveAttribute('role', 'list');
		await expect(canvasElement.querySelector('#listitem-id')).toHaveAttribute('role', 'listitem');
		// The header's own element is the inner one, and the wrapper around it with the divider takes nothing
		await expect(canvasElement.querySelector('#header-id')).toHaveClass('rcx-sidepanel-header');
		await expect(canvasElement.querySelector('#header-id')?.parentElement).not.toHaveAttribute('id');
	},
};

export const RolesAndMarkers: Story = {
	render: () => (
		<Sidepanel role='tabpanel' aria-label='Side panel' className='rcx-sidebar__fixed-width' id='tabpanel'>
			<SidepanelHeader role='heading' aria-level={2} id='heading'>
				<input type='checkbox' id='unread-toggle' />
				<label htmlFor='unread-toggle'>Unread</label>
			</SidepanelHeader>
			<SidepanelList role='list' aria-label='Channels' id='channels' />
		</Sidepanel>
	),
	play: async ({ canvasElement }) => {
		const panel = canvasElement.querySelector('#tabpanel') as HTMLElement;
		await expect(panel).toHaveAttribute('role', 'tabpanel');
		await expect(panel).toHaveClass('rcx-sidepanel', 'rcx-sidebar__fixed-width');
		const heading = canvasElement.querySelector('#heading') as HTMLElement;
		await expect(heading).toHaveAttribute('role', 'heading');
		await expect(heading).toHaveAttribute('aria-level', '2');
		await expect(heading.querySelector('input[type=checkbox]')).toHaveAccessibleName('Unread');
		await expect(canvasElement.querySelector('#channels')).toHaveAttribute('role', 'list');
	},
};

const onPick = fn((event: MouseEvent) => event.preventDefault());

const level2Row = (name: string) => (
	<SidepanelListItem>
		<SidebarItem level={2} href={`#${name}`} onClick={onPick}>
			<SidebarItemCol>
				<SidebarItemRow>
					<SidebarItemTitle>{name}</SidebarItemTitle>
				</SidebarItemRow>
				<SidebarItemRow>
					<SidebarItemContent>Last message</SidebarItemContent>
				</SidebarItemRow>
			</SidebarItemCol>
		</SidebarItem>
	</SidepanelListItem>
);

const Panel = () => (
	<Sidepanel id='panel' role='tabpanel' aria-label='Side panel'>
		<SidepanelHeader id='header'>
			<SidepanelHeaderTitle id='header-title'>Inbox</SidepanelHeaderTitle>
			<IconButton icon='burger-menu' aria-label='Menu' id='header-menu' />
		</SidepanelHeader>
		<SidepanelSection id='section'>
			<SidepanelSectionAction id='section-action'>Filter</SidepanelSectionAction>
		</SidepanelSection>
		<SidepanelList aria-label='Channels' id='list'>
			{level2Row('general')}
			{level2Row('random')}
		</SidepanelList>
	</Sidepanel>
);

export const ClassContract: Story = {
	render: () => <Panel />,
	play: async ({ canvasElement }) => {
		await expect(shellClasses(canvasElement)).toBe(
			[
				'root > div: rcx-sidepanel',
				'root > div > div[0]: rcx-sidepanel-header-wrapper',
				'root > div > div[0] > div: rcx-sidepanel-header',
				'root > div > div[0] > div > div: rcx-sidepanel-header__title',
				'root > div > div[0] > hr: rcx-sidepanel--divider',
				'root > div > div[1]: rcx-sidepanel-section',
				'root > div > div[1] > div: rcx-sidepanel-section__action',
				'root > div > div[2]: rcx-item-group rcx-sidepanel-list',
				'root > div > div[2] > div[0]: rcx-sidepanel-list__item',
				'root > div > div[2] > div[0] > a: rcx-item rcx-sidebar-item rcx-sidebar-item--level-2',
				'root > div > div[2] > div[0] > a > div: rcx-sidebar-item__col',
				'root > div > div[2] > div[0] > a > div > div[0]: rcx-sidebar-item__row',
				'root > div > div[2] > div[0] > a > div > div[0] > div: rcx-sidebar-item__title',
				'root > div > div[2] > div[0] > a > div > div[1]: rcx-sidebar-item__row',
				'root > div > div[2] > div[0] > a > div > div[1] > div: rcx-sidebar-item__subtitle',
				'root > div > div[2] > div[1]: rcx-sidepanel-list__item',
				'root > div > div[2] > div[1] > a: rcx-item rcx-sidebar-item rcx-sidebar-item--level-2',
				'root > div > div[2] > div[1] > a > div: rcx-sidebar-item__col',
				'root > div > div[2] > div[1] > a > div > div[0]: rcx-sidebar-item__row',
				'root > div > div[2] > div[1] > a > div > div[0] > div: rcx-sidebar-item__title',
				'root > div > div[2] > div[1] > a > div > div[1]: rcx-sidebar-item__row',
				'root > div > div[2] > div[1] > a > div > div[1] > div: rcx-sidebar-item__subtitle',
			].join('\n'),
		);
		// The keyboard hook finds a row's list item as the ancestor with this role
		await expect(canvasElement.querySelector('#list a')?.closest('[role=listitem]')).not.toBeNull();
	},
};

export const DividerElements: Story = {
	render: () => (
		<>
			<SidepanelDivider />
			<SidepanelHeader id='header-line'>Title</SidepanelHeader>
		</>
	),
	play: async ({ canvasElement }) => {
		const standalone = canvasElement.querySelector('[role=separator]') as HTMLElement;
		await expect(standalone).toHaveClass('rcx-sidepanel--divider');
		const line = canvasElement.querySelector('#header-line')?.nextElementSibling as HTMLElement;
		await expect(line).toHaveClass('rcx-sidepanel--divider');
	},
};

export const Keyboard: Story = {
	render: () => <Panel />,
	play: async ({ canvasElement }) => {
		// The arrow keys of the list are the app's (`useItemListNavigation`): the rows only promise a stable Tab order
		const links = [...canvasElement.querySelectorAll<HTMLElement>('#list a')];
		await expect(links).toHaveLength(2);
		await expectTabOrder([canvasElement.querySelector('#header-menu') as HTMLElement, ...links]);
	},
};

export const AccessibilityTree: Story = {
	render: () => <Panel />,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- tabpanel "Side panel":',
				'  - text: "Inbox"',
				'  - button "Menu"',
				'  - text: "Filter"',
				'  - list "Channels":',
				'    - listitem:',
				'      - link "general Last message"',
				'    - listitem:',
				'      - link "random Last message"',
			].join('\n'),
		);
	},
};

export const ComputedLayout: Story = {
	render: () => (
		<>
			<div style={{ height: 600, width: 276 }}>
				<Panel />
			</div>
			<SidepanelList id='plain-list' />
			<SidepanelList id='virtual-list' style={{ paddingTop: 120, paddingBottom: 40 }} />
		</>
	),
	play: async ({ canvasElement }) => {
		// jsdom loads no stylesheet
		if (isJsdom()) return;
		const find = (selector: string) => canvasElement.querySelector(selector) as Element;

		const panel = find('#panel');
		await expect(computed(panel, 'display')).toBe('flex');
		await expect(computed(panel, 'flex-direction')).toBe('column');
		await expect(computed(panel, 'border-left-width')).toBe('1px');
		await expect(computed(panel, 'border-right-width')).toBe('1px');
		await expect(computed(panel, 'border-top-width')).toBe('0px');
		await expect(computed(panel, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');

		// The header is 44px tall and pulls the full-width line under it 2px up
		const header = find('#header');
		await expect(computed(header, 'height')).toBe('44px');
		await expect(computed(header, 'margin-bottom')).toBe('-2px');
		await expect(computed(header, 'padding-left')).toBe('16px');
		await expect(computed(header, 'display')).toBe('flex');
		await expect(computed(header, 'justify-content')).toBe('space-between');
		await expect(computed(find('#header-title'), 'font-weight')).toBe('700');
		await expect(computed(find('#header-title'), 'overflow')).toBe('hidden');
		await expect(computed(find('#header-title'), 'text-overflow')).toBe('ellipsis');
		const line = header.nextElementSibling as Element;
		await expect(Math.round(line.getBoundingClientRect().top - header.getBoundingClientRect().top)).toBe(42);

		await expect(computed(find('#section'), 'padding-top')).toBe('16px');
		await expect(computed(find('#section'), 'display')).toBe('flex');

		// A virtualizer's inline padding wins over the list's own
		await expect(computed(find('#plain-list'), 'padding-top')).toBe('8px');
		await expect(computed(find('#plain-list'), 'padding-bottom')).toBe('8px');
		await expect(computed(find('#virtual-list'), 'padding-top')).toBe('120px');
		await expect(computed(find('#virtual-list'), 'padding-bottom')).toBe('40px');
	},
};
