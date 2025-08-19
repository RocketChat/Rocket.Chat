import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { ServerContextValue } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import ConnectionStatusBar from './ConnectionStatusBar';

export default {
	title: 'Components/ConnectionStatusBar',
	component: ConnectionStatusBar,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof ConnectionStatusBar>;

const stateDecorator = (value: Partial<ServerContextValue>) =>
	mockAppRoot()
		.withServerContext({
			...value,
			reconnect: action('reconnect'),
			disconnect: action('disconnect'),
		})
		.buildStoryDecorator();

const Template: StoryFn<typeof ConnectionStatusBar> = () => <ConnectionStatusBar />;

export const Connected = Template.bind({});
Connected.decorators = [
	stateDecorator({
		connected: true,
		status: 'connected',
		retryTime: undefined,
	}),
];

export const Connecting = Template.bind({});
Connecting.decorators = [
	stateDecorator({
		connected: false,
		status: 'connecting',
		retryTime: undefined,
	}),
];

export const Failed = Template.bind({});
Failed.decorators = [
	stateDecorator({
		connected: false,
		status: 'failed',
		retryTime: undefined,
	}),
];

export const Waiting = Template.bind({});
Waiting.decorators = [
	stateDecorator({
		connected: false,
		status: 'waiting',
		retryTime: Date.now() + 300000,
	}),
];

export const Offline = Template.bind({});
Offline.decorators = [
	stateDecorator({
		connected: false,
		status: 'offline',
		retryTime: undefined,
	}),
];
