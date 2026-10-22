import { useContext } from 'react';

import { ConnectionStatusContext } from '../ConnectionStatusContext';

export const useConnectionStatus = () => {
	const { connected, retryTime, status, reconnect, disconnect } = useContext(ConnectionStatusContext);
	return { connected, retryTime, status, reconnect, disconnect };
};
