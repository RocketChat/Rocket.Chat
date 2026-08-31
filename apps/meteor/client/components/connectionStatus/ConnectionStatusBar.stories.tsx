import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { ServerContextValue } from '@rocket.chat/ui-contexts';
import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import ConnectionStatusBar from './ConnectionStatusBar';

export default {
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

export const Connected = {
	render: Template,

	decorators: [
		stateDecorator({
			connected: true,
			status: 'connected',
			retryTime: undefined,
		}),
	],
};

export const Connecting = {
	render: Template,

	decorators: [
		stateDecorator({
			connected: false,
			status: 'connecting',
			retryTime: undefined,
		}),
	],
};

export const Failed = {
	render: Template,

	decorators: [
		stateDecorator({
			connected: false,
			status: 'failed',
			retryTime: undefined,
		}),
	],
};

export const Waiting = {
	render: Template,

	decorators: [
		stateDecorator({
			connected: false,
			status: 'waiting',
			retryTime: Date.now() + 300000,
		}),
	],
};

export const Offline = {
	render: Template,

	decorators: [
		stateDecorator({
			connected: false,
			status: 'offline',
			retryTime: undefined,
		}),
	],
};
