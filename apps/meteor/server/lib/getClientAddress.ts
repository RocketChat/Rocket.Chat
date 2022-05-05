import type { ISocketConnection } from '@rocket.chat/core-typings';

export const getClientAddress = (connection: Pick<ISocketConnection, 'clientAddress' | 'httpHeaders'>): string => {
	if (!connection) {
		return '';
	}

	const { clientAddress, httpHeaders } = connection;
	const xRealIp = Array.isArray(httpHeaders?.['x-real-ip']) ? httpHeaders['x-real-ip'][0] : httpHeaders['x-real-ip'];

	return clientAddress || xRealIp || '';
};
