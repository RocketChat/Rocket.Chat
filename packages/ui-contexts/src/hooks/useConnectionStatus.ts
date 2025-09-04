import { useContext } from 'react';

import { ServerContext } from '../ServerContext';

export const useConnectionStatus = () => {
	const { connected, retryTime, status, reconnect, disconnect } = useContext(ServerContext);
	return { connected, retryTime, status, reconnect, disconnect };
};
