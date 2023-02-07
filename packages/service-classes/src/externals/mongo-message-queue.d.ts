declare module 'mongo-message-queue' {
	import type { Db } from 'mongodb';

	export type Work<T> = {
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

	export type ValidResult = 'Completed' | 'Rejected' | 'Retry';

	export type Actions = 'work' | 'workComplete';

	export default class MessageQueue {
		collectionName: string;

		databasePromise: () => Promise<Db>;

		registerWorker<T>(type: Actions, worker: (queueItem: Work<T>) => Promise<ValidResult>): void;

		enqueue<T>(type: Actions, message: T, options?: { nextReceivableTime: Date; priority: number }): Promise<void>;

		enqueueAndProcess<T>(type: Actions, message: T, options?: { nextReceivableTime: Date; priority: number }): Promise<void>;

		stopPolling(): void;
	}
}
