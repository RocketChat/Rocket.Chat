import { Apps } from '@rocket.chat/apps';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { Info } from '../../../utils/rocketchat.info';

export async function getAppsStatistics() {
	return {
		engineVersion: Info.marketplaceApiVersion,
		totalInstalled: Apps.self?.isInitialized() && (await Apps.getManager().get()).length,
		totalActive: Apps.self?.isInitialized() && (await Apps.getManager().get({ enabled: true })).length,
		totalFailed:
			Apps.self?.isInitialized() &&
			(await Apps.getManager().get({ disabled: true })).filter(({ app: { status } }) => status !== AppStatus.MANUALLY_DISABLED).length,
	};
}
