import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

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
	required: ['msgId'],
	additionalProperties: false,
};

export const isReportsByMsgIdParams = ajv.compile<ReportsByMsgIdParamsGET>(schema);
