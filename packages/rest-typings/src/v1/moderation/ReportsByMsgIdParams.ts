import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ReportsByMsgIdParams = {
	msgId: string;
	sort?: string;
	selector?: string;
	count?: number;
};

const schema = {
	type: 'object',
	properties: {
		msgId: {
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
	required: ['msgId'],
	additionalProperties: false,
};

export const isReportsByMsgIdParams = ajv.compile<ReportsByMsgIdParams>(schema);
