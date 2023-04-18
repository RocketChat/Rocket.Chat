import Ajv from 'ajv';
// ajv for params { userId: string; sort?: string; selector?: string; count?: number }

const ajv = new Ajv({
	coerceTypes: true,
});

export type ReportMessageHistoryParams = {
	userId: string;
	sort?: string;
	selector?: string;
	count?: number;
};

const ajvParams = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		sort: {
			type: 'string',
		},
		selector: {
			type: 'string',
		},
		count: {
			type: 'number',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isReportMessageHistoryParams = ajv.compile<ReportMessageHistoryParams>(ajvParams);
