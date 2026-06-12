import type { IStats } from '@rocket.chat/core-typings';
import type { Meta } from '@storybook/react';

import MessagesRoomsCard from './MessagesRoomsCard';

export default {
	component: MessagesRoomsCard,
	parameters: {
		layout: 'centered',
	},
	args: {
		statistics: {
			totalChannels: 12,
			totalPrivateGroups: 23,
			totalDirect: 21,
			totalDiscussions: 32,
			totalLivechat: 31,
			totalMessages: 321,
			totalDirectMessages: 23,
			totalDiscussionsMessages: 32,
			totalLivechatMessages: 31,
		} as IStats,
	},
} satisfies Meta<typeof MessagesRoomsCard>;

export const Example = {};
export const Vertical = {};
