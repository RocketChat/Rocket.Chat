import Ajv from 'ajv';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({ coerceTypes: true });

// Define the type of the request body of call to fetch the reported messages

export type ReportHistoryProps = PaginatedRequest<{
	latest?: Date;
	oldest?: Date;
	count?: number;
}>;

const reportHistoryPropsSchema = {
	type: 'object',
	properties: {
		latest: {
			type: 'date',
			minLength: 1,
			nullable: true,
		},
		oldest: {
			type: 'date',
			minLength: 1,
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isReportHistoryProps = ajv.compile<ReportHistoryProps>(reportHistoryPropsSchema);
