import type { Db } from 'mongodb';
import type { ValidResult, Work } from 'mongo-message-queue';
import MessageQueue from 'mongo-message-queue';
import type { IQueueWorkerService, HealthAggResult } from '@rocket.chat/core-services';

import { Logger } from './logger';

export class QueueWrapper implements IQueueWorkerService {
	protected queue: MessageQueue;

	protected retryCount = 5;

	// Default delay is 5 seconds
	protected retryDelay = 5000;

	private processingMethod: any;

	private queueCollection = '_queue';

	private logger: typeof Logger;

	constructor(private readonly db: Db, collectionName: string, maxWorkers = 5) {
		this.logger = Logger;
		this.queue = new MessageQueue();
		this.queue.collectionName = `${this.queueCollection}_${collectionName}`;
		this.queue.maxWorkers = maxWorkers;
		this.queue.databasePromise = () => {
			return Promise.resolve(this.db);
		};
	}

	isServiceNotFoundMessage(message: string): boolean {
		return message.includes('is not found');
	}

	isServiceRetryError(message: string): boolean {
		return message.includes('retry');
	}

	private isRetryableError(error: string): boolean {
		// Let's retry on 2 circumstances: (for now)
		// 1. When the error is "service not found" -> this means the service is not yet registered
		// 2. When the error is "retry" -> this means the service is registered, but is not willing to process it right now, maybe due to load
		return this.isServiceNotFoundMessage(error) || this.isServiceRetryError(error);
	}

	private async workerCallback(queueItem: Work<{ data: any }>): Promise<ValidResult> {
		this.logger.info(`Processing queue item ${queueItem._id} for work`);
		try {
			await this.processingMethod(queueItem.message);
			this.logger.info(`Queue item ${queueItem._id} completed`);
			return 'Completed' as const;
		} catch (err: unknown) {
			const e = err as Error;
			this.logger.error(`Queue item ${queueItem._id} errored: ${e.message}`);
			queueItem.releasedReason = e.message;

			// Let's only retry for X times when the error is "service not found"
			// For any other error, we'll just reject the item
			if ((queueItem.retryCount || 0) < this.retryCount && this.isRetryableError(e.message)) {
				this.logger.info(`Queue item ${queueItem._id} will be retried in 10 seconds`);
				queueItem.nextReceivableTime = new Date(Date.now() + this.retryDelay);

				return 'Retry' as const;
			}

			this.logger.info(`Queue item ${queueItem._id} will be rejected`);
			return 'Rejected' as const;
		}
	}

	// Registers the actual workers, the actions lib will try to fetch elements to work on
	public async registerWorkers(messageType: string, processingMethod: (params: any) => Promise<void>): Promise<void> {
		this.logger.info(`Registering workers for "${messageType}"`);
		this.processingMethod = processingMethod;
		this.queue.registerWorker(messageType, this.workerCallback.bind(this));
	}

	async createIndexes(): Promise<void> {
		this.logger.info('Creating indexes for queue worker');

		// Library doesnt create indexes by itself, for some reason
		// This should create the indexes we need and improve queue perf on reading
		await this.db.collection(this.queue.collectionName).createIndex({ type: 1 });
		await this.db.collection(this.queue.collectionName).createIndex({ rejectedTime: 1 }, { sparse: true });
		await this.db.collection(this.queue.collectionName).createIndex({ nextReceivableTime: 1 }, { sparse: true });
		await this.db.collection(this.queue.collectionName).createIndex({ receivedTime: 1 }, { sparse: true });
	}

	// Queues an action of type "X" to be processed by the workers
	// Action receives a record of unknown data that will be passed to the actual service
	// `to` is a service name that will be called, including namespace + action
	// This is a "generic" job that allows you to call any service
	async queueWork<T extends Record<string, unknown>>(queue: string, to: string, data: T): Promise<void> {
		this.logger.info(`Queueing work for ${to}`);

		await this.queue.enqueue<typeof data>(queue, { ...data, to });
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
