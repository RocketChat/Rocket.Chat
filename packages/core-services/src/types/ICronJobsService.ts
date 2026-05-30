import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import type { IServiceClass } from './ServiceClass';

export interface ICronJobsService extends IServiceClass {
	getCoreJobs(pagination?: { offset?: number; count?: number }): Promise<PaginatedResult<{ jobs: ICronJobItem[] }>>;
	getAppJobs(pagination?: { offset?: number; count?: number }): Promise<PaginatedResult<{ jobs: ICronJobItem[] }>>;
	getHistory(jobName: string, pagination?: { offset?: number; count?: number }): Promise<PaginatedResult<{ history: ICronHistoryItem[] }>>;
}
