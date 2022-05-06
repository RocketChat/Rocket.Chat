import type { IMethodConnection } from '@rocket.chat/core-typings';

export function getClientAddress(connection: IMethodConnection): string {
	if (!connection) {
		return '';
	}
	return connection.clientAddress || connection.httpHeaders['x-real-ip'];
}
