import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { API } from '../../../../api/server';
import type { AppsRestApi } from '../rest';
import { getAppsConfig } from '../../../../../ee/app/license/server/license';

export const appsCountHandler = (apiManager: AppsRestApi) =>
	[
		{
			authRequired: false,
		},
		{
			get(): any {
				const manager = apiManager._manager as AppManager;

				const apps = manager.get({ enabled: true });
				const { maxMarketplaceApps, maxPrivateApps } = getAppsConfig();

				return API.v1.success({
					totalMarketplaceEnabled: apps.filter((app) => app.getStorageItem().installationSource === 'marketplace').length,
					totalPrivateEnabled: apps.filter((app) => app.getStorageItem().installationSource === 'private').length,
					maxMarketplaceApps,
					maxPrivateApps,
				});
			},
		},
	] as const;
