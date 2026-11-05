import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

type ReportsByMsgIdParams = {
	msgId: string;
	selector?: string;
};

export type ReportsByMsgIdParamsGET = PaginatedRequest<ReportsByMsgIdParams>;

const schema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
			minLength: 1,
		},
		selector: {
			type: 'string',
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isReportsByMsgIdParams = ajvQuery.compile<ReportsByMsgIdParamsGET>(schema);
