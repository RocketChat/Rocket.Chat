import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

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
		count: {
			type: 'integer',
			nullable: true,
		},
		offset: {
			type: 'integer',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isGetUserReportsParams = ajv.compile<GetUserReportsParamsGET>(ajvParams);
