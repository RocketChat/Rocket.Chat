// import type { Db } from 'mongodb';

import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ISAUMonitorService } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';

import { sauEvents } from './events';
import { getClientAddress } from '../../lib/getClientAddress';
import { getHeader } from '../../lib/getHeader';

export class SAUMonitorService extends ServiceClassInternal implements ISAUMonitorService {
	protected name = 'sau-monitor';

	constructor() {
		super();

		this.onEvent('accounts.login', async ({ userId, connection }) => {
			const instanceId = InstanceStatus.id();
			const clientAddress = getClientAddress(connection);
			const userAgent = getHeader(connection.httpHeaders, 'user-agent');
			const host = getHeader(connection.httpHeaders, 'host');

			sauEvents.emit('sau.accounts.login', {
				userId,
				instanceId,
				connectionId: connection.id,
				loginToken: connection.loginToken,
				clientAddress,
				userAgent,
				host,
			});
		});

		this.onEvent('accounts.logout', async ({ userId, connection }) => {
			sauEvents.emit('sau.accounts.logout', { userId, sessionId: connection.id });
		});

		this.onEvent('socket.disconnected', async (data) => {
			sauEvents.emit('sau.socket.disconnected', { instanceId: InstanceStatus.id(), connectionId: data.id });
		});

		this.onEvent('socket.connected', async (data) => {
			// console.log('socket.connected', data);
			sauEvents.emit('sau.socket.connected', { instanceId: InstanceStatus.id(), connectionId: data.id });
		});
	}
}
