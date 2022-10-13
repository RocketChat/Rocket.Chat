import { AppInterface as AppEvents } from '@rocket.chat/apps-engine/definition/metadata';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IAppsEngineService } from '../../sdk/types/IAppsEngineService';
import { Apps } from '../../sdk';

export class AppsEngineService extends ServiceClassInternal implements IAppsEngineService {
	protected name = 'apps-engine';

	async created() {
		this.onEvent('presence.status', async ({ user, previousStatus }): Promise<void> => {
			Apps.triggerEvent(AppEvents.IPostUserStatusChanged, {
				user,
				currentStatus: user.status,
				previousStatus,
			});
		});
	}
}
