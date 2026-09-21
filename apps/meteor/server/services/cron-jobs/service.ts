import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ICronJobsService, IBackgroundJobsPaginationParams } from '@rocket.chat/core-services';
import type { ICronJobItem, ICronHistoryItem, OmnichannelJobSource } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import type { IAppSchedulerModel, ICronJobsModel, IOmnichannelSchedulerModel } from '@rocket.chat/model-typings';
import {
	AppScheduler,
	CronHistory,
	CronJobs,
	OmnichannelAutoCloseScheduler,
	OmnichannelAutoTransferScheduler,
	OmnichannelQueueInactivityScheduler,
} from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Filter } from 'mongodb';

import { buildHistoryQuery } from './buildHistoryQuery';
import { deriveStatus } from './deriveStatus';

export class CronJobsService extends ServiceClassInternal implements ICronJobsService {
	protected name = 'cron-jobs';

	async getCoreJobs(
		pagination?: IBackgroundJobsPaginationParams,
	): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		return this.listJobs(CronJobs, pagination);
	}

	async getAppJobs(
		pagination?: IBackgroundJobsPaginationParams,
	): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		return this.listJobs(AppScheduler, pagination);
	}

	async getOmnichannelJobs(
		pagination: IBackgroundJobsPaginationParams & { source: OmnichannelJobSource },
	): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const { source, ...listOptions } = pagination;
		switch (source) {
			case 'auto-close':
				return this.listJobs(OmnichannelAutoCloseScheduler, listOptions);
			case 'auto-transfer':
				return this.listJobs(OmnichannelAutoTransferScheduler, listOptions);
			case 'queue-inactivity':
				return this.listJobs(OmnichannelQueueInactivityScheduler, listOptions);
		}
	}

	async getJob(jobName: string): Promise<ICronJobItem | null> {
		const filter = { name: jobName };
		const [cronJob, appJob, autoCloseJob, autoTransferJob, queueInactivityJob] = await Promise.all([
			CronJobs.findOne(filter),
			AppScheduler.findOne(filter),
			OmnichannelAutoCloseScheduler.findOne(filter),
			OmnichannelAutoTransferScheduler.findOne(filter),
			OmnichannelQueueInactivityScheduler.findOne(filter),
		]);

		const job = cronJob ?? appJob ?? autoCloseJob ?? autoTransferJob ?? queueInactivityJob;

		if (!job) {
			return null;
		}

		return {
			...job,
			status: job.status ?? deriveStatus(job),
		};
	}

	async getHistory(pagination?: {
		jobName?: string;
		offset?: number;
		count?: number;
	}): Promise<{ history: ICronHistoryItem[]; count: number; offset: number; total: number }> {
		const offset = pagination?.offset || 0;
		const count = pagination?.count;
		const query = pagination?.jobName
			? buildHistoryQuery(pagination.jobName, [])
			: buildHistoryQuery(undefined, await this.getActiveJobNames());

		const { cursor, totalCount } = CronHistory.findPaginated(query, {
			sort: { startedAt: -1 },
			skip: offset,
			limit: count,
		});
		const [history, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			history,
			count: history.length,
			offset,
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
		model: ICronJobsModel | IAppSchedulerModel | IOmnichannelSchedulerModel,
		pagination?: IBackgroundJobsPaginationParams,
	): Promise<{ jobs: ICronJobItem[]; count: number; offset: number; total: number }> {
		const offset = pagination?.offset || 0;
		const count = pagination?.count;
		const status = pagination?.status;
		const nameQuery = this.buildJobQuery(pagination?.searchTerm);

		const query: Filter<ICronJobItem> = status ? { ...nameQuery, status } : nameQuery;

		const { cursor, totalCount } = model.findPaginated(query, {
			sort: { name: 1 },
			skip: offset,
			limit: count,
		});

		const [allJobs, total] = await Promise.all([cursor.toArray(), totalCount]);

		const jobs = allJobs.map((job) => ({
			...job,
			status: job.status ?? deriveStatus(job),
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

	private async getActiveJobNames(): Promise<string[]> {
		const [coreJobs, appJobs, autoCloseJobs, autoTransferJobs, queueInactivityJobs] = await Promise.all([
			CronJobs.find({}, { projection: { name: 1 } }).toArray(),
			AppScheduler.find({}, { projection: { name: 1 } }).toArray(),
			OmnichannelAutoCloseScheduler.find({}, { projection: { name: 1 } }).toArray(),
			OmnichannelAutoTransferScheduler.find({}, { projection: { name: 1 } }).toArray(),
			OmnichannelQueueInactivityScheduler.find({}, { projection: { name: 1 } }).toArray(),
		]);

		return [...coreJobs, ...appJobs, ...autoCloseJobs, ...autoTransferJobs, ...queueInactivityJobs].map((job) => job.name);
	}
}
