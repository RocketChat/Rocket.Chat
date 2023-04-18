import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ReportInfoParams = {
	reportId: string;
};

const ajvParams = {
	type: 'object',
	properties: {
		reportId: {
			type: 'string',
		},
	},
	required: ['reportId'],
	additionalProperties: false,
};

export const isReportInfoParams = ajv.compile<ReportInfoParams>(ajvParams);
