import type { Db } from 'mongodb';
import { QueueWrapper } from '@rocket.chat/queue-wrapper';

export class PersistentQueue {
	private queueAdapter: QueueWrapper;

	private workType = 'matrix_event';

	constructor(db: Db) {
		this.queueAdapter = new QueueWrapper(db, 'federation', 1);
	}

	public addToQueue(task: Record<string, any>): void {
		this.queueAdapter.queueWork(this.workType, task).catch(console.error);
	}

	public async startWorkersWith(processingMethod: (event: any) => Promise<void>): Promise<void> {
		await this.queueAdapter.registerWorkers(this.workType, processingMethod);
	}
}
