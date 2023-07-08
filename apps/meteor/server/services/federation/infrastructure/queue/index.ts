import type { IPersistentQueue } from '@rocket.chat/queue-wrapper';
import { QueueWrapper } from '@rocket.chat/queue-wrapper';

/**
 * Queue interactor for Fedartion purposes
 * defined by its `workType` and by the usage of only 1 worker
 */
export class Queue extends QueueWrapper implements IPersistentQueue {
	private workType: string;

	constructor(workType: string) {
		super(1);
		this.workType = workType;
	}

	public async addToQueue(task: Record<string, any>): Promise<void> {
		await super.queueWork(this.workType, task);
	}

	public async startWorkersWith(processingMethod: (event: any) => Promise<void>): Promise<void> {
		await super.registerWorkers(this.workType, processingMethod);
	}
}
