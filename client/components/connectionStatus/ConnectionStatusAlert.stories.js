import { action } from '@storybook/addon-actions';
import React from 'react';

import { ConnectionStatusAlert } from './ConnectionStatusAlert';
import { ConnectionStatusProvider } from '../providers/ConnectionStatusProvider.mock';

export default {
	title: 'connectionStatus/ConnectionStatusAlert',
	component: ConnectionStatusAlert,
};

export const connected = () => <ConnectionStatusProvider connected status='connected' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProvider>;

export const connecting = () => <ConnectionStatusProvider status='connecting' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProvider>;

export const failed = () => <ConnectionStatusProvider status='failed' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProvider>;

export const waiting = () => <ConnectionStatusProvider status='waiting' retryTime={Date.now() + 300000} reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProvider>;

export const offline = () => <ConnectionStatusProvider status='offline' reconnect={action('reconnect')}>
	<ConnectionStatusAlert />
</ConnectionStatusProvider>;
