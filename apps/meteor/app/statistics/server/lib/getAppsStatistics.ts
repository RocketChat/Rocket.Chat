import { Apps } from '@rocket.chat/apps';
import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';

import { Info } from '../../../utils/rocketchat.info';

export type AppsStatistics = {
	engineVersion: string;
	totalInstalled: number | false;
	totalActive: number | false;
	totalFailed: number | false;
};

export async function getAppsStatistics(): Promise<AppsStatistics> {
	if (!Apps.self?.isInitialized()) {
		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled: false,
			totalActive: false,
			totalFailed: false,
		};
	}

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
}
