import type { CronJobStatus, ICronJobItem, ICronHistoryItem, OmnichannelJobSource } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import type { IServiceClass } from './ServiceClass';

export interface IBackgroundJobsPaginationParams {
	offset?: number;
	count?: number;
	searchTerm?: string;
	status?: CronJobStatus;
}

export interface ICronJobsService extends IServiceClass {
	getCoreJobs(pagination?: IBackgroundJobsPaginationParams): Promise<PaginatedResult<{ jobs: ICronJobItem[] }>>;
	getAppJobs(pagination?: IBackgroundJobsPaginationParams): Promise<PaginatedResult<{ jobs: ICronJobItem[] }>>;
	getOmnichannelJobs(
		pagination: IBackgroundJobsPaginationParams & { source: OmnichannelJobSource },
	): Promise<PaginatedResult<{ jobs: ICronJobItem[] }>>;
	getHistory(pagination?: { jobName?: string; offset?: number; count?: number }): Promise<PaginatedResult<{ history: ICronHistoryItem[] }>>;

	getJob(jobName: string): Promise<ICronJobItem | null>;

	enable(jobName: string): Promise<boolean>;
	disable(jobName: string): Promise<boolean>;
	trigger(jobName: string): Promise<boolean>;
}
