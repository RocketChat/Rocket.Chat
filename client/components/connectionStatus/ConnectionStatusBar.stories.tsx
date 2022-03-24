import { action } from '@storybook/addon-actions';
import { Title, Description, Stories } from '@storybook/addon-docs';
import { ComponentMeta, ComponentStory, DecoratorFn } from '@storybook/react';
import React, { ContextType } from 'react';

import { ConnectionStatusContext } from '../../contexts/ConnectionStatusContext';
import ConnectionStatusBar from './ConnectionStatusBar';

export default {
	title: 'Community/Components/ConnectionStatusBar',
	component: ConnectionStatusBar,
	parameters: {
		layout: 'fullscreen',
		docs: {
			inlineStories: false,
			page: () => (
				<>
					<Title />
					<Description />
					<Stories includePrimary />
				</>
			),
		},
	},
} as ComponentMeta<typeof ConnectionStatusBar>;

const stateDecorator =
	(value: ContextType<typeof ConnectionStatusContext>): DecoratorFn =>
	(fn) =>
		<ConnectionStatusContext.Provider value={value}>{fn()}</ConnectionStatusContext.Provider>;

const Template: ComponentStory<typeof ConnectionStatusBar> = () => <ConnectionStatusBar />;

export const Connected = Template.bind({});
Connected.decorators = [
	stateDecorator({
		connected: true,
		status: 'connected',
		retryTime: undefined,
		reconnect: action('reconnect'),
	}),
];

export const Connecting = Template.bind({});
Connecting.decorators = [
	stateDecorator({
		connected: false,
		status: 'connecting',
		retryTime: undefined,
		reconnect: action('reconnect'),
	}),
];

export const Failed = Template.bind({});
Failed.decorators = [
	stateDecorator({
		connected: false,
		status: 'failed',
		retryTime: undefined,
		reconnect: action('reconnect'),
	}),
];

export const Waiting = Template.bind({});
Waiting.decorators = [
	stateDecorator({
		connected: false,
		status: 'waiting',
		retryTime: Date.now() + 300000,
		reconnect: action('reconnect'),
	}),
];

export const Offline = Template.bind({});
Offline.decorators = [
	stateDecorator({
		connected: false,
		status: 'offline',
		retryTime: undefined,
		reconnect: action('reconnect'),
	}),
];
