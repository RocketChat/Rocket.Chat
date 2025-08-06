import { ajv } from './../Ajv';
export type ReportInfoParams = {
	reportId: string;
};

const ajvParams = {
	type: 'object',
	properties: {
		reportId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
	},
	required: ['reportId'],
	additionalProperties: false,
};

export const isReportInfoParams = ajv.compile<ReportInfoParams>(ajvParams);
