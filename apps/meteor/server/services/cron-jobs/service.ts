import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ICronJobsService } from '@rocket.chat/core-services';
import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { CronJobs, CronHistory, AppScheduler } from '@rocket.chat/models';

import { deriveStatus } from './deriveStatus';

const resolveStatus = (job: ICronJobItem) => {
	if (job.status === 'running') {
		const derived = deriveStatus(job);
		if (derived !== 'running') {
			return derived;
		}
	}
	return job.status ?? deriveStatus(job);
};

export class CronJobsService extends ServiceClassInternal implements ICronJobsService {
	protected name = 'cron-jobs';

	async getCoreJobs(pagination?: {
		offset?: number;
		count?: number;
	}): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const { cursor, totalCount } = CronJobs.findPaginated(
			{},
			{
				sort: { name: 1 },
				skip: pagination?.offset,
				limit: pagination?.count,
			},
		);

		const [allJobs, total] = await Promise.all([cursor.toArray(), totalCount]);

		const jobs = allJobs.map((job) => ({
			...job,
			status: resolveStatus(job),
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
		const { cursor, totalCount } = AppScheduler.findPaginated(
			{},
			{
				sort: { name: 1 },
				skip: pagination?.offset,
				limit: pagination?.count,
			},
		);

		const [allJobs, total] = await Promise.all([cursor.toArray(), totalCount]);

		const jobs = allJobs.map((job) => ({
			...job,
			status: resolveStatus(job),
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

	async enable(jobName: string): Promise<boolean> {
		return cronJobs.enable(jobName);
	}

	async disable(jobName: string): Promise<boolean> {
		return cronJobs.disable(jobName);
	}

	async trigger(jobName: string): Promise<boolean> {
		return cronJobs.trigger(jobName);
	}
}
