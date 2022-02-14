// import type { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { ISAUMonitorService } from '../../sdk/types/ISAUMonitorService';
import { sauEvents } from './events';

export class SAUMonitorService extends ServiceClassInternal implements ISAUMonitorService {
	protected name = 'sau-monitor';

	constructor() {
		super();

		this.onEvent('accounts.login', async (data) => {
			sauEvents.emit('accounts.login', data);
		});

		this.onEvent('accounts.logout', async (data) => {
			sauEvents.emit('accounts.logout', data);
		});

		this.onEvent('socket.disconnected', async (data) => {
			// console.log('socket.disconnected', data);
			sauEvents.emit('socket.disconnected', data);
		});

		this.onEvent('socket.connected', async (data) => {
			// console.log('socket.connected', data);
			sauEvents.emit('socket.connected', data);
		});
	}
}
