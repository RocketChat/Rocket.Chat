import { QueueWorker as queueService } from '@rocket.chat/core-services';

export class RocketChatQueueAdapterEE {
	public async enqueueJob(serviceMethodHandler: string, data: Record<string, any>): Promise<void> {
		await queueService.queueWork<Record<string, any>>('work', serviceMethodHandler, data);
	}
}
