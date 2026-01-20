import type { IDeviceManagementService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { LoginSessionPayload } from '@rocket.chat/core-typings';

import { deviceManagementEvents } from './events';

export class DeviceManagementService extends ServiceClassInternal implements IDeviceManagementService {
	protected name = 'device-management';

	constructor() {
		super();

		this.onEvent('accounts.login', async ({ userId, userAgent, loginToken, clientAddress }: LoginSessionPayload) => {
			// TODO need to add loginToken to data
			deviceManagementEvents.emit('device-login', { userId, userAgent, loginToken, clientAddress });
		});
	}
}
