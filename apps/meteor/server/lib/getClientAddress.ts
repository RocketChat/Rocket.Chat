import type { ISocketConnection } from '@rocket.chat/core-typings';

export function getClientAddress(connection: Pick<ISocketConnection, 'clientAddress' | 'httpHeaders'>): string {
	if (!connection) {
		return '';
	}

	const { clientAddress, httpHeaders } = connection;

	if (clientAddress) {
		return clientAddress;
	}

	const xRealIp = httpHeaders?.['x-real-ip'];
	if (Array.isArray(xRealIp)) {
		return xRealIp[0];
	}

	return xRealIp || '';
}
