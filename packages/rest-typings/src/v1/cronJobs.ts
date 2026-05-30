import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type CronJobsEndpoints = {
	'/v1/cron.jobs': {
		GET: (params: PaginatedRequest) => PaginatedResult<{ jobs: ICronJobItem[] }>;
	};
	'/v1/cron.appjobs': {
		GET: (params: PaginatedRequest) => PaginatedResult<{ jobs: ICronJobItem[] }>;
	};
	'/v1/cron.history': {
		GET: (params: PaginatedRequest & { jobName: string }) => PaginatedResult<{ history: ICronHistoryItem[] }>;
	};
};
