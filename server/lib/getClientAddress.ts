import { IMethodConnection } from '../../definition/IMethodThisType';

export function getClientAddress(connection: IMethodConnection): string {
	if (!connection) {
		return '';
	}
	return connection.clientAddress || connection.httpHeaders['x-real-ip'];
}
