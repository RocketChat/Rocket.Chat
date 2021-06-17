import { hasPermissionAsync } from '../../../../app/authorization/server/functions/hasPermission';
import { statistics } from '../lib/statistics';
import { Statistics } from '../../../models/raw';

export async function getLastStatistics({ userId, refresh }) {
	if (!await hasPermissionAsync(userId, 'view-statistics')) {
		throw new Error('error-not-allowed');
	}

	if (refresh) {
		return statistics.save();
	}
	return Statistics.findLast();
}
