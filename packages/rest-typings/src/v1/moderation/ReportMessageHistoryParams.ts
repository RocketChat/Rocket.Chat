import { ajv } from '../Ajv';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

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
		},
		selector: {
			type: 'string',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isReportMessageHistoryParams = ajv.compile<ReportMessageHistoryParamsGET>(ajvParams);
