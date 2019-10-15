import React from 'react';

import { ConnectionStatusContext } from '../contexts/ConnectionStatusContext';

export function ConnectionStatusProvider({
	children,
	connected = false,
	status,
	retryTime,
	retryCount = 3,
	reconnect = () => {},
}) {
	return <ConnectionStatusContext.Provider value={{
		status: {
			connected,
			retryCount,
			retryTime,
			status,
		},
		reconnect,
	}}>
		{children}
	</ConnectionStatusContext.Provider>;
}
