import { action } from '@storybook/addon-actions';
import React from 'react';

import { ConnectionStatusContext } from '../../contexts/ConnectionStatusContext';
import ConnectionStatusBar from './ConnectionStatusBar';

const stateDecorator =
	({ status = 'connected' } = {}) =>
	(storyFn) =>
		(
			<ConnectionStatusContext.Provider
				value={{
					connected: status === 'connected',
					status,
					retryTime: status === 'waiting' && Date.now() + 300000,
					reconnect: action('reconnect'),
				}}
			>
				{storyFn()}
			</ConnectionStatusContext.Provider>
		);

export default {
	title: 'components/connectionStatus/ConnectionStatusBar',
	component: ConnectionStatusBar,
};

export const Connected = () => <ConnectionStatusBar />;
Connected.decorators = [stateDecorator()];

export const Connecting = () => <ConnectionStatusBar />;
Connecting.decorators = [stateDecorator({ status: 'connecting' })];

export const Failed = () => <ConnectionStatusBar />;
Failed.decorators = [stateDecorator({ status: 'failed' })];

export const Waiting = () => <ConnectionStatusBar />;
Waiting.decorators = [stateDecorator({ status: 'waiting' })];

export const Offline = () => <ConnectionStatusBar />;
Offline.decorators = [stateDecorator({ status: 'offline' })];
