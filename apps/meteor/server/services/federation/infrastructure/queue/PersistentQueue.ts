import type { Db } from 'mongodb';
import { QueueWrapper } from '@rocket.chat/queue-wrapper';

export class PersistentQueue {
	private queueAdapter: QueueWrapper;

	private messageType = '_queue_federation';

	constructor(db: Db) {
		this.queueAdapter = new QueueWrapper(db, 'federation');
	}

	public addToQueue(task: Record<string, any>): void {
		this.queueAdapter.queueWork(this.messageType, 'matrix_event', task).catch(console.error);
	}

	public async startWorkersWith(processingMethod: (event: any) => Promise<void>): Promise<void> {
		await this.queueAdapter.registerWorkers(this.messageType, processingMethod);
	}
}
