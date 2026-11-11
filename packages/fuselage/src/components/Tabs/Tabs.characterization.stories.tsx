import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import Tabs from './Tabs';
import TabsItem from './TabsItem';
import {
	ariaSnapshot,
	classContract,
	computed,
	expectComputed,
	expectForwards,
	expectKeyboardActivation,
	expectTabOrder,
	forcePseudo,
	isJsdom,
} from '../../testing/g0';

// G0 characterization of Tabs and TabsItem on their develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Tabs',
	component: Tabs,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs>;

type Story = StoryObj<typeof Tabs>;

const tabsRef = createRef<HTMLDivElement>();
const itemRef = createRef<HTMLButtonElement>();

export const Forwarding: Story = {
	render: () => (
		<Tabs
			ref={tabsRef}
			className='consumer-class'
			id='tabs-id'
			title='tabs title'
			data-qa='tabs-qa'
			data-anything='anything'
			aria-label='tabs label'
		>
			<TabsItem
				ref={itemRef}
				className='item-class'
				id='item-id'
				title='item title'
				data-qa='item-qa'
				data-anything='item-anything'
				aria-label='item label'
			>
				One
			</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-tabs', {
			'className': 'consumer-class',
			'id': 'tabs-id',
			'title': 'tabs title',
			'data-qa': 'tabs-qa',
			'data-anything': 'anything',
			'aria-label': 'tabs label',
			'ref': tabsRef,
		});
		await expectForwards(canvasElement, '.rcx-tabs__item', {
			'className': 'item-class',
			'id': 'item-id',
			'title': 'item title',
			'data-qa': 'item-qa',
			'data-anything': 'item-anything',
			'aria-label': 'item label',
			'ref': itemRef,
		});
		await expect(canvasElement.querySelector('.rcx-tabs')?.tagName).toBe('DIV');
		await expect(canvasElement.querySelector('.rcx-tabs__item')?.tagName).toBe('BUTTON');
	},
};

const onClick = fn();
const onFocus = fn();
const onBlur = fn();
const onMouseEnter = fn();
const onMouseLeave = fn();
const onKeyDown = fn();
const onTabsClick = fn();

export const Handlers: Story = {
	render: () => (
		<Tabs onClick={onTabsClick}>
			<TabsItem
				onClick={onClick}
				onFocus={onFocus}
				onBlur={onBlur}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				onKeyDown={onKeyDown}
			>
				One
			</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-tabs__item', {
			handlers: { onClick, onFocus, onBlur, onMouseEnter, onMouseLeave, onKeyDown },
		});

		onTabsClick.mockClear();
		await userEvent.click(canvasElement.querySelector('.rcx-tabs__item') as HTMLElement);
		await expect(onTabsClick).toHaveBeenCalled();
	},
};

export const DisabledFiresNothing: Story = {
	render: () => (
		<Tabs>
			<TabsItem disabled onClick={onClick}>
				Disabled
			</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		const item = canvasElement.querySelector('.rcx-tabs__item') as HTMLButtonElement;
		onClick.mockClear();
		await expect(item).toBeDisabled();
		await userEvent.click(item);
		await expect(onClick).not.toHaveBeenCalled();
	},
};

export const Roles: Story = {
	render: () => (
		<Tabs>
			<TabsItem selected>Selected</TabsItem>
			<TabsItem>Idle</TabsItem>
			<TabsItem role='option' aria-selected='true'>
				Overridden
			</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		const wrapper = canvasElement.querySelector('.rcx-tabs__wrapper') as HTMLElement;
		await expect(wrapper).toHaveAttribute('role', 'tablist');

		const [selected, idle, overridden] = [...canvasElement.querySelectorAll('.rcx-tabs__item')];
		await expect(selected).toHaveAttribute('role', 'tab');
		await expect(selected).toHaveAttribute('aria-selected', 'true');
		await expect(idle).toHaveAttribute('role', 'tab');
		await expect(idle).toHaveAttribute('aria-selected', 'false');
		await expect(overridden).toHaveAttribute('role', 'option');
		await expect(overridden).toHaveAttribute('aria-selected', 'true');
	},
};

export const KeyboardActivation: Story = {
	render: () => (
		<Tabs>
			<TabsItem onClick={onClick}>One</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		await expectKeyboardActivation(canvasElement.querySelector('.rcx-tabs__item') as HTMLElement, onClick);
	},
};

export const TabOrder: Story = {
	render: () => (
		<Tabs>
			<TabsItem selected>One</TabsItem>
			<TabsItem disabled>Two</TabsItem>
			<TabsItem>Three</TabsItem>
			<TabsItem>Four</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		const [one, , three, four] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-tabs__item')];
		// Every enabled tab is a tab stop, and a disabled one is skipped
		await expectTabOrder([one, three, four]);
	},
};

// The tabs are native buttons in the tab order: no arrow-key model moves focus between them
export const ArrowKeysLeaveFocus: Story = {
	render: () => (
		<Tabs>
			<TabsItem selected>One</TabsItem>
			<TabsItem>Two</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		const [one] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-tabs__item')];
		one.focus();
		await userEvent.keyboard('{ArrowRight}');
		await expect(one).toHaveFocus();
	},
};

const everyVariation = (
	<div style={{ width: 400 }}>
		<Tabs>
			<TabsItem>Idle</TabsItem>
			<TabsItem selected>Selected</TabsItem>
			<TabsItem disabled>Disabled</TabsItem>
			<TabsItem selected disabled>
				Both
			</TabsItem>
		</Tabs>
		<Tabs divider={false}>
			<TabsItem selected>Flat</TabsItem>
		</Tabs>
		<Tabs stretch>
			<TabsItem selected>Stretched</TabsItem>
		</Tabs>
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- tablist:',
				'  - tab "Idle" [selected=false]',
				'  - tab "Selected" [selected]',
				'  - tab "Disabled" [disabled] [selected=false]',
				'  - tab "Both" [disabled] [selected]',
				'- tablist:',
				'  - tab "Flat" [selected]',
				'- tablist:',
				'  - tab "Stretched" [selected]',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > div[0]: rcx-box rcx-box--full rcx-tabs rcx-tabs--with-divider',
				'root > div > div[0] > div: rcx-box rcx-box--full rcx-tabs__scroll-box',
				'root > div > div[0] > div > div: rcx-box rcx-box--full rcx-tabs__wrapper',
				'root > div > div[0] > div > div > button[0]: rcx-box rcx-box--full rcx-tabs__item',
				'root > div > div[0] > div > div > button[1]: rcx-box rcx-box--full rcx-tabs__item rcx-tabs__item--selected',
				'root > div > div[0] > div > div > button[2]: rcx-box rcx-box--full rcx-tabs__item rcx-tabs__item--disabled',
				'root > div > div[0] > div > div > button[3]: rcx-box rcx-box--full rcx-tabs__item rcx-tabs__item--disabled rcx-tabs__item--selected rcx-tabs__item--selected--disabled',
				'root > div > div[1]: rcx-box rcx-box--full rcx-tabs',
				'root > div > div[1] > div: rcx-box rcx-box--full rcx-tabs__scroll-box',
				'root > div > div[1] > div > div: rcx-box rcx-box--full rcx-tabs__wrapper',
				'root > div > div[1] > div > div > button: rcx-box rcx-box--full rcx-tabs__item rcx-tabs__item--selected',
				'root > div > div[2]: rcx-box rcx-box--full rcx-tabs rcx-tabs--stretch rcx-tabs--with-divider',
				'root > div > div[2] > div: rcx-box rcx-box--full rcx-tabs__scroll-box',
				'root > div > div[2] > div > div: rcx-box rcx-box--full rcx-tabs__wrapper',
				'root > div > div[2] > div > div > button: rcx-box rcx-box--full rcx-tabs__item rcx-tabs__item--selected',
			].join('\n'),
		);
	},
};

// The underline under a hovered tab is 1px wide whenever the tabs have a divider: the divider rule comes later in the
// stylesheet than the hover rule, at the same specificity. Only a tab bar without divider gets the wider underline.
export const HoverUnderlineWidth: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<div id='with-divider'>
				<Tabs>
					<TabsItem>Idle</TabsItem>
				</Tabs>
			</div>
			<div id='without-divider'>
				<Tabs divider={false}>
					<TabsItem>Idle</TabsItem>
				</Tabs>
			</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const withDivider = canvasElement.querySelector('#with-divider .rcx-tabs__item') as HTMLElement;
		const withoutDivider = canvasElement.querySelector('#without-divider .rcx-tabs__item') as HTMLElement;

		await expect(computed(withDivider, 'border-bottom-width')).toBe('1px');
		await expect(computed(withoutDivider, 'border-bottom-width')).toBe('1px');

		const restColor = computed(withDivider, 'color');
		forcePseudo(withDivider, 'hover');
		forcePseudo(withoutDivider, 'hover');
		await expectComputed(withDivider, 'border-bottom-width', '1px');
		await expectComputed(withoutDivider, 'border-bottom-width', '4px');
		await expect(computed(withDivider, 'color')).not.toBe(restColor);
		await expect(computed(withDivider, 'border-bottom-color')).toBe(computed(withDivider, 'color'));
	},
};

export const DividerOverlap: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<div id='with-divider'>
				<Tabs>
					<TabsItem selected>Selected</TabsItem>
				</Tabs>
			</div>
			<div id='without-divider'>
				<Tabs divider={false}>
					<TabsItem selected>Selected</TabsItem>
				</Tabs>
			</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const withDivider = canvasElement.querySelector('#with-divider .rcx-tabs__item') as HTMLElement;
		const withoutDivider = canvasElement.querySelector('#without-divider .rcx-tabs__item') as HTMLElement;

		// With a divider each tab overlaps it by 1px, and the tab bar draws it
		await expect(computed(withDivider, 'margin-bottom')).toBe('-1px');
		await expect(computed(withoutDivider, 'margin-bottom')).toBe('0px');
		await expect(computed(canvasElement.querySelector('#with-divider .rcx-tabs') as Element, 'border-bottom-width')).toBe('1px');
		await expect(computed(canvasElement.querySelector('#without-divider .rcx-tabs') as Element, 'border-bottom-width')).toBe('0px');
	},
};

export const SelectedAndDisabledStates: Story = {
	render: () => (
		<Tabs>
			<TabsItem>Idle</TabsItem>
			<TabsItem selected>Selected</TabsItem>
			<TabsItem disabled>Disabled</TabsItem>
			<TabsItem selected disabled>
				Both
			</TabsItem>
		</Tabs>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const [idle, selected, disabled, both] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-tabs__item')];

		await expect(computed(disabled, 'cursor')).toBe('not-allowed');
		await expect(computed(both, 'cursor')).toBe('not-allowed');
		await expect(computed(idle, 'cursor')).toBe('pointer');
		await expect(computed(selected, 'cursor')).toBe('pointer');

		// The selected tab shows its underline in its own colour, and a plain one has none
		await expect(computed(selected, 'border-bottom-color')).toBe(computed(selected, 'color'));
		await expect(computed(idle, 'border-bottom-color')).toBe('rgba(0, 0, 0, 0)');

		// A disabled tab does not take the hover colour
		const rest = computed(disabled, 'color');
		forcePseudo(disabled, 'hover');
		await expect(computed(disabled, 'color')).toBe(rest);
		const restBoth = computed(both, 'border-bottom-color');
		forcePseudo(both, 'hover');
		await expect(computed(both, 'border-bottom-color')).toBe(restBoth);
	},
};

export const StretchGrowsItems: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<Tabs stretch>
				<TabsItem selected>One</TabsItem>
				<TabsItem>Two</TabsItem>
			</Tabs>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const [one, two] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-tabs__item')];
		await expect(computed(canvasElement.querySelector('.rcx-tabs') as Element, 'flex-direction')).toBe('column');
		await expect(computed(one, 'flex-grow')).toBe('1');
		await expect(computed(two, 'text-align')).toBe('center');
	},
};
