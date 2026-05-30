import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface ICronJobsService extends IServiceClass {
	getCoreJobs(): Promise<{ jobs: ICronJobItem[] }>;
	getAppJobs(): Promise<{ jobs: ICronJobItem[] }>;
	getHistory(jobName: string): Promise<{ history: ICronHistoryItem[] }>;
}
