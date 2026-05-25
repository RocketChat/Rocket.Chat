import type { ICronJobItem } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface ICronJobsService extends IServiceClass {
	getCoreJobs(): Promise<{ jobs: ICronJobItem[] }>;
	getAppJobs(): Promise<{ jobs: ICronJobItem[] }>;
}