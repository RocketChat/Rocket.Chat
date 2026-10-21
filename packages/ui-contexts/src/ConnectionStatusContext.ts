import { createContext } from 'react';

export type ConnectionStatusContextValue = {
	connected: boolean;
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
	retryCount: number;
	retryTime?: number | undefined;
	disconnect: () => void;
	reconnect: () => void;
};

export const ConnectionStatusContext = createContext<ConnectionStatusContextValue>({
	connected: true,
	status: 'connected',
	retryCount: 0,
	disconnect: () => {
		throw new Error('not implemented');
	},
	reconnect: () => {
		throw new Error('not implemented');
	},
});
