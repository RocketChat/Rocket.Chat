import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import MessageSeparator from '.';

export default {
	title: 'Messages/MessageSeparator',
	component: MessageSeparator,
	args: {
		date: null,
		unread: false,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof MessageSeparator>>;

const Template: Story<ComponentProps<typeof MessageSeparator>> = (args) => <MessageSeparator {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const _Date = Template.bind({});
_Date.storyName = 'date';
_Date.args = {
	date: new Date(Date.parse('2021-01-01T00:00:00.000Z')),
};

export const Unread = Template.bind({});
Unread.storyName = 'unread';
Unread.args = {
	unread: true,
};
