import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IAppsEngineService } from '../../sdk/types/IAppsEngineService';
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
