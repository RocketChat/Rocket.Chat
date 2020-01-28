import { Meteor } from 'meteor/meteor';
import React, { createContext, useContext, useMemo } from 'react';

import { useReactiveValue } from '../../hooks/useReactiveValue';

export const ConnectionStatusContext = createContext({
	status: {
		connected: true,
		status: 'connected',
		retryCount: 0,
	},
	reconnect: () => {},
});

export function ConnectionStatusProvider({ children }) {
	const status = useReactiveValue(() => ({ ...Meteor.status() }));

	const contextValue = useMemo(() => ({
		status,
		reconnect: Meteor.reconnect,
	}), [status]);

	return <ConnectionStatusContext.Provider value={contextValue}>
		{children}
	</ConnectionStatusContext.Provider>;
}

export const useConnectionStatus = () => useContext(ConnectionStatusContext).status;

export const useReconnect = () => useContext(ConnectionStatusContext).reconnect;
