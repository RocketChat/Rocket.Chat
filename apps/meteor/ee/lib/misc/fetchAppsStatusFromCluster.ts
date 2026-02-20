import { Apps } from '@rocket.chat/core-services';

import { isRunningMs } from '../../../server/lib/isRunningMs';
import { Instance } from '../../server/sdk';

export async function fetchAppsStatusFromCluster() {
	const appsStatus = isRunningMs() ? await Apps.getAppsStatusInNodes() : await Instance.getAppsStatusInInstances();

	Object.values(appsStatus).forEach((instances) =>
		instances.sort((a, b) => {
			if (a.instanceId > b.instanceId) {
				return 1;
			}

			if (a.instanceId < b.instanceId) {
				return -1;
			}

			return 0;
		}),
	);

	return appsStatus;
}
