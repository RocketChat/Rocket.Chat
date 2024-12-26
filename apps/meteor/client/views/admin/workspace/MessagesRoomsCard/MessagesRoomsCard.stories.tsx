import type { IStats } from '@rocket.chat/core-typings';
import type { Meta, StoryFn } from '@storybook/react';

import MessagesRoomsCard from './MessagesRoomsCard';

export default {
	title: 'Admin/Info/MessagesRoomsCard',
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

const Template: StoryFn<typeof MessagesRoomsCard> = (args) => <MessagesRoomsCard {...args} />;

export const Example = Template.bind({});

export const Vertical = Template.bind({});
