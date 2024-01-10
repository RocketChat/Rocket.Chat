import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { Apps } from '../../../../ee/server/apps';
import { Info } from '../../../utils/rocketchat.info';

export async function getAppsStatistics() {
	return {
		engineVersion: Info.marketplaceApiVersion,
		totalInstalled: Apps.isInitialized() && (await Apps.getManager().get()).length,
		totalActive: Apps.isInitialized() && (await Apps.getManager().get({ enabled: true })).length,
		totalFailed:
			Apps.isInitialized() &&
			(await Apps.getManager().get({ disabled: true })).filter(({ app: { status } }) => status !== AppStatus.MANUALLY_DISABLED).length,
	};
}
