import { createContext, useContext } from 'react';

export const ConnectionStatusContext = createContext({
	connected: true,
	retryCount: 0,
	retryTime: 0,
	status: 'connected',
	reconnect: () => {},
});

export const useConnectionStatus = () => useContext(ConnectionStatusContext);
