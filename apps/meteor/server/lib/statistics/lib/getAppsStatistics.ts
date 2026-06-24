import { Apps } from '@rocket.chat/apps';
import { AppInstallationSource } from '@rocket.chat/apps/dist/server/storage/IAppStorageItem';
import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import mem from 'mem';

import { Info } from '../../../../app/utils/rocketchat.info';
import { SystemLogger } from '../../logger/system';

type AppsStatistics = {
	engineVersion: string;
	totalInstalled: number | false;
	totalActive: number | false;
	totalFailed: number | false;
	totalPrivateApps: number | false;
	totalPrivateAppsEnabled: number | false;
};

async function _getAppsStatistics(): Promise<AppsStatistics> {
	if (!Apps.isInitialized()) {
		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled: false,
			totalActive: false,
			totalFailed: false,
			totalPrivateApps: false,
			totalPrivateAppsEnabled: false,
		};
	}

	try {
		const [statuses, privateApps] = await Promise.all([
			Apps.getAppsStatusLocal(),
			Apps.getApps({ installationSource: AppInstallationSource.PRIVATE }),
		]);

		const privateAppIds = new Set((privateApps ?? []).map((app) => app.id));

		let totalInstalled = 0;
		let totalActive = 0;
		let totalFailed = 0;
		let totalPrivateApps = 0;
		let totalPrivateAppsEnabled = 0;

		for (const { appId, status } of statuses) {
			totalInstalled++;

			const isEnabled = AppStatusUtils.isEnabled(status);

			if (privateAppIds.has(appId)) {
				totalPrivateApps++;

				if (isEnabled) {
					totalPrivateAppsEnabled++;
				}
			}

			if (isEnabled) {
				totalActive++;
			} else if (status !== AppStatus.MANUALLY_DISABLED) {
				totalFailed++;
			}
		}

		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled,
			totalActive,
			totalFailed,
			totalPrivateApps,
			totalPrivateAppsEnabled,
		};
	} catch (err: unknown) {
		SystemLogger.error({ msg: 'Exception while getting Apps statistics', err });
		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled: false,
			totalActive: false,
			totalFailed: false,
			totalPrivateApps: false,
			totalPrivateAppsEnabled: false,
		};
	}
}

// since this function is called every 5s by `setPrometheusData` we're memoizing the result since the result won't change that often
export const getAppsStatistics = mem(_getAppsStatistics, { maxAge: 60000 });
