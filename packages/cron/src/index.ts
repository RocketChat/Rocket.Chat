import { Agenda } from '@rocket.chat/agenda';
import { CronHistory } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { Db } from 'mongodb';

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
	}

	public async addAtTimestamp(name: string, when: Date, callback: () => any | Promise<any>): Promise<void> {
		if (!this.scheduler) {
			return this.reserve({ name, when, callback, timestamped: true });
		}

		await this.define(name, callback);
		await this.scheduler.schedule(when, name, {});
	}

	public async remove(name: string): Promise<void> {
		if (!this.scheduler) {
			return this.unreserve(name);
		}

		await this.scheduler.cancel({ name });
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
