import { RocketChatQueueAdapter } from './RocketChatQueueAdapter';
import { isEnterprise } from '../../../../../ee/app/license/server';

export class PersistentQueue {
	private queueAdapter: RocketChatQueueAdapter;

	constructor() {
		this.queueAdapter = new RocketChatQueueAdapter();
	}

	public addToQueue(task: Record<string, any>): void {
		this.queueAdapter.enqueueJob(`federation${isEnterprise() ? '-enterprise' : ''}.handleMatrixEvent`, task).catch(console.error);
	}
}
