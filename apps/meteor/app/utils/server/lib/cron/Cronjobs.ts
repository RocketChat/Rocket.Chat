import { Agenda } from '@rocket.chat/agenda';
import { MongoInternals } from 'meteor/mongo';
import { CronHistory } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { IDefaultCronJobs } from '@rocket.chat/core-typings';

export const runCronJobFunctionAndPersistResult = async (
	fn: (data?: Record<string, any>) => Promise<any>,
	jobName: string,
	data?: Record<string, any>,
): Promise<void> => {
	const { insertedId } = await CronHistory.insertOne({
		_id: Random.id(),
		intendedAt: new Date(),
		name: jobName,
		startedAt: new Date(),
	});
	try {
		const result = await fn(data || {});
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

export abstract class AbstractDefaultAgendaCronJobs implements IDefaultCronJobs {
	protected scheduler = new Agenda({
		mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
		defaultConcurrency: 1,
	});

	public async add<T extends Record<string, any>>(
		name: string,
		schedule: string,
		callback: (data: T) => any | Promise<any>,
		params?: T,
	): Promise<void> {
		await this.scheduler.start();
		this.scheduler.define(name, async ({ attrs: { data } }) => {
			await runCronJobFunctionAndPersistResult(async () => callback(data as T), name);
		});
		await this.scheduler.every(schedule, name, params || {}, {});
	}

	public async remove(name: string): Promise<void> {
		await this.scheduler.cancel({ name });
	}

	public async has(name: string): Promise<boolean> {
		return this.scheduler.has({ name });
	}
}

class DefaultAgendaCronJobs extends AbstractDefaultAgendaCronJobs {}

export const defaultCronJobs: IDefaultCronJobs = new DefaultAgendaCronJobs();
