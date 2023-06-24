import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import MessageTime from '.';

const today = new Date(Date.parse('2021-01-01T00:00:00.000Z'));
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

export default {
	title: 'Messages/MessageTime',
	component: MessageTime,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof MessageTime>>;

const Template: Story<ComponentProps<typeof MessageTime>> = (args) => <MessageTime {...args} />;

export const Today = Template.bind({});
Today.storyName = 'today';
Today.args = {
	ts: today,
};

export const Yesterday = Template.bind({});
Yesterday.storyName = 'yesterday';
Yesterday.args = {
	ts: yesterday,
};
