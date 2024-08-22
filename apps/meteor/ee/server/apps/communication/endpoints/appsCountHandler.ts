import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import { License } from '@rocket.chat/license';

import { API } from '../../../../../app/api/server';
import type { SuccessResult } from '../../../../../app/api/server/definition';
import { getInstallationSourceFromAppStorageItem } from '../../../../../lib/apps/getInstallationSourceFromAppStorageItem';
import type { AppsRestApi } from '../rest';

type AppsCountResult = {
	totalMarketplaceEnabled: number;
	totalPrivateEnabled: number;
	maxMarketplaceApps: number;
	maxPrivateApps: number;
};

export const appsCountHandler = (apiManager: AppsRestApi) =>
	[
		{
			authRequired: false,
		},
		{
			async get(): Promise<SuccessResult<AppsCountResult>> {
				const manager = apiManager._manager as AppManager;

				const apps = await manager.get({ enabled: true });
				const { maxMarketplaceApps, maxPrivateApps } = License.getAppsConfig();

				return API.v1.success({
					totalMarketplaceEnabled: apps.filter((app) => getInstallationSourceFromAppStorageItem(app.getStorageItem()) === 'marketplace')
						.length,
					totalPrivateEnabled: apps.filter((app) => getInstallationSourceFromAppStorageItem(app.getStorageItem()) === 'private').length,
					maxMarketplaceApps,
					maxPrivateApps,
				});
			},
		},
	] as const;
