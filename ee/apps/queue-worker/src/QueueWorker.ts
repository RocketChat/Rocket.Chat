import type { Db } from 'mongodb';
import type { ValidResult, Work } from 'mongo-message-queue';
import MessageQueue from 'mongo-message-queue';

import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IQueueWorkerService } from '../../../../apps/meteor/server/sdk/types/IQueueWorkerService';
import type { Logger } from '../../../../apps/meteor/server/lib/logger/Logger';

export class QueueWorker extends ServiceClass implements IQueueWorkerService {
	protected name = 'queue-worker';

	protected retryCount = 5;

	protected queue: MessageQueue;

	private logger: Logger;

	constructor(private readonly db: Db, loggerClass: typeof Logger) {
		super();

		// eslint-disable-next-line new-cap
		this.logger = new loggerClass('QueueWorker');
		this.queue = new MessageQueue();
	}

	isServiceNotFoundMessage(message: string): boolean {
		return message.includes('is not found');
	}

	async created(): Promise<void> {
		this.logger.info('Starting queue worker');
		this.queue.databasePromise = () => {
			return Promise.resolve(this.db);
		};

		try {
			await this.registerWorkers();
		} catch (e) {
			this.logger.fatal(e, 'Fatal error occurred when registering workers');
			process.exit(1);
		}
	}

	async stopped(): Promise<void> {
		this.logger.info('Stopping queue worker');
		this.queue.stopPolling();
	}

	// Registers the actual workers, the actions lib will try to fetch elements to work on
	private async registerWorkers(): Promise<void> {
		this.logger.info('Registering workers of type "work"');
		this.queue.registerWorker('work', (queueItem: Work<{ to: string; foo: string }>): Promise<ValidResult> => {
			this.logger.info(`Processing queue item ${queueItem._id}`);
			this.logger.info(`Queue item is trying to call ${queueItem.message.to}`);
			return this.api
				.waitAndCall(queueItem.message.to, queueItem.message)
				.then(() => {
					this.logger.info(`Queue item ${queueItem._id} completed`);
					return 'Completed' as const;
				})
				.catch((err) => {
					this.logger.error(`Queue item ${queueItem._id} errored: ${err.message}`);
					queueItem.releasedReason = err.message;
					// Let's only retry for X times when the error is "service not found"
					// For any other error, we'll just reject the item
					if ((queueItem.retryCount ?? 0) < this.retryCount && this.isServiceNotFoundMessage(err.message)) {
						// Let's retry in 5 seconds
						this.logger.info(`Queue item ${queueItem._id} will be retried in 5 seconds`);
						queueItem.nextReceivableTime = new Date(Date.now() + 5000);
						return 'Retry' as const;
					}

					this.logger.info(`Queue item ${queueItem._id} will be rejected`);
					queueItem.rejectionReason = err.message;
					return 'Rejected' as const;
				});
		});
	}

	// Queues an action of type "work" to be processed by the workers
	// Action receives a record of unknown data that will be passed to the actual service
	// `to` is a service name that will be called, including namespace + action
	async queueWork<T extends Record<string, unknown>>(to: string, data: T): Promise<void> {
		this.logger.info(`Queueing work for ${to}`);
		await this.queue.enqueue<typeof data>('work', { to, ...data });
	}
}
