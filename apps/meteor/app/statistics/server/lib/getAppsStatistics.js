import { AppsStatistics, Apps } from '../../../../server/sdk';
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
