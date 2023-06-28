// import { RocketChatQueueAdapter } from './RocketChatQueueAdapter';
import type { Db } from 'mongodb';
import { QueueWrapper } from '@rocket.chat/queue-wrapper';

import { Logger } from '../../../../lib/logger/Logger';

export class PersistentQueue {
	private queueAdapter: QueueWrapper;

	private logger: Logger;

	private messageType = '_queue_federation';

	constructor(db: Db) {
		this.queueAdapter = new QueueWrapper(db, 'federation');
		this.logger = new Logger('Federation Queue');
	}

	public addToQueue(task: Record<string, any>): void {
		this.queueAdapter.queueWork(this.messageType, 'matrix_event', task).catch(console.error);
	}

	public async startWorkersWith(processingMethod: (event: any) => Promise<void>): Promise<void> {
		console.log('######## DEBUG #############');
		await this.queueAdapter.registerWorkers(this.messageType, processingMethod);
	}
}
