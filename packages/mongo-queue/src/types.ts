import type { ObjectId } from 'mongodb';

export type Work<T> = {
	_id?: ObjectId;
	dateCreated: Date;
	type: string;
	message: T;
	priority?: number;
	receivedTime?: Date;
	releasedReason?: string;
	retryCount?: number;
	nextReceivableTime?: Date;
	rejectionReason?: string;
	releaseHistory?: Record<
		string,
		{
			retryCount: number;
			receivedTime: Date;
			releasedTime: Date;
			releasedReason: string;
		}
	>[];
};

export type ValidResult = 'Completed' | 'Rejected' | 'Retry';

export type Actions = 'work' | 'workComplete';

export type WorkerPromise<T> = (queueItem: Work<T>) => Promise<ValidResult>;
