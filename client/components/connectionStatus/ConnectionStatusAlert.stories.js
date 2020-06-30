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
Connected.story = {
	decorators: [
		stateDecorator(),
	],
};

export const Connecting = () => <ConnectionStatusAlert />;
Connecting.story = {
	decorators: [
		stateDecorator({ status: 'connecting' }),
	],
};

export const Failed = () => <ConnectionStatusAlert />;
Failed.story = {
	decorators: [
		stateDecorator({ status: 'failed' }),
	],
};

export const Waiting = () => <ConnectionStatusAlert />;
Waiting.story = {
	decorators: [
		stateDecorator({ status: 'waiting' }),
	],
};

export const Offline = () => <ConnectionStatusAlert />;
Offline.story = {
	decorators: [
		stateDecorator({ status: 'offline' }),
	],
};
