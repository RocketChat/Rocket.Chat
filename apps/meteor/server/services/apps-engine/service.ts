import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IAppsEngineService } from '@rocket.chat/core-services';

import { Apps, AppEvents } from '../../../app/apps/server/orchestrator';

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
