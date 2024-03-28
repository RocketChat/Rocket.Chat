import { Apps } from '@rocket.chat/apps';
import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { Info } from '../../../utils/rocketchat.info';

export function getAppsStatistics() {
	return {
		engineVersion: Info.marketplaceApiVersion,
		totalInstalled: (Apps?.isInitialized() && Apps.getManager().get().length) ?? 0,
		totalActive: (Apps?.isInitialized() && Apps.getManager().get({ enabled: true }).length) ?? 0,
		totalFailed:
			(Apps?.isInitialized() &&
				Apps.getManager()
					.get({ disabled: true })
					.filter(({ app: { status } }) => status !== AppStatus.MANUALLY_DISABLED).length) ??
			0,
	};
}
