import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IAppsEngineService } from '@rocket.chat/core-services';

import { Apps, AppEvents } from '../../../ee/server/apps/orchestrator';

export class AppsEngineService extends ServiceClassInternal implements IAppsEngineService {
	protected name = 'apps-engine';

	constructor() {
		super();

		this.onEvent('presence.status', async ({ user, previousStatus }): Promise<void> => {
			Apps.triggerEvent(AppEvents.IPostUserStatusChanged, {
				user,
				currentStatus: user.status,
				previousStatus,
			});
		});

		this.onEvent('apps.added', async (appId: string): Promise<void> => {
			// ts-expect-error
			await (Apps.getManager()! as any).loadOne(appId); // TO-DO: fix type
		});
	}
}
