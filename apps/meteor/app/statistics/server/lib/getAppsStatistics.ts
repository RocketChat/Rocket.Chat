import { Apps } from '@rocket.chat/apps';
import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import { AppInstallationSource } from '@rocket.chat/apps-engine/server/storage';
import mem from 'mem';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { Info } from '../../../utils/rocketchat.info';

type AppsStatistics = {
	engineVersion: string;
	totalInstalled: number | false;
	totalActive: number | false;
	totalFailed: number | false;
	totalPrivateApps: number | false;
	totalPrivateAppsEnabled: number | false;
};

async function _getAppsStatistics(): Promise<AppsStatistics> {
	if (!Apps.self?.isInitialized()) {
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
		const apps = await Apps.getManager().get();

		let totalInstalled = 0;
		let totalActive = 0;
		let totalFailed = 0;
		let totalPrivateApps = 0;
		let totalPrivateAppsEnabled = 0;

		await Promise.all(
			apps.map(async (app) => {
				totalInstalled++;

				const status = await app.getStatus();
				const storageItem = app.getStorageItem();

				if (storageItem.installationSource === AppInstallationSource.PRIVATE) {
					totalPrivateApps++;

					if (AppStatusUtils.isEnabled(status)) {
						totalPrivateAppsEnabled++;
					}
				}

				if (AppStatusUtils.isEnabled(status)) {
					totalActive++;
				} else if (status !== AppStatus.MANUALLY_DISABLED) {
					totalFailed++;
				}
			}),
		);

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
