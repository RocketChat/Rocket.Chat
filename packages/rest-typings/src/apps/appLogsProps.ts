import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import { ajv } from '../v1/Ajv';

export type AppLogsProps = PaginatedRequest<{
	appId?: string;
	logLevel?: '0' | '1' | '2';
	method?: string;
	startDate?: string;
	endDate?: string;
}>;

const AppLogsPropsSchema = {
	type: 'object',
	properties: {
		appId: { type: 'string', nullable: true },
		logLevel: { type: 'string', enum: ['0', '1', '2'], nullable: true },
		method: { type: 'string', nullable: true },
		startDate: { type: 'string', format: 'date-time', nullable: true },
		endDate: { type: 'string', format: 'date-time', nullable: true },
		offset: { type: 'number', minimum: 0, nullable: true },
		count: { type: 'number', minimum: 0, nullable: true },
		sort: { type: 'string', nullable: true },
	},
	additionalProperties: false,
};

export const isAppLogsProps = ajv.compile<AppLogsProps>(AppLogsPropsSchema);
