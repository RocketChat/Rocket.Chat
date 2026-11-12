import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import MessageStatusIndicator from './MessageStatusIndicator';
import MessageStatusIndicatorItem from './MessageStatusIndicatorItem';
import MessageStatusPrivateIndicator from './MessageStatusPrivateIndicator';
import { ariaSnapshot, classContract, computed, expectForwards, isJsdom } from '../../../testing/g0';
import { Icon } from '../../Icon';

// G0 characterization of the message status indicator on its develop implementation. A rewrite passes these unedited, in jest and
// in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/MessageStatusIndicator',
	component: MessageStatusIndicator,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageStatusIndicator>;

type Story = StoryObj<typeof MessageStatusIndicator>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
});

const indicatorRef = createRef<HTMLDivElement>();
const handlers = { onClick: fn(), onMouseEnter: fn() };
const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;

export const Forwarding: Story = {
	render: () => (
		<MessageStatusIndicator
			ref={indicatorRef}
			{...forwarded('indicator')}
			title='indicator title'
			aria-label='indicator label'
			{...handlers}
		>
			<MessageStatusIndicatorItem {...forwarded('item')} name='star' title='Starred' {...handlers} />
			<MessageStatusPrivateIndicator {...forwarded('private')} title='private title' aria-label='private label' {...handlers}>
				Only you can see this
			</MessageStatusPrivateIndicator>
		</MessageStatusIndicator>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-status-indicator', {
			...forwarded('indicator'),
			'title': 'indicator title',
			'aria-label': 'indicator label',
			'ref': indicatorRef,
			handlers,
		});
		// The icon's own modifier classes come after the consumer's: the order is not part of the contract
		const { className, ...item } = forwarded('item');
		await expectForwards(canvasElement, '#item-id', { ...item, handlers });
		await expect(el(canvasElement, 'item-id')).toHaveClass('rcx-message-status-indicator__item', className);
		await expectForwards(canvasElement, '#private-id', {
			...forwarded('private'),
			title: 'private title',
			handlers,
		});
	},
};

export const RendersNothingWithoutItems: Story = {
	render: () => (
		<>
			<div id='empty'>
				<MessageStatusIndicator />
			</div>
			<div id='falsy'>
				<MessageStatusIndicator>
					{false}
					{null}
					{undefined}
				</MessageStatusIndicator>
			</div>
			<div id='filled'>
				<MessageStatusIndicator>
					<MessageStatusIndicatorItem name='star' />
				</MessageStatusIndicator>
			</div>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#empty')).toBeEmptyDOMElement();
		await expect(canvasElement.querySelector('#falsy')).toBeEmptyDOMElement();
		await expect(canvasElement.querySelector('#filled .rcx-message-status-indicator')).not.toBeNull();
	},
};

const everyVariation = (
	<MessageStatusIndicator>
		<MessageStatusIndicatorItem name='pin' title='Message has been pinned' />
		<MessageStatusIndicatorItem name='star' />
		<MessageStatusIndicatorItem name='language' color='info' title='Translated' />
		<MessageStatusPrivateIndicator>Only you can see this</MessageStatusPrivateIndicator>
	</MessageStatusIndicator>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		// The icon font's glyphs are private-use characters
		await expect(ariaSnapshot(canvasElement).replace(/\p{Co}/gu, '')).toBe(
			['- img "Message has been pinned":', '  - text: ""', '- img "Translated":', '  - text: ""', '- text: "Only you can see this"'].join(
				'\n',
			),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div: rcx-message-status-indicator',
				'root > div > i[0]: rcx-box rcx-box--full rcx-icon rcx-icon--name-pin rcx-message-status-indicator__item',
				'root > div > i[1]: rcx-box rcx-box--full rcx-icon rcx-icon--name-star rcx-message-status-indicator__item',
				'root > div > i[2]: rcx-box rcx-box--full rcx-icon rcx-icon--name-language rcx-message-status-indicator__item',
				'root > div > span: rcx-message-status-indicator__item',
			].join('\n'),
		);
	},
};

// A titled status is named for assistive technology; an untitled one is decoration
export const TitleNamesTheStatus: Story = {
	render: () => (
		<MessageStatusIndicator>
			<MessageStatusIndicatorItem id='titled' name='pin' title='Message has been pinned' />
			<MessageStatusIndicatorItem id='untitled' name='star' />
		</MessageStatusIndicator>
	),
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, 'titled')).toHaveAttribute('role', 'img');
		await expect(el(canvasElement, 'titled')).toHaveAttribute('aria-label', 'Message has been pinned');
		await expect(el(canvasElement, 'titled')).not.toHaveAttribute('aria-hidden', 'true');
		await expect(el(canvasElement, 'untitled')).not.toHaveAttribute('role', 'img');
		await expect(el(canvasElement, 'untitled')).toHaveAttribute('aria-hidden', 'true');
	},
};

export const Colors: Story = {
	render: () => (
		<>
			<Icon id='secondary' name='star' color='secondary-info' />
			<Icon id='info' name='star' color='info' />
			<MessageStatusIndicator id='indicator'>
				<MessageStatusIndicatorItem id='default' name='star' />
				<MessageStatusIndicatorItem id='custom' name='star' color='info' />
				<MessageStatusPrivateIndicator id='private'>Private</MessageStatusPrivateIndicator>
			</MessageStatusIndicator>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const secondary = computed(el(canvasElement, 'secondary'), 'color');
		const info = computed(el(canvasElement, 'info'), 'color');
		await expect(secondary).not.toBe(info);
		// The default color is the secondary one, a consumer's color wins, and the private note takes the default
		await expect(computed(el(canvasElement, 'default'), 'color')).toBe(secondary);
		await expect(computed(el(canvasElement, 'custom'), 'color')).toBe(info);
		await expect(computed(el(canvasElement, 'private'), 'color')).toBe(secondary);
		await expect(computed(el(canvasElement, 'indicator'), 'user-select')).toBe('none');
	},
};
