import type { IStats } from '@rocket.chat/core-typings';
import { Statistics } from '@rocket.chat/models';
import type { FindOptions, SchemaMember } from 'mongodb';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

type GetStatisticsParams = {
	userId: string;
	query?: Record<string, any>;
	pagination: {
		offset: number;
		count?: number;
		sort?: FindOptions<IStats>['sort'];
		fields?: SchemaMember<IStats, number | boolean>;
	};
};

type GetStatisticsReturn = { statistics: IStats[]; count: number; offset: number; total: number };

export async function getStatistics({
	userId,
	query = {},
	pagination: { offset, count, sort, fields },
}: GetStatisticsParams): Promise<GetStatisticsReturn> {
	if (!(await hasPermissionAsync(userId, 'view-statistics'))) {
		throw new Error('error-not-allowed');
	}

	const { cursor, totalCount } = Statistics.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
		projection: fields,
	});

	const [statistics, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		statistics,
		count: statistics.length,
		offset,
		total,
	};
}
