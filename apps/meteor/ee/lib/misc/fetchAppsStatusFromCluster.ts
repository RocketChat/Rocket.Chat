import { Apps } from '@rocket.chat/core-services';

import { isRunningMs } from '../../../server/lib/isRunningMs';
import { Instance } from '../../server/sdk';

export async function fetchAppsStatusFromCluster() {
	if (isRunningMs()) {
		return Apps.getAppsStatusInNodes();
	}

	return Instance.getAppsStatusInInstances();
}
