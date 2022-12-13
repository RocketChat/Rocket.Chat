import type { Db } from 'mongodb';
import type { ValidResult } from 'mongo-message-queue';
import MessageQueue from 'mongo-message-queue';

import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IQueueWorkerService } from '../../../../apps/meteor/server/sdk/types/IQueueWorkerService';

type Work<T> = {
	_id: string;
	dateCreated: Date;
	type: string;
	message: T;
	priority: number;
	receivedTime: Date;
	releasedReason?: string;
	retryCount?: number;
	nextReceivableTime?: Date;
	rejectionReason?: string;
};

export class QueueWorker extends ServiceClass implements IQueueWorkerService {
	protected name = 'queue-worker';

	protected queue: MessageQueue;

	constructor(private readonly db: Db) {
		super();
		this.queue = new MessageQueue();
		this.queue.databasePromise = () => {
			return Promise.resolve(this.db);
		};

		this.registerWorkers();

		this.onEvent('shutdown', () => this.queue.stopPolling());
	}

	getConfig(): unknown {
		return null;
	}

	// Registers the actual workers, the actions lib will try to fetch elements to work on
	private async registerWorkers(): Promise<void> {
		this.queue.registerWorker('work', (queueItem: Work<{ to: string; foo: string }>): Promise<ValidResult> => {
			return this.api
				.waitAndCall(queueItem.message.to, queueItem.message)
				.then(() => 'Completed' as const)
				.catch((err) => {
					queueItem.rejectionReason = err.message;
					return 'Rejected' as const;
				});
		});
	}

	// Queues an action of type "work" to be processed by the workers
	// Action receives a record of unknown data that will be passed to the actual service
	// `to` is a service name that will be called, including namespace + action
	async queueWork<T extends Record<string, unknown>>(to: string, data: T): Promise<void> {
		await this.queue.enqueue<typeof data>('work', { to, ...data });
	}
}
