import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn } from 'storybook/test';

import MessageMetrics from './MessageMetrics';
import MessageMetricsFollowing from './MessageMetricsFollowing';
import {
	MessageMetricsItem,
	MessageMetricsItemAvatarRow,
	MessageMetricsItemAvatarRowContent,
	MessageMetricsItemIcon,
	MessageMetricsItemLabel,
} from './MessageMetricsItem';
import MessageMetricsReply from './MessageMetricsReply';
import { ariaSnapshot, classContract, computed, expectForwards, isJsdom } from '../../../testing/g0';

// G0 characterization of the message metrics on their develop implementation. A rewrite passes these unedited, in jest and in
// the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/MessageMetrics',
	component: MessageMetrics,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageMetrics>;

type Story = StoryObj<typeof MessageMetrics>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlers = { onClick: fn(), onMouseEnter: fn() };
const followingHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn() };
const replyHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn() };

export const Forwarding: Story = {
	render: () => (
		<MessageMetrics {...forwarded('metrics')} {...handlers}>
			<MessageMetricsReply id='reply-id' data-qa='reply-qa' className='reply-class' {...replyHandlers}>
				Reply
			</MessageMetricsReply>
			<MessageMetricsItem {...forwarded('item')} {...handlers}>
				<MessageMetricsItemIcon name='thread' data-qa='icon-qa' id='icon-id' />
				<MessageMetricsItemLabel {...forwarded('label')} {...handlers}>
					10
				</MessageMetricsItemLabel>
			</MessageMetricsItem>
			<MessageMetricsItem>
				<MessageMetricsFollowing {...forwarded('following')} name='bell' {...followingHandlers} />
			</MessageMetricsItem>
			<MessageMetricsItem>
				<MessageMetricsItemAvatarRow {...forwarded('avatar-row')}>
					<MessageMetricsItemAvatarRowContent {...forwarded('avatar-content')}>A</MessageMetricsItemAvatarRowContent>
				</MessageMetricsItemAvatarRow>
			</MessageMetricsItem>
		</MessageMetrics>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-metrics__content-wrapper', {
			...forwarded('metrics'),
			handlers,
		});
		await expectForwards(canvasElement, '#item-id', { ...forwarded('item'), handlers });
		await expectForwards(canvasElement, '.rcx-message-metrics__item-label', { ...forwarded('label'), handlers });
		await expectForwards(canvasElement, '#following-id', { ...forwarded('following'), handlers: followingHandlers });
		await expectForwards(canvasElement, '#reply-id', {
			'id': 'reply-id',
			'data-qa': 'reply-qa',
			'className': 'reply-class',
			'handlers': replyHandlers,
		});
		await expectForwards(canvasElement, '#icon-id', { 'data-qa': 'icon-qa' });
		await expectForwards(canvasElement, '#avatar-row-id', forwarded('avatar-row'));
		await expectForwards(canvasElement, '#avatar-content-id', forwarded('avatar-content'));
	},
};

const everyVariation = (
	<MessageMetrics>
		<MessageMetricsReply>Reply</MessageMetricsReply>
		<MessageMetricsItem title='Replies'>
			<MessageMetricsItemIcon name='thread' />
			<MessageMetricsItemLabel>10</MessageMetricsItemLabel>
		</MessageMetricsItem>
		<MessageMetricsItem>
			<MessageMetricsFollowing title='Following' name='bell' />
		</MessageMetricsItem>
		<MessageMetricsItem>
			<MessageMetricsItemAvatarRow>
				<MessageMetricsItemAvatarRowContent>A</MessageMetricsItemAvatarRowContent>
			</MessageMetricsItemAvatarRow>
			<MessageMetricsItemLabel>+ 3 followers</MessageMetricsItemLabel>
		</MessageMetricsItem>
	</MessageMetrics>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			['- button "Reply"', '- text: "10"', '- button "Following"', '- text: "A"', '- text: "+ 3 followers"'].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div: rcx-message-metrics__content-wrapper',
				'root > div > div[0]: rcx-message-metrics__item',
				'root > div > div[0] > button: rcx-box rcx-box--full rcx-button rcx-button--primary rcx-button--small',
				'root > div > div[0] > button > span: rcx-button--content',
				'root > div > div[1]: rcx-message-metrics__item',
				'root > div > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-thread',
				'root > div > div[1] > div: rcx-message-metrics__item-label',
				'root > div > div[2]: rcx-message-metrics__item',
				'root > div > div[2] > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > div > div[2] > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-bell',
				'root > div > div[3]: rcx-message-metrics__item',
				'root > div > div[3] > div[0]: rcx-message-metrics__avatar-row',
				'root > div > div[3] > div[0] > div: rcx-message-metrics__avatar-row__content',
				'root > div > div[3] > div[1]: rcx-message-metrics__item-label',
			].join('\n'),
		);
	},
};

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;

// The items sit 8px apart and the first one on the wrapper's own start edge, however the spacing is built
export const Spacing: Story = {
	render: () => (
		<div id='parent' style={{ width: 500, display: 'flow-root' }}>
			<MessageMetrics id='metrics'>
				<MessageMetricsItem id='one'>
					<MessageMetricsItemIcon name='thread' id='icon' />
					<MessageMetricsItemLabel id='label'>10</MessageMetricsItemLabel>
				</MessageMetricsItem>
				<MessageMetricsItem id='two'>
					<MessageMetricsItemIcon name='clock' />
				</MessageMetricsItem>
				<MessageMetricsItem id='three'>
					<MessageMetricsItemLabel id='lone-label'>Only a label</MessageMetricsItemLabel>
				</MessageMetricsItem>
			</MessageMetrics>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const rect = (id: string) => el(canvasElement, id).getBoundingClientRect();
		await expect(computed(el(canvasElement, 'metrics'), 'display')).toBe('flex');
		await expect(rect('one').left).toBe(rect('parent').left);
		await expect(rect('two').left - rect('one').right).toBe(8);
		await expect(rect('three').left - rect('two').right).toBe(8);

		// The label sits 4px after the icon, and 4px in from the edge when it is alone
		await expect(rect('label').left - rect('icon').right).toBe(4);
		await expect(rect('lone-label').left - rect('three').left).toBe(4);

		await expect(computed(el(canvasElement, 'one'), 'display')).toBe('flex');
		await expect(computed(el(canvasElement, 'one'), 'align-items')).toBe('center');
		await expect(computed(el(canvasElement, 'one'), 'justify-content')).toBe('center');
		// 4px of block space around the row
		await expect(rect('one').top - rect('parent').top).toBe(4);
		await expect(rect('parent').bottom - rect('one').bottom).toBe(4);
	},
};

export const ItemType: Story = {
	render: () => (
		<MessageMetricsItem id='item'>
			<MessageMetricsItemLabel id='label'>10</MessageMetricsItemLabel>
		</MessageMetricsItem>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, 'item'), 'font-size')).toBe('10px');
		await expect(computed(el(canvasElement, 'label'), 'font-size')).toBe('10px');
	},
};

export const AvatarRow: Story = {
	render: () => (
		<MessageMetricsItemAvatarRow id='row'>
			<MessageMetricsItemAvatarRowContent id='first'>A</MessageMetricsItemAvatarRowContent>
			<MessageMetricsItemAvatarRowContent id='second'>B</MessageMetricsItemAvatarRowContent>
		</MessageMetricsItemAvatarRow>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, 'row'), 'display')).toBe('flex');
		await expect(computed(el(canvasElement, 'row'), 'column-gap')).toBe('4px');
		await expect(el(canvasElement, 'second').getBoundingClientRect().left - el(canvasElement, 'first').getBoundingClientRect().right).toBe(
			4,
		);
	},
};

export const ReplyAndFollowingKeepTheirButtons: Story = {
	render: () => (
		<MessageMetrics>
			<MessageMetricsReply id='reply'>Reply</MessageMetricsReply>
			<MessageMetricsItem>
				<MessageMetricsFollowing id='following' title='Following' name='bell-off' />
			</MessageMetricsItem>
		</MessageMetrics>
	),
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, 'reply').parentElement).toHaveClass('rcx-message-metrics__item');
		await expect(el(canvasElement, 'reply')).toHaveAccessibleName('Reply');
		await expect(el(canvasElement, 'following')).toHaveAccessibleName('Following');
	},
};
