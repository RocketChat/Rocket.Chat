import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

type ReportMessageHistoryParams = {
	userId: string;
	selector?: string;
};

export type ReportMessageHistoryParamsGET = PaginatedRequest<ReportMessageHistoryParams>;

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

export const isReportMessageHistoryParams = ajv.compile<ReportMessageHistoryParamsGET>(ajvParams);
