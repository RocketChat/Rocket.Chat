import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ICronJobsService } from '@rocket.chat/core-services';
import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import { CronJobs, CronHistory } from '@rocket.chat/models';

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

	async getHistory(jobName: string): Promise<{ history: ICronHistoryItem[] }> {
		const history = await CronHistory.find({
			name: jobName,
		})
			.sort({ intendedAt: -1 })
			.toArray();

		return { history };
	}
}
