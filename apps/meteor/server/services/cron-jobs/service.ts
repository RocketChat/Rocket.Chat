import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ICronJobsService } from '@rocket.chat/core-services';
import type { ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { CronJobs, CronHistory, AppScheduler } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Filter } from 'mongodb';

import { deriveStatus } from './deriveStatus';

type JobsListOptions = {
	offset?: number;
	count?: number;
	searchTerm?: string;
};

const resolveStatus = (job: ICronJobItem) => {
	if (job.disabled) {
		return 'disabled';
	}

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

	async getCoreJobs(pagination?: JobsListOptions): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const { cursor, totalCount } = CronJobs.findPaginated(this.buildJobQuery(pagination?.searchTerm), {
			sort: { name: 1 },
			skip: pagination?.offset,
			limit: pagination?.count,
		});

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

	async getJob(jobName: string): Promise<ICronJobItem | null> {
		let job = await CronJobs.findOne({ name: jobName });

		if (!job) {
			job = await AppScheduler.findOne({ name: jobName });
		}

		if (!job) {
			return null;
		}

		return {
			...job,
			status: resolveStatus(job),
		};
	}

	async getAppJobs(pagination?: JobsListOptions): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const { cursor, totalCount } = AppScheduler.findPaginated(this.buildJobQuery(pagination?.searchTerm), {
			sort: { name: 1 },
			skip: pagination?.offset,
			limit: pagination?.count,
		});

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

	private buildJobQuery(searchTerm?: string): Filter<ICronJobItem> {
		const term = searchTerm?.trim();
		if (!term) {
			return {};
		}

		return {
			name: { $regex: escapeRegExp(term), $options: 'i' },
		};
	}
}
