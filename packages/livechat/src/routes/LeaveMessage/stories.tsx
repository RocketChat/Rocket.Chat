import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { screenDecorator } from '../../../.storybook/helpers';
import LeaveMessage from './index';

export default {
	title: 'Routes/Leave a message',
	component: LeaveMessage,
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof LeaveMessage>>;

const Template: Story<ComponentProps<typeof LeaveMessage>> = (args) => <LeaveMessage {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';
