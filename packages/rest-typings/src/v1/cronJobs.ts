import type { ICronJobItem } from '@rocket.chat/core-typings';

export type CronJobsEndpoints = {
	'/v1/cron.jobs': {
		GET: (params: void) => {
			jobs: ICronJobItem[];
		};
	};
	'/v1/cron.appjobs': {
		GET: (params: void) => {
			jobs: ICronJobItem[];
		};
	};
};
