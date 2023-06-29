import type { Db } from 'mongodb';
import { QueueWrapper } from '@rocket.chat/queue-wrapper';

export class PersistentQueue {
	private queueWrapper: QueueWrapper;

	private workType: string;

	constructor(db: Db, workType: string) {
		this.workType = workType;
		this.queueWrapper = new QueueWrapper(db, 'federation', 1);
	}

	public addToQueue(task: Record<string, any>): void {
		this.queueWrapper.queueWork(this.workType, task).catch(console.error);
	}

	public async startWorkersWith(processingMethod: (event: any) => Promise<void>): Promise<void> {
		await this.queueWrapper.registerWorkers(this.workType, processingMethod);
	}
}
