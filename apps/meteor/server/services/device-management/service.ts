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
			// TODO need to add loginToken to data
			deviceManagementEvents.emit('device-login', {
				userId,
				userAgent: getHeader(connection.httpHeaders, 'user-agent'),
				clientAddress: getClientAddress(connection),
			});
		});
	}
}
