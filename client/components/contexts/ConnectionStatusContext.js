import { createContext, useContext } from 'react';

export const ConnectionStatusContext = createContext({
	status: {
		connected: true,
		status: 'connected',
		retryCount: 0,
	},
	reconnect: () => {},
});

export const useConnectionStatus = () => useContext(ConnectionStatusContext).status;

export const useReconnect = () => useContext(ConnectionStatusContext).reconnect;
