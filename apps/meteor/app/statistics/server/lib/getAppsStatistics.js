import { AppsStatistics, Apps } from '@rocket.chat/core-services';

import { Info } from '../../../utils/server';

export async function getAppsStatistics() {
	const { totalInstalled, totalActive, totalFailed } = await AppsStatistics.getStatistics();

	return {
		engineVersion: Info.marketplaceApiVersion,
		enabled: await Apps.isEnabled(),
		totalInstalled,
		totalActive,
		totalFailed,
	};
}
