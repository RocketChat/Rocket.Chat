import { action } from '@storybook/addon-actions';
import React from 'react';

import { ConnectionStatusContext } from '../../contexts/ConnectionStatusContext';
import ConnectionStatusAlert from './ConnectionStatusAlert';

const stateDecorator = ({
	status = 'connected',
} = {}) =>
	(storyFn) =>
		<ConnectionStatusContext.Provider
			value={{
				connected: status === 'connected',
				status,
				retryTime: status === 'waiting' && Date.now() + 300000,
				reconnect: action('reconnect'),
			}}
		>
			{storyFn()}
		</ConnectionStatusContext.Provider>;

export default {
	title: 'components/connectionStatus/ConnectionStatusAlert',
	component: ConnectionStatusAlert,
};

export const Connected = () => <ConnectionStatusAlert />;
Connected.decorators = [
	stateDecorator(),
];

export const Connecting = () => <ConnectionStatusAlert />;
Connecting.decorators = [
	stateDecorator({ status: 'connecting' }),
];

export const Failed = () => <ConnectionStatusAlert />;
Failed.decorators = [
	stateDecorator({ status: 'failed' }),
];

export const Waiting = () => <ConnectionStatusAlert />;
Waiting.decorators = [
	stateDecorator({ status: 'waiting' }),
];

export const Offline = () => <ConnectionStatusAlert />;
Offline.decorators = [
	stateDecorator({ status: 'offline' }),
];
