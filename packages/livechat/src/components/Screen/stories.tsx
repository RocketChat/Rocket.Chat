import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Screen, ScreenContent } from '.';
import { gazzoAvatar, screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Components/Screen',
	component: Screen,
	args: {
		title: 'Title',
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Screen>>;

const Template: StoryFn<ComponentProps<typeof Screen>> = (args) => (
	<Screen {...args}>
		<ScreenContent>Content</ScreenContent>
	</Screen>
);

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const WithAgentEmail = Template.bind({});
WithAgentEmail.storyName = 'with agent (email)';
WithAgentEmail.args = {
	agent: {
		name: 'Guilherme Gazzo',
		status: 'away',
		email: 'guilherme.gazzo@rocket.chat',
		avatar: {
			description: 'guilherme.gazzo',
			src: gazzoAvatar,
		},
	},
};

export const WithAgentPhone = Template.bind({});
WithAgentPhone.storyName = 'with agent (phone)';
WithAgentPhone.args = {
	agent: {
		name: 'Guilherme Gazzo',
		status: 'away',
		phone: '+ 55 42423 24242',
		avatar: {
			description: 'guilherme.gazzo',
			src: gazzoAvatar,
		},
	},
};

export const WithAgentPhoneAndEmail = Template.bind({});
WithAgentPhoneAndEmail.storyName = 'with agent (phone and email)';
WithAgentPhoneAndEmail.args = {
	agent: {
		name: 'Guilherme Gazzo',
		status: 'away',
		email: 'guilherme.gazzo@rocket.chat',
		phone: '+ 55 42423 24242',
		avatar: {
			description: 'guilherme.gazzo',
			src: gazzoAvatar,
		},
	},
};

export const WithHiddenAgent = Template.bind({});
WithHiddenAgent.storyName = 'with hidden agent';
WithHiddenAgent.args = {
	agent: {
		hiddenInfo: true,
	},
};
