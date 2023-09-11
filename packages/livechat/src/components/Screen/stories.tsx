import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Screen } from '.';
import { gazzoAvatar, screenDecorator } from '../../../.storybook/helpers';

export default {
	title: 'Components/Screen',
	component: Screen,
	args: {
		theme: {
			color: '',
			fontColor: '',
			iconColor: '',
		},
		title: 'Title',
		notificationsEnabled: true,
		minimized: false,
		expanded: false,
		windowed: false,
		onEnableNotifications: action('enableNotifications'),
		onDisableNotifications: action('disableNotifications'),
		onMinimize: action('minimize'),
		onRestore: action('restore'),
		onOpenWindow: action('openWindow'),
	},
	decorators: [screenDecorator],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Screen>>;

const Template: Story<ComponentProps<typeof Screen>> = (args) => (
	<Screen {...args}>
		<Screen.Content>Content</Screen.Content>
	</Screen>
);

export const Normal = Template.bind({});
Normal.storyName = 'normal';

export const Minimized = Template.bind({});
Minimized.storyName = 'minimized';
Minimized.args = {
	minimized: true,
};

export const Expanded = Template.bind({});
Expanded.storyName = 'expanded';
Expanded.args = {
	expanded: true,
};

export const Windowed = Template.bind({});
Windowed.storyName = 'windowed';
Windowed.args = {
	windowed: true,
};

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

export const WithMultipleAlerts = Template.bind({});
WithMultipleAlerts.storyName = 'with multiple alerts';
WithMultipleAlerts.args = {
	alerts: [
		{ id: 1, children: 'Success alert', success: true },
		{ id: 2, children: 'Warning alert', warning: true, timeout: 0 },
		{ id: 3, children: 'Error alert', error: true, timeout: 1000 },
		{ id: 4, children: 'Custom colored alert', color: '#000', timeout: 5000 },
	],
};
