import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { API } from '../../../../../app/api/server';
import type { AppsRestApi } from '../rest';
import { getAppsConfig } from '../../../../app/license/server/license';
import type { SuccessResult } from '../../../../../app/api/server/definition';
import { getInstallationSourceFromAppStorageItem } from '../../../../../lib/apps/getInstallationSourceFromAppStorageItem';

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
			get(): SuccessResult<AppsCountResult> {
				const manager = apiManager._manager as AppManager;

				const apps = manager.get({ enabled: true });
				const { maxMarketplaceApps, maxPrivateApps } = getAppsConfig();

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
