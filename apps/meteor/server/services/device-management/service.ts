import type { IDeviceManagementService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import { deviceManagementEvents } from './events';
import { getClientAddress } from '../../lib/getClientAddress';
import { getHeader } from '../../lib/getHeader';

export class DeviceManagementService extends ServiceClassInternal implements IDeviceManagementService {
	protected name = 'device-management';

	constructor() {
		super();

		this.onEvent('accounts.login', async ({ userId, connection }) => {
			const clientAddress = getClientAddress(connection);
			const userAgent = getHeader(connection.httpHeaders, 'user-agent');
			// TODO need to add loginToken to data
			deviceManagementEvents.emit('device-login', { userId, userAgent, clientAddress });
		});
	}
}
