import type { Meta, StoryFn } from '@storybook/preact';

import type { LeaveMessageProps } from './index';
import LeaveMessage from './index';
import { screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Routes/Leave a message',
	component: LeaveMessage,
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<LeaveMessageProps>;

const Template: StoryFn<LeaveMessageProps> = (args) => <LeaveMessage {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
