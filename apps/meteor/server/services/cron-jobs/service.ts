import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ICronJobsService } from '@rocket.chat/core-services';
import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import { CronJobs, CronHistory } from '@rocket.chat/models';

import { deriveStatus } from './deriveStatus';

export class CronJobsService extends ServiceClassInternal implements ICronJobsService {
	protected name = 'cron-jobs';

	async getCoreJobs(pagination?: {
		offset?: number;
		count?: number;
	}): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const { cursor, totalCount } = CronJobs.findPaginated(
			{
				name: { $not: /^Apps-/ },
			},
			{
				skip: pagination?.offset,
				limit: pagination?.count,
			},
		);

		const [allJobs, total] = await Promise.all([cursor.toArray(), totalCount]);

		const jobs = allJobs.map((job) => ({
			...job,
			status: job.status ?? deriveStatus(job),
		}));

		return {
			jobs,
			count: jobs.length,
			offset: pagination?.offset || 0,
			total,
		};
	}

	async getAppJobs(pagination?: {
		offset?: number;
		count?: number;
	}): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const { cursor, totalCount } = CronJobs.findPaginated(
			{
				name: /^Apps-/,
			},
			{
				skip: pagination?.offset,
				limit: pagination?.count,
			},
		);

		const [allJobs, total] = await Promise.all([cursor.toArray(), totalCount]);

		const jobs = allJobs.map((job) => ({
			...job,
			status: job.status ?? deriveStatus(job),
		}));

		return {
			jobs,
			count: jobs.length,
			offset: pagination?.offset || 0,
			total,
		};
	}

	async getHistory(
		jobName: string,
		pagination?: { offset?: number; count?: number },
	): Promise<{ history: ICronHistoryItem[]; count: number; offset: number; total: number }> {
		const { cursor, totalCount } = CronHistory.findPaginated(
			{
				name: jobName,
			},
			{
				sort: { intendedAt: -1 },
				skip: pagination?.offset,
				limit: pagination?.count,
			},
		);
		const [history, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			history,
			count: history.length,
			offset: pagination?.offset || 0,
			total,
		};
	}
}
