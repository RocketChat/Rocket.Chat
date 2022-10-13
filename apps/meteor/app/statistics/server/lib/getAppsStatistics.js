import { Apps } from '../../../../server/sdk';
import { Info } from '../../../utils/server';

export function getAppsStatistics() {
	const { totalInstalled, totalActive, totalFailed } = Apps.getAppsStatistics();
	return {
		engineVersion: Info.marketplaceApiVersion,
		enabled: Apps.isEnabled(),
		totalInstalled,
		totalActive,
		totalFailed,
	};
}
