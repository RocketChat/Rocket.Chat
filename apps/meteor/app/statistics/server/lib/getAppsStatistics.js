import { AppsStatistics } from '@rocket.chat/core-services';

import { Info } from '../../../utils/server';

export async function getAppsStatistics() {
	const { totalActive, totalFailed, totalInstalled } = await AppsStatistics.getStatistics();

	return {
		engineVersion: Info.marketplaceApiVersion,
		totalInstalled,
		totalActive,
		totalFailed,
	};
}
