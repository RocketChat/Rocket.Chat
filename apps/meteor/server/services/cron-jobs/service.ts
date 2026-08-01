import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ICronJobsService } from '@rocket.chat/core-services';
import type { CronJobStatus, ICronJobItem, ICronHistoryItem } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import type { IAppSchedulerModel, ICronJobsModel } from '@rocket.chat/model-typings';
import { AppScheduler, CronHistory, CronJobs } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Filter } from 'mongodb';

import { deriveStatus } from './deriveStatus';

const resolveStatus = (job: ICronJobItem): CronJobStatus => {
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

	async getCoreJobs(pagination?: {
		offset?: number;
		count?: number;
		searchTerm?: string;
		status?: CronJobStatus;
	}): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		return this.listJobs(CronJobs, pagination);
	}

	async getAppJobs(pagination?: {
		offset?: number;
		count?: number;
		searchTerm?: string;
		status?: CronJobStatus;
	}): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		return this.listJobs(AppScheduler, pagination);
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

	private async listJobs(
		model: ICronJobsModel | IAppSchedulerModel,
		pagination?: {
			offset?: number;
			count?: number;
			searchTerm?: string;
			status?: CronJobStatus;
		},
	): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const offset = pagination?.offset || 0;
		const count = pagination?.count;
		const status = pagination?.status;
		const query = this.buildJobQuery(pagination?.searchTerm);

		if (status) {
			const filtered = (await model.find(query, { sort: { name: 1 } }).toArray())
				.map((job) => ({
					...job,
					status: resolveStatus(job),
				}))
				.filter((job) => job.status === status);

			const jobs = count ? filtered.slice(offset, offset + count) : filtered.slice(offset);

			return {
				jobs,
				count: jobs.length,
				offset,
				total: filtered.length,
			};
		}

		const { cursor, totalCount } = model.findPaginated(query, {
			sort: { name: 1 },
			skip: offset,
			limit: count,
		});

		const [allJobs, total] = await Promise.all([cursor.toArray(), totalCount]);

		const jobs = allJobs.map((job) => ({
			...job,
			status: resolveStatus(job),
		}));

		return {
			jobs,
			count: jobs.length,
			offset,
			total,
		};
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
