import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { screenDecorator, screenProps } from '../../helpers.stories';
import LeaveMessage from './component';

export default {
	title: 'Routes/Leave a message',
	component: LeaveMessage,
	args: {
		title: '',
		message: '',
		unavailableMessage: '',
		hasForm: true,
		loading: false,
		onSubmit: action('submit'),
		...screenProps(),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof LeaveMessage>>;

const Template: Story<ComponentProps<typeof LeaveMessage>> = (args) => <LeaveMessage {...args} />;

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const Loading = Template.bind({});
Loading.storyName = 'loading';
Loading.args = {
	loading: true,
};

export const Unavailable = Template.bind({});
Unavailable.storyName = 'unavailable';
Unavailable.args = {
	hasForm: false,
	unavailableMessage: 'Sorry, we are not available at the moment. Please leave a message.',
};
