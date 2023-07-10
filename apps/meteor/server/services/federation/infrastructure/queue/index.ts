import type { IPersistentQueue } from '@rocket.chat/queue-wrapper';
import { QueueWrapper } from '@rocket.chat/queue-wrapper';

/**
 * Queue interactor for Fedartion
 * defines a `workType` and by default uses only 1 worker
 */
export class Queue {
	private workType: string;

	private queue: IPersistentQueue;

	constructor(workType: string, maxWorkers = 1) {
		this.queue = new QueueWrapper(maxWorkers);
		this.workType = workType;
	}

	public async addToQueue(task: Record<string, any>): Promise<void> {
		await this.queue.queueWork(this.workType, task);
	}

	public async startWorkersWith(processingMethod: (event: any) => Promise<void>): Promise<void> {
		await this.queue.registerWorkers(this.workType, processingMethod);
	}
}
