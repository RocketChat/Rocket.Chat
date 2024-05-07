import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { MessageList } from '.';
import { avatarResolver, loremIpsum } from '../../../../.storybook/helpers';
import { MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY } from '../constants';

const now = new Date(Date.parse('2021-01-01T00:00:00.000Z'));

const users = [
	{
		_id: 1,
		username: 'tasso.evangelista',
	},
	{
		_id: 2,
		username: 'guilherme.gazzo',
	},
	{
		_id: 3,
		username: 'martin.schoeler',
	},
];

const messages = new Array(10);
for (let i = 0; i < messages.length; ++i) {
	messages[i] = {
		_id: i + 1,
		u: users[i % users.length],
		msg: loremIpsum({ count: 1, units: 'sentences' }),
		ts: new Date(now.getTime() - (15 - i) * 60000).toISOString(),
	};
}

export default {
	title: 'Messages/MessageList',
	component: MessageList,
	args: {
		messages,
		uid: 1,
		avatarResolver,
		lastReadMessageId: 7,
		typingUsernames: [],
		onScrollTo: action('scrollTo'),
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof MessageList>>;

const Template: Story<ComponentProps<typeof MessageList>> = (args) => <MessageList {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const WithSystemMessage = Template.bind({});
WithSystemMessage.storyName = 'with system message';
WithSystemMessage.args = {
	messages: [
		...messages,
		{
			msg: '',
			ts: now.toISOString(),
			t: MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY,
			transferData: {
				transferredBy: users[0],
				scope: 'queue',
			},
			u: users[0],
			_id: 'AGiTzCjYyaypDxpDm',
		},
	],
};

export const WithHiddenAgentInfoSystemMessage = Template.bind({});
WithHiddenAgentInfoSystemMessage.storyName = 'with hidden agent info system message';
WithHiddenAgentInfoSystemMessage.args = {
	messages: [
		...messages,
		{
			msg: '',
			t: MESSAGE_TYPE_LIVECHAT_TRANSFER_HISTORY,
			transferData: {
				transferredBy: { ...users[0], username: undefined },
				scope: 'queue',
			},
			ts: now.toISOString(),
			u: { ...users[0], username: undefined },
			_id: 'AGiTzCjYyaypDxpDm',
		},
	],
};

export const WithTypingUsers = Template.bind({});
WithTypingUsers.storyName = 'with typing users';
WithTypingUsers.args = {
	typingUsernames: [users[1].username, users[2].username],
};
