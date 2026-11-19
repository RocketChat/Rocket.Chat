import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

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
import { classContract } from '../../../testing/g0';

// The class contract of MessageMetrics with the IconButton frame in it, which holds its glyph in a content part: `button > span > i`.
export default {
	title: 'Characterization/MessageMetricsClassContract',
	component: MessageMetrics,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageMetrics>;

type Story = StoryObj<typeof MessageMetrics>;

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
