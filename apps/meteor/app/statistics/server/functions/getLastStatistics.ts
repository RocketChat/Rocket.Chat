import type { IUser } from '@rocket.chat/core-typings';
import { Statistics } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { statistics } from '../lib/statistics';

export async function getLastStatistics({ userId, refresh }: { userId: IUser['_id']; refresh?: boolean }) {
	if (!(await hasPermissionAsync(userId, 'view-statistics'))) {
		throw new Error('error-not-allowed');
	}

	if (refresh) {
		return statistics.save();
	}
	return Statistics.findLast();
}
