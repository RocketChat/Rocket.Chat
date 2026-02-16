import { type Job, Agenda } from '@rocket.chat/agenda';
import { Logger } from '@rocket.chat/logger';
import { CronHistory } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { Db } from 'mongodb';

const logger = new Logger('Cron');

const runCronJobFunctionAndPersistResult = async (fn: () => Promise<any>, jobName: string): Promise<void> => {
	const { insertedId } = await CronHistory.insertOne({
		_id: Random.id(),
		intendedAt: new Date(),
		name: jobName,
		startedAt: new Date(),
	});
	try {
		const result = await fn();
		await CronHistory.updateOne(
			{ _id: insertedId },
			{
				$set: {
					finishedAt: new Date(),
					result,
				},
			},
		);
		return result;
	} catch (error: any) {
		await CronHistory.updateOne(
			{ _id: insertedId },
			{
				$set: {
					finishedAt: new Date(),
					error: error?.stack ? error.stack : error,
				},
			},
		);
		throw error;
	}
};

type ReservedJob = {
	name: string;
	callback: () => any | Promise<any>;
} & (
	| {
			schedule: string;
			timestamped: false;
	  }
	| {
			when: Date;
			timestamped: true;
	  }
);

export class AgendaCronJobs {
	private reservedJobs: ReservedJob[] = [];

	private scheduler: Agenda | undefined;

	public get started(): boolean {
		return Boolean(this.scheduler);
	}

	public async start(mongo: Db): Promise<void> {
		this.scheduler = new Agenda({
			mongo,
			db: { collection: 'rocketchat_cron' },
			defaultConcurrency: 1,
			processEvery: '1 minute',
		});

		this.scheduler.on('start', (job: Job) => {
			logger.debug({
				msg: `Job "${job.attrs.name}" starting`,
				jobId: job.attrs._id,
				jobName: job.attrs.name,
				nextRunAt: job.attrs.nextRunAt,
			});
		});

		this.scheduler.on('complete', (job: Job) => {
			logger.info({
				msg: `Job "${job.attrs.name}" completed`,
				jobId: job.attrs._id,
				jobName: job.attrs.name,
				lastRunAt: job.attrs.lastRunAt,
				nextRunAt: job.attrs.nextRunAt,
				duration:
					job.attrs.lastFinishedAt && job.attrs.lastRunAt ? job.attrs.lastFinishedAt.getTime() - job.attrs.lastRunAt.getTime() : undefined,
			});
		});

		this.scheduler.on('success', (job: Job) => {
			logger.debug({
				msg: `Job "${job.attrs.name}" succeeded`,
				jobId: job.attrs._id,
				jobName: job.attrs.name,
			});
		});

		this.scheduler.on('fail', (err: unknown, job: Job) => {
			logger.error({
				msg: `Job "${job.attrs.name}" failed`,
				jobId: job.attrs._id,
				jobName: job.attrs.name,
				err,
				failCount: job.attrs.failCount,
				failReason: job.attrs.failReason,
			});
		});

		this.scheduler.on('error:database', (err: unknown) => {
			logger.error({
				msg: 'Database error in cron scheduler',
				err,
			});
		});

		this.scheduler.on('error', (err: unknown) => {
			logger.error({
				msg: 'Error in cron scheduler',
				err,
			});
		});

		this.scheduler.on('ready', () => {
			logger.debug({ msg: 'Cron scheduler database ready' });
		});

		await this.scheduler.start();

		for await (const job of this.reservedJobs) {
			if (job.timestamped) {
				await this.addAtTimestamp(job.name, job.when, job.callback);
			} else {
				await this.add(job.name, job.schedule, job.callback);
			}
		}

		this.reservedJobs = [];
	}

	public async add(name: string, schedule: string, callback: () => any | Promise<any>): Promise<void> {
		if (!this.scheduler) {
			return this.reserve({ name, schedule, callback, timestamped: false });
		}

		await this.define(name, callback);
		await this.scheduler.every(schedule, name, {}, {});
		logger.debug({ msg: `Cron job "${name}" scheduled`, jobName: name, schedule });
	}

	public async addAtTimestamp(name: string, when: Date, callback: () => any | Promise<any>): Promise<void> {
		if (!this.scheduler) {
			return this.reserve({ name, when, callback, timestamped: true });
		}

		await this.define(name, callback);
		await this.scheduler.schedule(when, name, {});
		logger.debug({ msg: `Cron job "${name}" scheduled at timestamp`, jobName: name, when });
	}

	public async remove(name: string): Promise<void> {
		if (!this.scheduler) {
			return this.unreserve(name);
		}

		await this.scheduler.cancel({ name });
		logger.debug({ msg: `Cron job "${name}" removed`, jobName: name });
	}

	public async has(jobName: string): Promise<boolean> {
		if (!this.scheduler) {
			return Boolean(this.reservedJobs.find(({ name }) => name === jobName));
		}

		return this.scheduler.has({ name: jobName });
	}

	private async reserve(config: ReservedJob): Promise<void> {
		this.reservedJobs = [...this.reservedJobs, config];
	}

	private async unreserve(jobName: string): Promise<void> {
		this.reservedJobs = this.reservedJobs.filter(({ name }) => name !== jobName);
	}

	private async define(jobName: string, callback: () => any | Promise<any>): Promise<void> {
		if (!this.scheduler) {
			throw new Error('Scheduler is not running.');
		}

		this.scheduler.define(jobName, async () => {
			await runCronJobFunctionAndPersistResult(async () => callback(), jobName);
		});
	}
}

export const cronJobs = new AgendaCronJobs();
