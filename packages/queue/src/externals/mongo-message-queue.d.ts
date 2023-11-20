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

	export default class MessageQueue {
		collectionName: string;

		maxWorkers: number;

		databasePromise: () => Promise<Db>;

		registerWorker<T>(type: string, worker: (queueItem: Work<T>) => Promise<ValidResult>): void;

		enqueue<T>(type: string, message: T, options?: { nextReceivableTime: Date; priority: number }): Promise<void>;

		enqueueAndProcess<T>(type: string, message: T, options?: { nextReceivableTime: Date; priority: number }): Promise<void>;

		stopPolling(): void;
	}
}
