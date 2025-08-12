import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import type { ContextType, ReactElement } from 'react';

import ConnectionStatusBar from './ConnectionStatusBar';

export default {
	title: 'Components/ConnectionStatusBar',
	component: ConnectionStatusBar,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof ConnectionStatusBar>;

const stateDecorator = (value: ContextType<typeof ConnectionStatusContext>) => (fn: () => ReactElement) => (
	<ConnectionStatusContext.Provider value={value}>{fn()}</ConnectionStatusContext.Provider>
);

const Template: StoryFn<typeof ConnectionStatusBar> = () => <ConnectionStatusBar />;

export const Connected = Template.bind({});
Connected.decorators = [
	stateDecorator({
		connected: true,
		status: 'connected',
		retryTime: undefined,
		reconnect: action('reconnect'),
		isLoggingIn: false,
	}),
];

export const Connecting = Template.bind({});
Connecting.decorators = [
	stateDecorator({
		connected: false,
		status: 'connecting',
		retryTime: undefined,
		reconnect: action('reconnect'),
		isLoggingIn: false,
	}),
];

export const Failed = Template.bind({});
Failed.decorators = [
	stateDecorator({
		connected: false,
		status: 'failed',
		retryTime: undefined,
		reconnect: action('reconnect'),
		isLoggingIn: false,
	}),
];

export const Waiting = Template.bind({});
Waiting.decorators = [
	stateDecorator({
		connected: false,
		status: 'waiting',
		retryTime: Date.now() + 300000,
		reconnect: action('reconnect'),
		isLoggingIn: false,
	}),
];

export const Offline = Template.bind({});
Offline.decorators = [
	stateDecorator({
		connected: false,
		status: 'offline',
		retryTime: undefined,
		reconnect: action('reconnect'),
		isLoggingIn: false,
	}),
];
