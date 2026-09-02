import { type Job, Agenda } from '@rocket.chat/agenda';
import { Logger } from '@rocket.chat/logger';
import { CronHistory, CronJobs } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { Db } from 'mongodb';

const logger = new Logger('Cron');

const runCronJobFunctionAndPersistResult = async (fn: () => Promise<unknown>, jobName: string): Promise<void> => {
	const { insertedId } = await CronHistory.insertOne({
		_id: Random.id(),
		intendedAt: new Date(),
		name: jobName,
		startedAt: new Date(),
		type: 'system',
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
	} catch (error: unknown) {
		await CronHistory.updateOne(
			{ _id: insertedId },
			{
				$set: {
					finishedAt: new Date(),
					error: error instanceof Error && error.stack ? error.stack : String(error),
				},
			},
		);
		throw error;
	}
};

type ReservedJob = {
	name: string;
	callback: () => unknown | Promise<unknown>;
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
			void CronJobs.updateOne({ _id: job.attrs._id }, { $set: { status: 'running' } });
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

			if (!job.attrs.nextRunAt) {
				CronJobs.deleteOne({ _id: job.attrs._id }).catch((err) => {
					logger.error({ msg: 'Failed to delete completed cron job', err, jobId: job.attrs._id });
				});
				return;
			}

			void CronJobs.updateOne({ _id: job.attrs._id }, { $set: { status: 'scheduled' } });
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
			void CronJobs.updateOne({ _id: job.attrs._id }, { $set: { status: 'failed' } });
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

		for (const job of this.reservedJobs) {
			if (job.timestamped) {
				await this.addAtTimestamp(job.name, job.when, job.callback);
			} else {
				await this.add(job.name, job.schedule, job.callback);
			}
		}

		this.reservedJobs = [];
	}

	public async add(name: string, schedule: string, callback: () => unknown | Promise<unknown>): Promise<void> {
		if (!this.scheduler) {
			return this.reserve({ name, schedule, callback, timestamped: false });
		}

		await this.define(name, callback);
		const job = await this.scheduler.every(schedule, name, {}, {});
		await CronJobs.updateOne({ _id: job.attrs._id, status: { $exists: false } }, { $set: { status: 'scheduled' } });
		logger.debug({ msg: `Cron job "${name}" scheduled`, jobName: name, schedule });
	}

	public async addAtTimestamp(name: string, when: Date, callback: () => unknown | Promise<unknown>): Promise<void> {
		if (!this.scheduler) {
			return this.reserve({ name, when, callback, timestamped: true });
		}

		await this.define(name, callback);
		const job = await this.scheduler.schedule(when, name, {});
		await CronJobs.updateOne({ _id: job.attrs._id, status: { $exists: false } }, { $set: { status: 'scheduled' } });
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

	public async enable(jobName: string): Promise<boolean> {
		if (!this.scheduler) {
			return false;
		}

		const jobs = await this.scheduler.jobs({ name: jobName });

		if (!jobs.length) {
			return false;
		}

		const job = jobs[0];
		job.enable();
		await job.save();
		await CronJobs.updateOne({ _id: job.attrs._id }, { $set: { status: 'scheduled' } });

		return true;
	}

	public async disable(jobName: string): Promise<boolean> {
		if (!this.scheduler) {
			return false;
		}

		const jobs = await this.scheduler.jobs({ name: jobName });
		if (!jobs.length) {
			return false;
		}

		const job = jobs[0];
		job.disable();
		await job.save();
		await CronJobs.updateOne({ _id: job.attrs._id }, { $set: { status: 'disabled' } });

		return true;
	}

	public async trigger(jobName: string): Promise<boolean> {
		if (!this.scheduler) {
			return false;
		}
		const jobs = await this.scheduler.jobs({ name: jobName });
		if (!jobs.length) {
			return false;
		}

		const job = jobs[0];
		if (job.attrs.disabled) {
			return false;
		}

		job.schedule(new Date());
		await job.save();

		return true;
	}

	private async reserve(config: ReservedJob): Promise<void> {
		this.reservedJobs = [...this.reservedJobs, config];
	}

	private async unreserve(jobName: string): Promise<void> {
		this.reservedJobs = this.reservedJobs.filter(({ name }) => name !== jobName);
	}

	private async define(jobName: string, callback: () => unknown | Promise<unknown>): Promise<void> {
		if (!this.scheduler) {
			throw new Error('Scheduler is not running.');
		}

		this.scheduler.define(jobName, async () => {
			await runCronJobFunctionAndPersistResult(async () => callback(), jobName);
		});
	}
}

export const cronJobs = new AgendaCronJobs();
