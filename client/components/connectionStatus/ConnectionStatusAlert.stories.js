import { action } from '@storybook/addon-actions';
import React from 'react';

import { ConnectionStatusContext } from '../../contexts/ConnectionStatusContext';
import { ConnectionStatusAlert } from './ConnectionStatusAlert';

function ConnectionStatusProviderMock({
	children,
	connected = false,
	status,
	retryTime,
	retryCount = 3,
	reconnect = () => {},
}) {
	return <ConnectionStatusContext.Provider
		children={children}
		value={{
			status: {
				connected,
				retryCount,
				retryTime,
				status,
			},
			reconnect,
		}} />;
}


export default {
	title: 'connectionStatus/ConnectionStatusAlert',
	component: ConnectionStatusAlert,
};

export const connected = () => <ConnectionStatusProviderMock connected status='connected' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProviderMock>;

export const connecting = () => <ConnectionStatusProviderMock status='connecting' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProviderMock>;

export const failed = () => <ConnectionStatusProviderMock status='failed' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProviderMock>;

export const waiting = () => <ConnectionStatusProviderMock status='waiting' retryTime={Date.now() + 300000} reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProviderMock>;

export const offline = () => <ConnectionStatusProviderMock status='offline' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProviderMock>;
