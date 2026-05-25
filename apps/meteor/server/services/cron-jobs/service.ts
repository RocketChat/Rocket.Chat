import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ICronJobsService } from '@rocket.chat/core-services';
import type { ICronJobItem } from '@rocket.chat/core-typings';
import { CronJobs } from '@rocket.chat/models';

import { deriveStatus } from './deriveStatus';

export class CronJobsService extends ServiceClassInternal implements ICronJobsService {
	protected name = 'cron-jobs';

	async getCoreJobs(): Promise<{ jobs: ICronJobItem[] }> {
		const allJobs = await CronJobs.find({
			name: { $not: /^Apps-/ },
		}).toArray();

		const jobs = allJobs.map((job) => ({
			...job,
			status: job.status ?? deriveStatus(job),
		}));

		return { jobs };
	}

	async getAppJobs(): Promise<{ jobs: ICronJobItem[] }> {
		const allJobs = await CronJobs.find({
			name: /^Apps-/,
		}).toArray();

		const jobs = allJobs.map((job) => ({
			...job,
			status: job.status ?? deriveStatus(job),
		}));

		return { jobs };
	}
}