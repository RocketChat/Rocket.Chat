import { AppInterface as AppEvents } from '@rocket.chat/apps-engine/definition/metadata';
import { ServiceClassInternal, Apps } from '@rocket.chat/core-services';
import type { IAppsEngineService } from '@rocket.chat/core-services';

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
