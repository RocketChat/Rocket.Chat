import { createContext } from 'react';

export type ConnectionStatusContextValue = {
	connected: boolean;
	retryCount?: number;
	retryTime?: number;
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
	reconnect: () => void;
};

export const ConnectionStatusContext = createContext<ConnectionStatusContextValue>({
	connected: true,
	status: 'connected',
	reconnect: () => undefined,
});
