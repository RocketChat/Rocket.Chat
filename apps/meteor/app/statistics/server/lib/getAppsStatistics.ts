import { Apps } from '@rocket.chat/apps';
import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import mem from 'mem';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { Info } from '../../../utils/rocketchat.info';

export type AppsStatistics = {
	engineVersion: string;
	totalInstalled: number | false;
	totalActive: number | false;
	totalFailed: number | false;
};

async function _getAppsStatistics(): Promise<AppsStatistics> {
	if (!Apps.self?.isInitialized()) {
		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled: false,
			totalActive: false,
			totalFailed: false,
		};
	}

	try {
		const apps = await Apps.getManager().get();

		let totalInstalled = 0;
		let totalActive = 0;
		let totalFailed = 0;

		await Promise.all(
			apps.map(async (app) => {
				totalInstalled++;

				const status = await app.getStatus();

				if (status === AppStatus.MANUALLY_DISABLED) {
					totalFailed++;
				}

				if (AppStatusUtils.isEnabled(status)) {
					totalActive++;
				}
			}),
		);

		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled,
			totalActive,
			totalFailed,
		};
	} catch (err: unknown) {
		SystemLogger.error({ msg: 'Exception while getting Apps statistics', err });
		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled: false,
			totalActive: false,
			totalFailed: false,
		};
	}
}

// since this function is called every 5s by `setPrometheusData` we're memoizing the result since the result won't change that often
export const getAppsStatistics = mem(_getAppsStatistics, { maxAge: 60000 });
