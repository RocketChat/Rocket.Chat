import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { statistics } from '../lib/statistics';
import { Statistics } from '../../../models/server/raw';

export async function getLastStatistics({ userId, refresh }) {
	if (!(await hasPermissionAsync(userId, 'view-statistics'))) {
		throw new Error('error-not-allowed');
	}

	if (refresh) {
		return statistics.save();
	}
	return Statistics.findLast();
}
