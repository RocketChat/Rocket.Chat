import type { IDeviceManagementService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { getHeader } from '@rocket.chat/tools';

import { deviceManagementEvents } from './events';
import { getClientAddress } from '../../lib/getClientAddress';

export class DeviceManagementService extends ServiceClassInternal implements IDeviceManagementService {
	protected name = 'device-management';

	constructor() {
		super();

		this.onEvent('accounts.login', async ({ userId, connection }) => {
			deviceManagementEvents.emit('device-login', {
				userId,
				userAgent: getHeader(connection.httpHeaders, 'user-agent'),
				clientAddress: getClientAddress(connection),
				loginToken: connection.loginToken,
			});
		});
	}
}
