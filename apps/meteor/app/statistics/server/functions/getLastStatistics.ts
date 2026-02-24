import type { IUser } from '@rocket.chat/core-typings';
import { Statistics } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { statistics } from '../lib/statistics';

const formatDate = (date: any): string | undefined => {
	if (!date) return undefined;
	return (date instanceof Date ? date : new Date(date)).toString();
};

export async function getLastStatistics({ userId, refresh }: { userId: IUser['_id']; refresh?: boolean }) {
	if (!(await hasPermissionAsync(userId, 'view-statistics'))) {
		throw new Error('error-not-allowed');
	}

	if (refresh) {
		return statistics.save();
	}

	const stats = await Statistics.findLast();

	if (!stats) {
		return stats;
	}

	// Ensure dates are formatted consistently as strings (same as when refresh=true)
	// This prevents JSON schema validation errors where Date | string types cause ambiguity
	if (stats.migration) {
		stats.migration = {
			...stats.migration,
			buildAt: formatDate(stats.migration.buildAt),
			lockedAt: formatDate(stats.migration.lockedAt),
		};
	}

	// Format createdAt if it's a Date object
	if (stats.createdAt instanceof Date) {
		stats.createdAt = stats.createdAt.toString();
	}

	return stats;
}
