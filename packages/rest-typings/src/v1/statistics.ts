import type { IStats } from '@rocket.chat/core-typings';

import { ajv } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';

type StatisticsListProps = PaginatedRequest<{ fields?: string }>;

const StatisticsListSchema = {
	type: 'object',
	properties: {
		fields: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isStatisticsListProps = ajv.compile<StatisticsListProps>(StatisticsListSchema);

export type StatisticsEndpoints = {
	'/v1/statistics.list': {
		GET: (params: StatisticsListProps) => {
			statistics: IStats[];
			count: number;
			offset: number;
			total: number;
		};
	};
};
