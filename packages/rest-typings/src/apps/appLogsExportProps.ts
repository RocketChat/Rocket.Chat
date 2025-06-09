import type { AppLogsProps } from './appLogsProps';
import { ajv } from '../v1/Ajv';

export type AppLogsExportProps = Omit<AppLogsProps, 'offset' | 'query'> & {
	type: 'json' | 'plain_text';
};

const AppLogsExportPropsSchema = {
	type: 'object',
	properties: {
		appId: { type: 'string' },
		logLevel: { type: 'string', enum: ['0', '1', '2'], nullable: true },
		method: { type: 'string', nullable: true },
		startDate: { type: 'string', format: 'date-time', nullable: true },
		endDate: { type: 'string', format: 'date-time', nullable: true },
		type: { type: 'string', enum: ['json', 'plain_text'] },
		count: { type: 'number', minimum: 0, nullable: true },
		sort: { type: 'string', nullable: true },
	},
	required: ['appId', 'type'],
	additionalProperties: false,
};

export const isAppLogsExportProps = ajv.compile<AppLogsExportProps>(AppLogsExportPropsSchema);
