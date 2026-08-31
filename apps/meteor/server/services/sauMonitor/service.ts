// import type { Db } from 'mongodb';

import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ISAUMonitorService } from '@rocket.chat/core-services';
import { getHeader } from '@rocket.chat/tools';

import { sauEvents } from './events';

export class SAUMonitorService extends ServiceClassInternal implements ISAUMonitorService {
	protected name = 'sau-monitor';

	constructor() {
		super();

		this.onEvent('accounts.login', async ({ userId, connection }) => {
			sauEvents.emit('sau.accounts.login', {
				userId,
				instanceId: connection.instanceId,
				connectionId: connection.id,
				loginToken: connection.loginToken,
				clientAddress: connection.clientAddress || getHeader(connection.httpHeaders, 'x-real-ip'),
				userAgent: getHeader(connection.httpHeaders, 'user-agent'),
				host: getHeader(connection.httpHeaders, 'host'),
			});
		});

		this.onEvent('accounts.logout', async ({ userId, connection }) => {
			sauEvents.emit('sau.accounts.logout', { userId, sessionId: connection.id });
		});

		this.onEvent('socket.disconnected', async (data) => {
			sauEvents.emit('sau.socket.disconnected', { instanceId: data.instanceId, connectionId: data.id });
		});

		this.onEvent('socket.connected', async (data) => {
			sauEvents.emit('sau.socket.connected', { instanceId: data.instanceId, connectionId: data.id });
		});
	}
}
