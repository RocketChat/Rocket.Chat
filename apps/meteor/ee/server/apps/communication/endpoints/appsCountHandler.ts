import { AppsManager } from '@rocket.chat/core-services';
import type { IAppStorageItem } from '@rocket.chat/core-typings';

import { API } from '../../../../../app/api/server';
import { getAppsConfig } from '../../../../app/license/server/license';
import type { SuccessResult } from '../../../../../app/api/server/definition';
import { getInstallationSourceFromAppStorageItem } from '../../../../../lib/apps/getInstallationSourceFromAppStorageItem';

type AppsCountResult = {
	totalMarketplaceEnabled: number;
	totalPrivateEnabled: number;
	maxMarketplaceApps: number;
	maxPrivateApps: number;
};

export const appsCountHandler = () =>
	[
		{
			authRequired: false,
		},
		{
			async get(): Promise<SuccessResult<AppsCountResult>> {
				const apps = await AppsManager.get({ enabled: true });
				const { maxMarketplaceApps, maxPrivateApps } = getAppsConfig();

				return API.v1.success({
					totalMarketplaceEnabled: apps.filter(
						(app) => getInstallationSourceFromAppStorageItem(app?.getStorageItem() as IAppStorageItem) === 'marketplace',
					).length,
					totalPrivateEnabled: apps.filter(
						(app) => getInstallationSourceFromAppStorageItem(app?.getStorageItem() as IAppStorageItem) === 'private',
					).length,
					maxMarketplaceApps,
					maxPrivateApps,
				});
			},
		},
	] as const;
