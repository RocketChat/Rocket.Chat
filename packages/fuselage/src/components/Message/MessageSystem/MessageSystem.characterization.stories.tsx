import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import MessageSystem from './MessageSystem';
import MessageSystemBlock from './MessageSystemBlock';
import MessageSystemBody from './MessageSystemBody';
import MessageSystemContainer from './MessageSystemContainer';
import MessageSystemName from './MessageSystemName';
import MessageSystemTimestamp from './MessageSystemTimestamp';
import { ariaSnapshot, classContract, computed, expectForwards, isJsdom } from '../../../testing/g0';
import MessageLeftContainer from '../MessageLeftContainer';
import MessageName from '../MessageName';

// G0 characterization of the system message on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/MessageSystem',
	component: MessageSystem,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageSystem>;

type Story = StoryObj<typeof MessageSystem>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const rowRef = createRef<HTMLDivElement>();
const rowHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onKeyDown: fn() };
const partHandlers = { onClick: fn(), onMouseEnter: fn() };

export const Forwarding: Story = {
	render: () => (
		<MessageSystem ref={rowRef} {...forwarded('row')} title='row title' tabIndex={0} {...rowHandlers}>
			<MessageLeftContainer>
				<span>Av</span>
			</MessageLeftContainer>
			<MessageSystemContainer {...forwarded('container')} {...partHandlers}>
				<MessageSystemBlock {...forwarded('block')}>
					<MessageSystemName {...forwarded('name')}>Name</MessageSystemName>
					<MessageSystemBody {...forwarded('body')} {...partHandlers}>
						joined the room
					</MessageSystemBody>
					<MessageSystemTimestamp {...forwarded('time')} title='time title'>
						12:00
					</MessageSystemTimestamp>
				</MessageSystemBlock>
			</MessageSystemContainer>
		</MessageSystem>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-system', {
			...forwarded('row'),
			title: 'row title',
			ref: rowRef,
			handlers: rowHandlers,
		});
		await expect(canvasElement.querySelector('.rcx-message-system')).toHaveAttribute('tabindex', '0');
		await expectForwards(canvasElement, '.rcx-message-system__container', forwarded('container'));
		await expectForwards(canvasElement, '.rcx-message-system__block', forwarded('block'));
		await expectForwards(canvasElement, '.rcx-message-system__name', forwarded('name'));
		await expectForwards(canvasElement, '.rcx-message-system__body', { ...forwarded('body'), handlers: partHandlers });
		await expectForwards(canvasElement, '.rcx-message-system__time', { ...forwarded('time'), title: 'time title' });
	},
};

const everyVariation = (
	<>
		<MessageSystem>
			<MessageLeftContainer>
				<span>Av</span>
			</MessageLeftContainer>
			<MessageSystemContainer>
				<MessageSystemBlock>
					<MessageSystemName>Name</MessageSystemName>
					<MessageSystemBody>joined the room</MessageSystemBody>
					<MessageSystemTimestamp>12:00</MessageSystemTimestamp>
				</MessageSystemBlock>
			</MessageSystemContainer>
		</MessageSystem>
		<MessageSystem isSelected tabIndex={0}>
			<MessageSystemContainer>
				<MessageSystemBody>selected</MessageSystemBody>
			</MessageSystemContainer>
		</MessageSystem>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			['- text: "Av"', '- text: "Name"', '- text: "joined the room"', '- text: "12:00"', '- text: "selected"'].join('\n'),
		);
	},
};

// The row is an Item: its own modifiers (`rcx-item--*`) belong to the Item contract, which may grow, so only the rest is compared
const systemClasses = (root: Element) => classContract(root).replace(/ rcx-item--[\w-]+/g, '');

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(systemClasses(canvasElement)).toBe(
			[
				'root > div[0]: rcx-item rcx-message-system',
				'root > div[0] > div[0]: rcx-item__media rcx-message-container--left',
				'root > div[0] > div[1]: rcx-item__content rcx-message-system__container',
				'root > div[0] > div[1] > div: rcx-item__row rcx-message-system__block',
				'root > div[0] > div[1] > div > span[0]: rcx-message-system__name',
				'root > div[0] > div[1] > div > div: rcx-message-system__body',
				'root > div[0] > div[1] > div > span[1]: rcx-item__meta rcx-message-system__time',
				'root > div[1]: rcx-item rcx-message-system',
				'root > div[1] > div: rcx-item__content rcx-message-system__container',
				'root > div[1] > div > div: rcx-message-system__body',
			].join('\n'),
		);
	},
};

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;

export const Layout: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<MessageSystem id='row'>
				<MessageLeftContainer id='left'>
					<span>Av</span>
				</MessageLeftContainer>
				<MessageSystemContainer id='container'>
					<MessageSystemBlock id='block'>
						<MessageSystemName id='name'>Name</MessageSystemName>
						<MessageSystemBody id='body'>
							{'A system text that is far too long to fit a single line of this width. '.repeat(4)}
						</MessageSystemBody>
						<MessageSystemTimestamp id='time'>12:00</MessageSystemTimestamp>
					</MessageSystemBlock>
				</MessageSystemContainer>
			</MessageSystem>
			<MessageName id='message-name'>Name</MessageName>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const rect = (id: string) => el(canvasElement, id).getBoundingClientRect();
		const row = el(canvasElement, 'row');
		await expect(computed(row, 'padding-top')).toBe('8px');
		await expect(computed(row, 'padding-bottom')).toBe('8px');

		// The content column centres on the avatar, and bleeds 4px into the row's padding
		const container = el(canvasElement, 'container');
		await expect(computed(container, 'align-self')).toBe('center');
		await expect(computed(container, 'margin-top')).toBe('-4px');
		await expect(computed(container, 'margin-bottom')).toBe('-4px');

		// A long text truncates on one line, and the name and timestamp keep their size
		const body = el(canvasElement, 'body');
		await expect(computed(body, 'white-space')).toBe('nowrap');
		await expect(computed(body, 'overflow-x')).toBe('hidden');
		await expect(computed(body, 'text-overflow')).toBe('ellipsis');
		await expect(rect('body').right).toBeLessThanOrEqual(rect('block').right);
		await expect(computed(el(canvasElement, 'name'), 'flex-shrink')).toBe('0');
		await expect(rect('time').right).toBeLessThanOrEqual(rect('block').right + 0.5);

		// The name reads as the message name does, in bold
		await expect(computed(el(canvasElement, 'name'), 'color')).toBe(computed(el(canvasElement, 'message-name'), 'color'));
		await expect(Number(computed(el(canvasElement, 'name'), 'font-weight'))).toBeGreaterThanOrEqual(600);
	},
};

export const SelectedState: Story = {
	render: () => (
		<>
			<MessageSystem id='plain'>
				<MessageSystemContainer>
					<span>Plain</span>
				</MessageSystemContainer>
			</MessageSystem>
			<MessageSystem id='selected' isSelected>
				<MessageSystemContainer>
					<span>Selected</span>
				</MessageSystemContainer>
			</MessageSystem>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, 'selected'), 'background-color')).not.toBe(
			computed(el(canvasElement, 'plain'), 'background-color'),
		);
	},
};
