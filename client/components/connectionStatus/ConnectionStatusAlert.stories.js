import { action } from '@storybook/addon-actions';
import React from 'react';

import { ConnectionStatusContext } from '../../contexts/ConnectionStatusContext';
import { ConnectionStatusAlert } from './ConnectionStatusAlert';

export default {
	title: 'connectionStatus/ConnectionStatusAlert',
	component: ConnectionStatusAlert,
};

export const connected = () => <ConnectionStatusAlert />;
connected.story = {
	decorators: [
		(fn) => <div style={{ minHeight: '100px', minWidth: '100px' }}><ConnectionStatusContext.Provider children={fn()} value={{
			connected: true,
			status: 'connected',
			reconnect: action('reconnect'),
		}} /></div>,
	],
};

export const connecting = () => <ConnectionStatusAlert />;
connecting.story = {
	decorators: [
		(fn) => <ConnectionStatusContext.Provider children={fn()} value={{
			connected: false,
			status: 'connecting',
			reconnect: action('reconnect'),
		}} />,
	],
};

export const failed = () => <ConnectionStatusAlert />;
failed.story = {
	decorators: [
		(fn) => <ConnectionStatusContext.Provider children={fn()} value={{
			connected: false,
			status: 'failed',
			reconnect: action('reconnect'),
		}} />,
	],
};

export const waiting = () => <ConnectionStatusAlert />;
waiting.story = {
	decorators: [
		(fn) => <ConnectionStatusContext.Provider children={fn()} value={{
			connected: false,
			status: 'waiting',
			retryTime: Date.now() + 300000,
			reconnect: action('reconnect'),
		}} />,
	],
};

export const offline = () => <ConnectionStatusAlert />;
offline.story = {
	decorators: [
		(fn) => <ConnectionStatusContext.Provider children={fn()} value={{
			connected: false,
			status: 'offline',
			reconnect: action('reconnect'),
		}} />,
	],
};
