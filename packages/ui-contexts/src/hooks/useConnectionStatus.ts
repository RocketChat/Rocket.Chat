import { useContext, useSyncExternalStore } from 'react';

import { ServerContext } from '../ServerContext';

export const useConnectionStatus = () => {
	const { subscribeToConnectionStatus, getConnectionStatus, reconnect, disconnect } = useContext(ServerContext);
	const { connected, retryTime, status } = useSyncExternalStore(subscribeToConnectionStatus, getConnectionStatus);
	return { connected, retryTime, status, reconnect, disconnect };
};
