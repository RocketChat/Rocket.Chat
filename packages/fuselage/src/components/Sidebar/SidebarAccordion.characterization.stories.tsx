import type { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';

import SidebarAccordion from './SidebarAccordion';
import SidebarAccordionItem from './SidebarAccordionItem';
import { SidebarItemBadge } from './SidebarItem';
import {
	ariaSnapshot,
	computed,
	expectComputed,
	expectForwards,
	expectTabOrder,
	forcePseudo,
	isJsdom,
	shellClasses,
} from '../../testing/g0';

// G0 characterization of SidebarAccordion and SidebarAccordionItem on their develop implementation. A rewrite passes these
// unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/SidebarAccordion',
	component: SidebarAccordionItem,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof SidebarAccordionItem>;

type Story = StoryObj<typeof SidebarAccordionItem>;

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlers = () => ({ onClick: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onFocus: fn(), onBlur: fn(), onKeyUp: fn() });
// `title` is the item's heading, not an attribute
const { title: _title, ...itemAttributes } = attributes('item');
const accordionHandlers = handlers();
const itemHandlers = handlers();

export const Forwarding: Story = {
	render: () => (
		<SidebarAccordion {...attributes('accordion')} {...accordionHandlers}>
			<SidebarAccordionItem {...itemAttributes} {...itemHandlers} title='Item' defaultExpanded>
				<span>body</span>
			</SidebarAccordionItem>
		</SidebarAccordion>
	),
	play: async ({ canvasElement }) => {
		const accordion = canvasElement.querySelector('#accordion-id') as HTMLElement;
		await expect(accordion.tagName).toBe('DIV');
		await expectForwards(canvasElement, accordion, { ...attributes('accordion'), handlers: accordionHandlers });
		// The children sit in a wrapper that scrolls, inside the root
		await expect(accordion.firstElementChild).toHaveClass('rcx-sidebar-accordion__wrapper');
		await expect(accordion.querySelector('.rcx-sidebar-accordion__wrapper > section')).not.toBeNull();

		const item = canvasElement.querySelector('#item-id') as HTMLElement;
		await expect(item.tagName).toBe('SECTION');
		await expectForwards(canvasElement, item, { ...itemAttributes, handlers: itemHandlers });
	},
};

const onBar = fn();

export const Collapsing: Story = {
	render: () => (
		<>
			<SidebarAccordionItem id='uncontrolled' title='Uncontrolled' badge={<SidebarItemBadge>3</SidebarItemBadge>}>
				<button type='button'>inside</button>
			</SidebarAccordionItem>
			<SidebarAccordionItem id='controlled' title='Controlled' expanded onClick={onBar}>
				<button type='button'>inside</button>
			</SidebarAccordionItem>
		</>
	),
	play: async ({ canvasElement }) => {
		const bar = (id: string) => canvasElement.querySelector(`#${id} [role=button]`) as HTMLElement;
		const panelOf = (id: string) => canvasElement.querySelector(`#${id} .rcx-sidebar-accordion-item__panel`) as HTMLElement;

		const toggle = bar('uncontrolled');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toHaveAttribute('tabindex', '0');
		await expect(toggle).toHaveAttribute('aria-controls', panelOf('uncontrolled').id);
		await expect(panelOf('uncontrolled')).not.toHaveClass('rcx-sidebar-accordion-item__panel--expanded');
		// The badge stands in for the content while it is collapsed
		await expect(canvasElement.querySelector('#uncontrolled .rcx-badge')).not.toBeNull();

		await userEvent.click(toggle);
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await expect(panelOf('uncontrolled')).toHaveClass('rcx-sidebar-accordion-item__panel--expanded');
		await expect(canvasElement.querySelector('#uncontrolled .rcx-badge')).toBeNull();
		// A click leaves the focus where the pointer was, not on the bar
		await expect(toggle).not.toHaveFocus();

		toggle.focus();
		await userEvent.keyboard('{Enter}');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await userEvent.keyboard(' ');
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// A held key does not toggle again
		await fireEvent.keyDown(toggle, { code: 'Enter', repeat: true });
		await fireEvent.keyDown(toggle, { code: 'Space', repeat: true });
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// A key pressed in the content does not
		await fireEvent.keyDown(toggle.querySelector('h5') as HTMLElement, { code: 'Enter' });
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		const controlled = bar('controlled');
		await expect(controlled).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(controlled);
		controlled.focus();
		await userEvent.keyboard('{Enter}');
		await expect(controlled).toHaveAttribute('aria-expanded', 'true');
		await expect(panelOf('controlled')).toHaveClass('rcx-sidebar-accordion-item__panel--expanded');
	},
};

export const DisabledAndNoncollapsible: Story = {
	render: () => (
		<>
			<SidebarAccordionItem id='disabled' title='Disabled' disabled defaultExpanded>
				<span>body</span>
			</SidebarAccordionItem>
			<SidebarAccordionItem id='fixed' title='Fixed' noncollapsible badge={<SidebarItemBadge>9</SidebarItemBadge>}>
				<span>body</span>
			</SidebarAccordionItem>
		</>
	),
	play: async ({ canvasElement }) => {
		const disabled = canvasElement.querySelector('#disabled [role=button]') as HTMLElement;
		await expect(disabled).toHaveClass('rcx-sidebar-accordion-item__bar--disabled');
		await expect(disabled).not.toHaveAttribute('tabindex');
		await userEvent.click(disabled);
		await fireEvent.keyDown(disabled, { code: 'Enter' });
		await expect(disabled).toHaveAttribute('aria-expanded', 'true');

		const fixed = canvasElement.querySelector('#fixed [role=button]') as HTMLElement;
		const title = fixed.querySelector('h5') as HTMLElement;
		await expect(fixed).toHaveAttribute('aria-disabled', 'true');
		await expect(fixed).toHaveAttribute('aria-expanded', 'true');
		await expect(fixed).toHaveAttribute('aria-labelledby', title.id);
		await expect(fixed).not.toHaveAttribute('tabindex');
		await expect(fixed).not.toHaveAttribute('aria-controls');
		await expect(canvasElement.querySelector('#fixed .rcx-sidebar-accordion-item__chevron')).toBeNull();
		await expect(canvasElement.querySelector('#fixed .rcx-sidebar-accordion-item__panel')).toHaveClass(
			'rcx-sidebar-accordion-item__panel--expanded',
		);
		await userEvent.click(fixed);
		await expect(fixed).toHaveAttribute('aria-expanded', 'true');
	},
};

export const Keyboard: Story = {
	render: () => (
		<SidebarAccordion>
			<SidebarAccordionItem title='First' defaultExpanded>
				<button type='button' id='first-inside'>
					inside
				</button>
			</SidebarAccordionItem>
			<SidebarAccordionItem title='Second' tabIndex={0}>
				<span>body</span>
			</SidebarAccordionItem>
		</SidebarAccordion>
	),
	play: async ({ canvasElement }) => {
		const bars = [...canvasElement.querySelectorAll<HTMLElement>('[role=button]')];
		await expectTabOrder([bars[0], canvasElement.querySelector('#first-inside') as HTMLElement, bars[1]]);
	},
};

export const ClassContract: Story = {
	render: () => (
		<SidebarAccordion className='consumer'>
			<SidebarAccordionItem title='Open' defaultExpanded badge={<SidebarItemBadge>1</SidebarItemBadge>}>
				<span>body</span>
			</SidebarAccordionItem>
			<SidebarAccordionItem title='Closed' badge={<SidebarItemBadge>1</SidebarItemBadge>} />
			<SidebarAccordionItem title='Disabled' disabled />
		</SidebarAccordion>
	),
	play: async ({ canvasElement }) => {
		// The chevron and the badge sit beside the title in an order that is not part of the contract
		const lines = shellClasses(canvasElement).split('\n');
		await expect(lines.filter((line) => line.includes('__chevron'))).toHaveLength(3);
		await expect(lines.filter((line) => line.includes('__badge'))).toHaveLength(1);
		await expect(lines.filter((line) => !line.includes('__chevron') && !line.includes('__badge')).join('\n')).toBe(
			[
				'root > div: rcx-sidebar-accordion',
				'root > div > div: rcx-sidebar-accordion__wrapper',
				'root > div > div > section[0]: rcx-sidebar-accordion-item',
				'root > div > div > section[0] > div[0]: rcx-sidebar-accordion-item__bar',
				'root > div > div > section[0] > div[0] > h5: rcx-sidebar-accordion-item__title',
				'root > div > div > section[0] > div[1]: rcx-sidebar-accordion-item__panel rcx-sidebar-accordion-item__panel--expanded',
				'root > div > div > section[1]: rcx-sidebar-accordion-item',
				'root > div > div > section[1] > div[0]: rcx-sidebar-accordion-item__bar',
				'root > div > div > section[1] > div[0] > h5: rcx-sidebar-accordion-item__title',
				'root > div > div > section[1] > div[1]: rcx-sidebar-accordion-item__panel',
				'root > div > div > section[2]: rcx-sidebar-accordion-item',
				'root > div > div > section[2] > div[0]: rcx-sidebar-accordion-item__bar rcx-sidebar-accordion-item__bar--disabled',
				'root > div > div > section[2] > div[0] > h5: rcx-sidebar-accordion-item__title',
				'root > div > div > section[2] > div[1]: rcx-sidebar-accordion-item__panel',
			].join('\n'),
		);
	},
};

export const AccessibilityTree: Story = {
	render: () => (
		<SidebarAccordion>
			<SidebarAccordionItem title='Open' defaultExpanded>
				<a href='#inside'>inside</a>
			</SidebarAccordionItem>
			<SidebarAccordionItem title='Fixed' noncollapsible>
				<a href='#fixed'>fixed</a>
			</SidebarAccordionItem>
		</SidebarAccordion>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- button "Open" [expanded]:',
				'  - heading "Open" [level=5]',
				'- link "inside"',
				'- button "Fixed" [disabled] [expanded]:',
				'  - heading "Fixed" [level=5]',
				'- link "fixed"',
			].join('\n'),
		);
	},
};

export const ComputedStates: Story = {
	render: () => (
		<SidebarAccordion>
			<SidebarAccordionItem id='open' title='Open' defaultExpanded>
				<span>body</span>
			</SidebarAccordionItem>
			<SidebarAccordionItem id='closed' title='Closed' />
			<SidebarAccordionItem id='disabled' title='Disabled' disabled />
		</SidebarAccordion>
	),
	play: async ({ canvasElement }) => {
		// jsdom loads no stylesheet
		if (isJsdom()) return;
		const find = (selector: string) => canvasElement.querySelector(selector) as HTMLElement;

		const bar = find('#open [role=button]');
		await expect(computed(bar, 'position')).toBe('sticky');
		await expect(computed(bar, 'top')).toBe('0px');
		// 8px of padding less the 1px border the interactive bar keeps for its focus ring
		await expect(computed(bar, 'padding-top')).toBe('7px');
		await expect(computed(bar, 'padding-left')).toBe('15px');
		await expect(computed(bar, 'border-top-width')).toBe('1px');
		await expect(computed(bar, 'display')).toBe('flex');
		await expect(computed(bar, 'align-items')).toBe('center');
		await expect(computed(find('#open'), 'border-bottom-width')).toBe('1px');
		await expect(computed(find('#open'), 'border-top-width')).toBe('2px');
		await expect(computed(find('#open h5'), 'font-weight')).toBe('700');

		await expect(computed(find('#open .rcx-sidebar-accordion-item__panel'), 'visibility')).toBe('visible');
		await expect(computed(find('#closed .rcx-sidebar-accordion-item__panel'), 'visibility')).toBe('hidden');
		await expect(computed(find('#closed .rcx-sidebar-accordion-item__panel'), 'height')).toBe('0px');

		// The chevron shows while the bar is hovered or focused from the keyboard
		const chevron = find('#open .rcx-sidebar-accordion-item__chevron');
		await expect(computed(chevron, 'visibility')).toBe('hidden');
		const releaseHover = forcePseudo(bar, 'hover');
		await expect(computed(chevron, 'visibility')).toBe('visible');
		releaseHover();
		await expect(computed(chevron, 'visibility')).toBe('hidden');
		const releaseFocus = forcePseudo(bar, 'focus-visible');
		await expect(computed(chevron, 'visibility')).toBe('visible');
		releaseFocus();

		// The bar transitions its colors, so each state is awaited
		const rest = computed(bar, 'background-color');
		const releaseSurface = forcePseudo(bar, 'hover');
		await waitFor(() => expect(computed(bar, 'background-color')).not.toBe(rest));
		releaseSurface();
		await expectComputed(bar, 'background-color', rest);

		const disabled = find('#disabled [role=button]');
		await expect(computed(disabled, 'cursor')).toBe('not-allowed');
		await expect(computed(disabled, 'color')).not.toBe(computed(bar, 'color'));
	},
};
