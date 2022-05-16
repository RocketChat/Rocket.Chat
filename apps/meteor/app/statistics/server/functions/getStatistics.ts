import type { SortOptionObject, SchemaMember } from 'mongodb';
import type { IStats } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Statistics } from '../../../models/server/raw';

type GetStatisticsParams = {
	userId: string;
	query?: Record<string, any>;
	pagination: {
		offset: number;
		count?: number;
		sort?: SortOptionObject<IStats>;
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

	const cursor = Statistics.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
		projection: fields,
	});

	const total = await cursor.count();

	const statistics = await cursor.toArray();

	return {
		statistics,
		count: statistics.length,
		offset,
		total,
	};
}
