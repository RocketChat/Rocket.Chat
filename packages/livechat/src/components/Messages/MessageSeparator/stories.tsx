import type { Meta, StoryFn } from '@storybook/preact';

import type { MessageSeparatorProps } from '.';
import MessageSeparator from '.';

export default {
	title: 'Messages/MessageSeparator',
	component: MessageSeparator,
	args: {
		unread: false,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<MessageSeparatorProps>;

const Template: StoryFn<MessageSeparatorProps> = (args) => <MessageSeparator {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const _Date = Template.bind({});
_Date.storyName = 'date';
_Date.args = {
	date: '2021-01-01T00:00:00.000Z',
};

export const Unread = Template.bind({});
Unread.storyName = 'unread';
Unread.args = {
	unread: true,
};
