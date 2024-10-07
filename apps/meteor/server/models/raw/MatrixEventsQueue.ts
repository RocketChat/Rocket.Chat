import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMatrixEventsQueueModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MatrixEventsQueueRaw extends BaseRaw<any> implements IMatrixEventsQueueModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<any>>) {
		super(db, 'matrix_event_queue', trash);
	}

	// public async enqueue(event: any): Promise<void>;
	public async enqueue(events: any[]): Promise<void> {
		const eventDocs = (Array.isArray(events) ? events : [events]).map((event: any) => ({ _id: event.id, data: event }));

		await this.insertMany(eventDocs);
	}

	public dequeue(event: any): Promise<DeleteResult> {
		return this.deleteOne({ _id: event.id });
	}

	public async findPending(): Promise<any> {
		return this.find().map((doc) => doc.data);
	}
}
