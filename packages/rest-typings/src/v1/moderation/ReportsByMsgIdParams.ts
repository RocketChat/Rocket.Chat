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
		},
		selector: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isReportsByMsgIdParams = ajv.compile<ReportsByMsgIdParamsGET>(schema);
