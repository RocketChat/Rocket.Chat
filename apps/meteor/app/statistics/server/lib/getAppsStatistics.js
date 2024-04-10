import { Apps } from '@rocket.chat/apps';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { Info } from '../../../utils/rocketchat.info';

export async function getAppsStatistics() {
	if (Apps.self?.isInitialized()) {
		return {
			engineVersion: Info.marketplaceApiVersion,
			totalInstalled: false,
			totalActive: false,
			totalFailed: false,
		};
	}

	return {
		engineVersion: Info.marketplaceApiVersion,
		totalInstalled: (await Apps.getManager().get()).length,
		totalActive: (await Apps.getManager().get({ enabled: true })).length,
		totalFailed: (await Apps.getManager().get({ disabled: true })).filter(({ app: { status } }) => status !== AppStatus.MANUALLY_DISABLED)
			.length,
	};
}
