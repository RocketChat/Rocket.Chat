import type { AppLogsProps } from './appLogsProps';
import { ajv } from '../v1/Ajv';

export type AppLogsExportProps = Omit<AppLogsProps, 'appId' | 'offset' | 'query'> & {
	type: 'json' | 'csv';
};

const AppLogsExportPropsSchema = {
	type: 'object',
	properties: {
		logLevel: { type: 'string', enum: ['0', '1', '2'], nullable: true },
		method: { type: 'string', nullable: true },
		instanceId: { type: 'string', nullable: true },
		startDate: { type: 'string', format: 'date-time', nullable: true },
		endDate: { type: 'string', format: 'date-time', nullable: true },
		type: { type: 'string', enum: ['json', 'csv'] },
		count: { type: 'number', minimum: 1, nullable: true },
		sort: { type: 'string', nullable: true },
	},
	required: ['type'],
	additionalProperties: false,
};

export const isAppLogsExportProps = ajv.compile<AppLogsExportProps>(AppLogsExportPropsSchema);
