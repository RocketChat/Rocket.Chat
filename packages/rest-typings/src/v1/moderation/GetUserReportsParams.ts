import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

type GetUserReportsParams = {
	userId: string;
	selector?: string;
};

export type GetUserReportsParamsGET = PaginatedRequest<GetUserReportsParams>;

const ajvParams = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		selector: {
			type: 'string',
			nullable: true,
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isGetUserReportsParams = ajvQuery.compile<GetUserReportsParamsGET>(ajvParams);
