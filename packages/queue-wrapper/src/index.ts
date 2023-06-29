import type { Db } from 'mongodb';
import type { ValidResult, Work } from 'mongo-message-queue';
import MessageQueue from 'mongo-message-queue';

import { Logger } from './logger';

export type HealthAggResult = {
	total: number;
	type: string;
	status: 'Rejected' | 'In progress';
};

export interface IQueueWrapper {
	queueWork<T extends Record<string, unknown>>(workType: string, data: T): Promise<void>;
	queueInfo(): Promise<HealthAggResult[]>;
}

export class QueueWrapper implements IQueueWrapper {
	protected queue: MessageQueue;

	protected retryCount = 5;

	// Default delay is 5 seconds
	protected retryDelay = 5000;

	private queueCollection = '_queue';

	private logger: typeof Logger;

	constructor(private readonly db: Db, collectionName: string, maxWorkers = 5) {
		this.logger = Logger;
		this.queue = new MessageQueue();
		this.queue.collectionName = collectionName ? `${this.queueCollection}_${collectionName}` : this.queueCollection;
		this.queue.maxWorkers = maxWorkers;
		this.queue.databasePromise = async () => this.db;
	}

	// Registers Workers with the processingMethod for a given type of Work
	public async registerWorkers(workType: string, processingMethod: (params: any) => Promise<void>): Promise<void> {
		this.logger.info(`Registering workers for "${workType}"`);

		this.queue.registerWorker(workType, async (queueItem: Work<{ data: any }>): Promise<ValidResult> => {
			this.logger.info(`Processing queue item ${queueItem._id} for work`);

			try {
				await processingMethod(queueItem.message);
				this.logger.info(`Queue item ${queueItem._id} completed`);

				return 'Completed' as const;
			} catch (err: unknown) {
				const e = err as Error;
				this.logger.error(`Queue item ${queueItem._id} errored: ${e.message}`);
				queueItem.releasedReason = e.message;

				// Let's only retry for `this.retryCount` times
				if ((queueItem.retryCount || 0) < this.retryCount) {
					this.logger.info(`Queue item ${queueItem._id} will be retried in 10 seconds`);
					queueItem.nextReceivableTime = new Date(Date.now() + this.retryDelay);

					return 'Retry' as const;
				}

				this.logger.info(`Queue item ${queueItem._id} will be rejected`);

				return 'Rejected' as const;
			}
		});
	}

	// Library doesnt create indexes by itself, for some reason
	// This should create the indexes we need and improve queue perf on reading
	async createIndexes(): Promise<void> {
		this.logger.info(`Creating indexes for ${this.queue.collectionName}`);

		await this.db.collection(this.queue.collectionName).createIndex({ type: 1 });
		await this.db.collection(this.queue.collectionName).createIndex({ rejectedTime: 1 }, { sparse: true });
		await this.db.collection(this.queue.collectionName).createIndex({ nextReceivableTime: 1 }, { sparse: true });
		await this.db.collection(this.queue.collectionName).createIndex({ receivedTime: 1 }, { sparse: true });
	}

	// Queues a work of type "X" to be processed by the Workers
	async queueWork<T extends Record<string, unknown>>(workType: string, data: T): Promise<void> {
		this.logger.info(`Queueing work for ${workType}`);

		await this.queue.enqueue<typeof data>(workType, { ...data });
	}

	async queueInfo(): Promise<HealthAggResult[]> {
		return this.db
			.collection(this.queue.collectionName)
			.aggregate<HealthAggResult>([
				{
					$addFields: {
						status: { $cond: [{ $ifNull: ['$rejectionReason', false] }, 'Rejected', 'In progress'] },
					},
				},
				{ $group: { _id: { type: '$type', status: '$status' }, elements: { $push: '$$ROOT' }, total: { $sum: 1 } } },
				// Project from each group the type, status and total of elements
				{ $project: { _id: 0, type: '$_id.type', status: '$_id.status', total: 1 } },
			])
			.toArray();
	}
}
