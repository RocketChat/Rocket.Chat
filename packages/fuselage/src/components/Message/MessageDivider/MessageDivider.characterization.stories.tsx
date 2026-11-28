import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn } from 'storybook/test';

import MessageDivider from './MessageDivider';
import { ariaSnapshot, classContract, computed, expectForwards, isJsdom } from '../../../testing/g0';

// G0 characterization of the message divider on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/MessageDivider',
	component: MessageDivider,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageDivider>;

type Story = StoryObj<typeof MessageDivider>;

const handlers = { onClick: fn(), onMouseEnter: fn() };

export const Forwarding: Story = {
	render: () => (
		<MessageDivider
			className='divider-class'
			id='divider-id'
			title='divider title'
			data-qa='divider-qa'
			data-anything='divider-anything'
			aria-label='divider label'
			{...handlers}
		>
			Today
		</MessageDivider>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-divider', {
			'className': 'divider-class',
			'id': 'divider-id',
			'title': 'divider title',
			'data-qa': 'divider-qa',
			'data-anything': 'divider-anything',
			'aria-label': 'divider label',
			handlers,
		});
	},
};

// The divider is a separator on its own; a consumer's role wins
export const SeparatorRole: Story = {
	render: () => (
		<>
			<MessageDivider id='default'>Today</MessageDivider>
			<MessageDivider id='custom' role='presentation'>
				Today
			</MessageDivider>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#default')).toHaveAttribute('role', 'separator');
		await expect(canvasElement.querySelector('#custom')).toHaveAttribute('role', 'presentation');
	},
};

const everyVariation = (
	<>
		<MessageDivider />
		<MessageDivider>Today</MessageDivider>
		<MessageDivider unreadLabel='Unread' />
		<MessageDivider unreadLabel='Unread'>Today</MessageDivider>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- separator',
				'- separator:',
				'  - text: "Today"',
				'- separator:',
				'  - text: "Unread"',
				'- separator:',
				'  - text: "Today"',
				'  - text: "Unread"',
			].join('\n'),
		);
	},
};

// The unread line may gain a modifier class on its bar; the rewrite is allowed that addition, so the contract leaves it out
const dividerClasses = (root: Element) => classContract(root).replace(/ rcx-message-divider__bar--unread/g, '');

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(dividerClasses(canvasElement)).toBe(
			[
				'root > div[0]: rcx-message-divider',
				'root > div[0] > div: rcx-message-divider__bar',
				'root > div[1]: rcx-message-divider',
				'root > div[1] > div[0]: rcx-message-divider__bar',
				'root > div[1] > div[1]: rcx-message-divider__wrapper',
				'root > div[1] > div[2]: rcx-message-divider__bar',
				'root > div[2]: rcx-message-divider rcx-message-divider--unread',
				'root > div[2] > div: rcx-message-divider__bar',
				'root > div[2] > div > div: rcx-message-divider__wrapper--unread',
				'root > div[3]: rcx-message-divider rcx-message-divider--unread',
				'root > div[3] > div[0]: rcx-message-divider__bar',
				'root > div[3] > div[1]: rcx-message-divider__wrapper',
				'root > div[3] > div[2]: rcx-message-divider__bar',
				'root > div[3] > div[2] > div: rcx-message-divider__wrapper--unread',
			].join('\n'),
		);
	},
};

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;
const line = (element: Element) => getComputedStyle(element, '::after');

export const Layout: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<MessageDivider id='date'>Today</MessageDivider>
			<MessageDivider id='unread-only' unreadLabel='Unread' />
			<MessageDivider id='unread-date' unreadLabel='Unread'>
				Today
			</MessageDivider>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const date = el(canvasElement, 'date');
		await expect(computed(date, 'display')).toBe('flex');
		await expect(computed(date, 'align-items')).toBe('center');
		// Overlays the top pixel of the row that follows
		await expect(computed(date, 'position')).toBe('relative');
		await expect(computed(date, 'z-index')).toBe('1');
		await expect(computed(date, 'margin-bottom')).toBe('-1px');
		await expect(computed(date, 'padding-left')).toBe('20px');
		await expect(computed(date, 'padding-right')).toBe('20px');

		const [before, after] = [...date.querySelectorAll<HTMLElement>('.rcx-message-divider__bar')];
		// Equal bars keep the date centred
		await expect(Math.abs(before.getBoundingClientRect().width - after.getBoundingClientRect().width)).toBeLessThan(1);
		await expect(line(before).height).toBe('1px');
		await expect(line(after).height).toBe('1px');
		await expect(date.getBoundingClientRect().height).toBeGreaterThan(1);

		// A divider with only the unread label stays a 1px line that the label overhangs
		const unread = el(canvasElement, 'unread-only');
		await expect(unread.getBoundingClientRect().height).toBe(1);
		const label = unread.querySelector('.rcx-message-divider__wrapper--unread') as HTMLElement;
		await expect(label.getBoundingClientRect().height).toBeGreaterThan(1);
		await expect(label.getBoundingClientRect().top).toBeLessThan(unread.getBoundingClientRect().top);
		await expect(label.getBoundingClientRect().bottom).toBeGreaterThan(unread.getBoundingClientRect().bottom);

		// The label closes the line: it comes last in the row
		const bars = [...el(canvasElement, 'unread-date').querySelectorAll<HTMLElement>('.rcx-message-divider__bar')];
		const unreadDate = el(canvasElement, 'unread-date');
		await expect(Math.abs(bars[0].getBoundingClientRect().width - bars[1].getBoundingClientRect().width)).toBeLessThan(1);
		const unreadLabel = unreadDate.querySelector('.rcx-message-divider__wrapper--unread') as HTMLElement;
		await expect(unreadLabel.getBoundingClientRect().right).toBeLessThanOrEqual(unreadDate.getBoundingClientRect().right);
	},
};

export const UnreadColors: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<MessageDivider id='date'>Today</MessageDivider>
			<MessageDivider id='unread' unreadLabel='Unread'>
				Today
			</MessageDivider>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const bars = (id: string) => [...el(canvasElement, id).querySelectorAll<HTMLElement>('.rcx-message-divider__bar')];
		const lineColor = (bar: Element) => line(bar).backgroundColor;

		// Both lines of an unread divider turn to the unread color, and only theirs
		const rest = lineColor(bars('date')[0]);
		await expect(lineColor(bars('date')[1])).toBe(rest);
		await expect(lineColor(bars('unread')[0])).not.toBe(rest);
		await expect(lineColor(bars('unread')[1])).toBe(lineColor(bars('unread')[0]));

		// The label takes the unread color, not the date's
		const label = el(canvasElement, 'unread').querySelector('.rcx-message-divider__wrapper--unread') as HTMLElement;
		await expect(computed(label, 'color')).not.toBe(computed(el(canvasElement, 'date'), 'color'));
		await expect(computed(label, 'order')).toBe('1');
	},
};
