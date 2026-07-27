import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import type { IServiceClass } from './ServiceClass';

export interface ICronJobsService extends IServiceClass {
	getCoreJobs(pagination?: { offset?: number; count?: number; searchTerm?: string }): Promise<PaginatedResult<{ jobs: ICronJobItem[] }>>;
	getAppJobs(pagination?: { offset?: number; count?: number; searchTerm?: string }): Promise<PaginatedResult<{ jobs: ICronJobItem[] }>>;
	getHistory(jobName: string, pagination?: { offset?: number; count?: number }): Promise<PaginatedResult<{ history: ICronHistoryItem[] }>>;
	getJob(jobName: string): Promise<ICronJobItem | null>;

	enable(jobName: string): Promise<boolean>;
	disable(jobName: string): Promise<boolean>;
	trigger(jobName: string): Promise<boolean>;
}
