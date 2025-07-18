import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import LeaveMessage from './index';
import { screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Routes/Leave a message',
	component: LeaveMessage,
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof LeaveMessage>>;

const Template: StoryFn<ComponentProps<typeof LeaveMessage>> = (args) => <LeaveMessage {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
