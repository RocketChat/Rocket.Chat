import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

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
} satisfies ComponentMeta<typeof LeaveMessage>;

const Template: ComponentStory<typeof LeaveMessage> = (args) => <LeaveMessage {...args} />;

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
