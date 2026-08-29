import type { ICronHistoryItem } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

export function buildHistoryQuery(jobName: string | undefined, activeJobNames: string[]): Filter<ICronHistoryItem> {
	if (jobName) {
		return { name: jobName };
	}

	return {
		$or: [{ error: { $exists: true, $nin: [null, ''] } }, { name: { $nin: activeJobNames } }],
	};
}
