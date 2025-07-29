import type { IScheduledMessage } from '@rocket.chat/core-typings';
import type { IScheduledMessagesModel } from '@rocket.chat/model-typings';
import type { FindOptions, UpdateFilter, DeleteResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ScheduledMessagesRaw extends BaseRaw<IScheduledMessage> implements IScheduledMessagesModel {
	constructor(db: any, trash?: any) {
		super(db, 'scheduled_messages', trash);
	}

	async findByScheduledAtBefore(date: Date, options: FindOptions<IScheduledMessage> = {}): Promise<IScheduledMessage[]> {
		return this.find({ t: 'scheduled_message', scheduledAt: { $lte: date } }, options).toArray();
	}

	async insertAsync(message: Omit<IScheduledMessage, '_id'>): Promise<string> {
		return this.insertOne(message).then((result) => result.insertedId);
	}

	async findOneAsync(query: { _id: string }): Promise<IScheduledMessage | null> {
		return this.findOne(query);
	}

	async updateAsync(query: { _id: string }, update: UpdateFilter<IScheduledMessage>): Promise<void> {
		await this.updateOne(query, update);
	}

	async removeAsync(query: { _id: string }): Promise<DeleteResult> {
		return this.deleteOne(query);
	}
}
