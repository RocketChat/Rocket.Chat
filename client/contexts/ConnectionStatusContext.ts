import { createContext, useContext } from 'react';

type ConnectionStatusContextValue = {
	connected: boolean;
	retryCount: number;
	retryTime: number;
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
	reconnect: () => void;
};

export const ConnectionStatusContext = createContext<ConnectionStatusContextValue>({
	connected: true,
	retryCount: 0,
	retryTime: 0,
	status: 'connected',
	reconnect: () => undefined,
});

export const useConnectionStatus = (): ConnectionStatusContextValue =>
	useContext(ConnectionStatusContext);
