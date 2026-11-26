import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import Bubble from './Bubble';
import { ariaSnapshot, classContract, computed, expectForwards, expectKeyboardActivation, forcePseudo, isJsdom } from '../../testing/g0';

// G0 characterization of Bubble on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Bubble',
	component: Bubble,
	tags: ['g0', '!autodocs'],
	args: { children: 'Label' },
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Bubble>;

type Story = StoryObj<typeof Bubble>;

const el = (root: ParentNode, selector: string) => root.querySelector(selector) as HTMLElement;

// Hyphenated keys of a props object are checked against the type, unlike the ones of JSX
const dataQa = (value: string) => ({ 'data-qa': value });

const onClick = fn();
const onDismiss = fn();
const onMouseEnter = fn();
const onMouseLeave = fn();
const onFocus = fn();

export const Forwarding: Story = {
	render: () => (
		<Bubble
			className='consumer-class'
			id='bubble-id'
			title='bubble title'
			data-qa='bubble-qa'
			data-anything='anything'
			aria-label='bubble label'
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onFocus={onFocus}
			onClick={onClick}
			onDismiss={onDismiss}
			contentProps={{
				'className': 'content-class',
				'id': 'content-id',
				...dataQa('content-qa'),
				'aria-label': 'content label',
				'title': 'content title',
			}}
			dismissProps={{ className: 'dismiss-class', id: 'dismiss-id', ...dataQa('dismiss-qa'), title: 'dismiss title' }}
		>
			Label
		</Bubble>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-bubble', {
			'className': 'consumer-class',
			'id': 'bubble-id',
			'title': 'bubble title',
			'data-qa': 'bubble-qa',
			'data-anything': 'anything',
			'aria-label': 'bubble label',
			'handlers': { onMouseEnter, onMouseLeave, onFocus },
		});
		await expectForwards(canvasElement, '#content-id', {
			'className': 'content-class',
			'title': 'content title',
			'data-qa': 'content-qa',
			'aria-label': 'content label',
			'handlers': { onClick },
		});
		await expectForwards(canvasElement, '#dismiss-id', {
			'className': 'dismiss-class',
			'title': 'dismiss title',
			'data-qa': 'dismiss-qa',
			'handlers': { onClick: onDismiss },
		});
	},
};

export const ItemForwarding: Story = {
	render: () => (
		<Bubble contentProps={{ className: 'content-class', id: 'content-id', title: 'content title', ...dataQa('content-qa') }}>Label</Bubble>
	),
	play: async ({ canvasElement }) => {
		const item = el(canvasElement, '#content-id');
		await expect(item.tagName).toBe('SPAN');
		await expectForwards(canvasElement, item, { 'className': 'content-class', 'title': 'content title', 'data-qa': 'content-qa' });
	},
};

export const Clicks: Story = {
	render: () => (
		<>
			<Bubble onClick={onClick}>Click me</Bubble>
			<Bubble onClick={onClick} onDismiss={onDismiss}>
				Dismiss me
			</Bubble>
			<Bubble>Static</Bubble>
		</>
	),
	play: async ({ canvasElement }) => {
		onClick.mockClear();
		onDismiss.mockClear();
		const [clickable, grouped, plain] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-bubble')];

		await userEvent.click(el(clickable, 'button'));
		await expect(onClick).toHaveBeenCalledTimes(1);

		// The dismiss button reports on its own and does not fire the label's handler
		await userEvent.click(el(grouped, 'button[aria-label="Dismiss Dismiss me"]'));
		await expect(onDismiss).toHaveBeenCalledTimes(1);
		await expect(onClick).toHaveBeenCalledTimes(1);

		// Without `onClick` the label is no control
		await expect(plain.querySelector('button')).toBeNull();
		await expect(el(plain, '.rcx-bubble__item').tagName).toBe('SPAN');
	},
};

export const KeyboardActivation: Story = {
	render: () => (
		<Bubble onClick={onClick} onDismiss={onDismiss}>
			Label
		</Bubble>
	),
	play: async ({ canvasElement }) => {
		const [content, dismiss] = [...canvasElement.querySelectorAll<HTMLElement>('button')];
		await expectKeyboardActivation(content, onClick);
		await expectKeyboardActivation(dismiss, onDismiss);
		// Both are tab stops, in this order
		content.focus();
		await userEvent.tab();
		await expect(dismiss).toHaveFocus();
	},
};

export const DismissLabel: Story = {
	render: () => (
		<>
			<Bubble onDismiss={onDismiss}>Jump to recent</Bubble>
			<Bubble onDismiss={onDismiss} dismissProps={{ 'aria-label': 'Close it' }}>
				Custom
			</Bubble>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('button[aria-label="Dismiss Jump to recent"]')).not.toBeNull();
		await expect(canvasElement.querySelector('button[aria-label="Close it"]')).not.toBeNull();
		await expect(canvasElement.querySelectorAll('.rcx-bubble__group')).toHaveLength(2);
	},
};

export const DisabledContent: Story = {
	render: () => (
		<Bubble onClick={onClick} contentProps={{ disabled: true }}>
			Disabled
		</Bubble>
	),
	play: async ({ canvasElement }) => {
		onClick.mockClear();
		const button = el(canvasElement, 'button');
		await expect(button).toBeDisabled();
		await userEvent.click(button);
		await expect(onClick).not.toHaveBeenCalled();
	},
};

const everyVariation = (
	<>
		<Bubble>Primary</Bubble>
		<Bubble secondary icon='arrow-down'>
			Secondary
		</Bubble>
		<Bubble small onClick={onClick}>
			Small
		</Bubble>
		<Bubble icon='arrow-down' onClick={onClick}>
			Icon
		</Bubble>
		<Bubble secondary onClick={onClick} onDismiss={onDismiss}>
			Group
		</Bubble>
		<Bubble small icon='arrow-down' onClick={onClick} onDismiss={onDismiss}>
			Small group
		</Bubble>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- text: "Primary"',
				'- text: "Secondary"',
				'- button "Small"',
				'- button "Icon"',
				'- button "Group"',
				'- button "Dismiss Group"',
				'- button "Small group"',
				'- button "Dismiss Small group"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-box rcx-box--full rcx-bubble',
				'root > div[0] > span: rcx-bubble__item rcx-bubble__item--primary',
				'root > div[1]: rcx-box rcx-box--full rcx-bubble',
				'root > div[1] > span: rcx-bubble__item rcx-bubble__item--secondary',
				'root > div[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-arrow-down',
				'root > div[2]: rcx-box rcx-box--full rcx-bubble rcx-bubble--small',
				'root > div[2] > button: rcx-box rcx-box--full rcx-bubble__button rcx-bubble__button--primary',
				'root > div[3]: rcx-box rcx-box--full rcx-bubble',
				'root > div[3] > button: rcx-box rcx-box--full rcx-bubble__button rcx-bubble__button--primary',
				'root > div[3] > button > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-arrow-down',
				'root > div[4]: rcx-box rcx-box--full rcx-bubble rcx-bubble__group',
				'root > div[4] > button[0]: rcx-box rcx-box--full rcx-bubble__button rcx-bubble__button--secondary',
				'root > div[4] > button[1]: rcx-box rcx-box--full rcx-bubble__button rcx-bubble__button--secondary',
				'root > div[4] > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross-small',
				'root > div[5]: rcx-box rcx-box--full rcx-bubble rcx-bubble--small rcx-bubble__group',
				'root > div[5] > button[0]: rcx-box rcx-box--full rcx-bubble__button rcx-bubble__button--primary',
				'root > div[5] > button[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-arrow-down',
				'root > div[5] > button[1]: rcx-box rcx-box--full rcx-bubble__button rcx-bubble__button--primary',
				'root > div[5] > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross-small',
			].join('\n'),
		);
	},
};

export const Sizes: Story = {
	render: () => (
		<>
			<Bubble id='regular' onClick={onClick}>
				Regular
			</Bubble>
			<Bubble id='small' small onClick={onClick}>
				Small
			</Bubble>
			<Bubble id='item' small>
				Small item
			</Bubble>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const height = (selector: string) => computed(el(canvasElement, selector), 'height');
		await expect(height('#regular button')).toBe('28px');
		await expect(height('#small button')).toBe('20px');
		await expect(height('#item .rcx-bubble__item')).toBe('20px');
		await expect(computed(el(canvasElement, '#regular button'), 'padding-left')).toBe('8px');
		await expect(computed(el(canvasElement, '#regular'), 'overflow')).toBe('hidden');
		await expect(computed(el(canvasElement, '#regular'), 'display')).toBe('flex');
		await expect(parseFloat(computed(el(canvasElement, '#small button'), 'font-size'))).toBeLessThan(
			parseFloat(computed(el(canvasElement, '#regular button'), 'font-size')),
		);
	},
};

// A leading icon asks for 12px at the end, except in a group where the dismiss button sits there
export const IconPadding: Story = {
	render: () => (
		<>
			<Bubble id='plain' onClick={onClick}>
				Plain
			</Bubble>
			<Bubble id='icon' icon='arrow-down' onClick={onClick}>
				Icon
			</Bubble>
			<Bubble id='icon-item' icon='arrow-down'>
				Icon item
			</Bubble>
			<Bubble id='group' icon='arrow-down' onClick={onClick} onDismiss={onDismiss}>
				Icon group
			</Bubble>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const end = (selector: string) => computed(el(canvasElement, selector), 'padding-right');
		await expect(end('#plain button')).toBe('8px');
		await expect(end('#icon button')).toBe('12px');
		await expect(end('#icon-item .rcx-bubble__item')).toBe('12px');
		await expect(end('#group button')).toBe('8px');
		await expect(computed(el(canvasElement, '#icon button'), 'column-gap')).toBe('4px');
	},
};

export const GroupRadius: Story = {
	render: () => (
		<>
			<Bubble id='group' onClick={onClick} onDismiss={onDismiss}>
				Group
			</Bubble>
			<Bubble id='alone' onClick={onClick}>
				Alone
			</Bubble>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const radius = (selector: string, corner: string) => computed(el(canvasElement, selector), `border-${corner}-radius`);
		const [first, last] = ['#group button:first-of-type', '#group button:last-of-type'];

		// The two halves of a group are squared where they meet and stay round at the outer ends
		await expect(radius(first, 'top-right')).toBe('0px');
		await expect(radius(first, 'bottom-right')).toBe('0px');
		await expect(radius(first, 'top-left')).not.toBe('0px');
		await expect(radius(last, 'top-left')).toBe('0px');
		await expect(radius(last, 'bottom-left')).toBe('0px');
		await expect(radius(last, 'top-right')).not.toBe('0px');
		await expect(radius('#alone button', 'top-right')).not.toBe('0px');
		await expect(radius('#alone button', 'top-left')).not.toBe('0px');
	},
};

export const KindPaint: Story = {
	render: () => (
		<>
			<Bubble id='primary' onClick={onClick}>
				Primary
			</Bubble>
			<Bubble id='secondary' secondary onClick={onClick}>
				Secondary
			</Bubble>
			<Bubble id='primary-item'>Primary item</Bubble>
			<Bubble id='secondary-item' secondary>
				Secondary item
			</Bubble>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const paint = (selector: string) => {
			const style = getComputedStyle(el(canvasElement, selector));
			return `${style.backgroundColor}|${style.color}`;
		};
		await expect(paint('#primary button')).not.toBe(paint('#secondary button'));
		await expect(paint('#primary-item .rcx-bubble__item')).not.toBe(paint('#secondary-item .rcx-bubble__item'));
		// A static bubble is painted like the button of the same kind
		await expect(paint('#primary-item .rcx-bubble__item')).toBe(paint('#primary button'));
		await expect(paint('#secondary-item .rcx-bubble__item')).toBe(paint('#secondary button'));
		await expect(computed(el(canvasElement, '#primary button'), 'cursor')).toBe('pointer');
	},
};

export const PressAnimation: Story = {
	render: () => (
		<Bubble icon='arrow-down' onClick={onClick}>
			Press
		</Bubble>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const button = el(canvasElement, 'button');
		const [icon, label] = [el(button, '.rcx-icon'), el(button, 'span:not(.rcx-icon)')];
		await expect(computed(label, 'transform')).toBe('none');

		// Pressed, the button's content sits 1px lower
		forcePseudo(button, 'active');
		await waitFor(() => expect(computed(label, 'transform')).toBe('matrix(1, 0, 0, 1, 0, 1)'));
		await expect(computed(icon, 'transform')).toBe('matrix(1, 0, 0, 1, 0, 1)');
	},
};

export const LabelTruncation: Story = {
	render: () => (
		<div style={{ width: 120 }}>
			<Bubble id='long' onClick={onClick}>
				A label that is much too long for its bubble
			</Bubble>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const label = el(canvasElement, '#long button > span');
		await expect(computed(label, 'text-overflow')).toBe('ellipsis');
		await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
	},
};

export const GroupDimensions: Story = {
	render: () => (
		<Bubble id='group' onClick={onClick} onDismiss={onDismiss}>
			Group
		</Bubble>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const [content, dismiss] = [...canvasElement.querySelectorAll<HTMLElement>('#group button')];
		// The halves touch, on one line
		await expect(content.getBoundingClientRect().right).toBe(dismiss.getBoundingClientRect().left);
		await expect(content.getBoundingClientRect().top).toBe(dismiss.getBoundingClientRect().top);
	},
};
