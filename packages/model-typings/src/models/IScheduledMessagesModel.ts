import type { IScheduledMessage } from '@rocket.chat/core-typings';
import type { FindOptions, UpdateFilter, DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IScheduledMessagesModel extends IBaseModel<IScheduledMessage> {
  findByScheduledAtBefore(date: Date, options?: FindOptions<IScheduledMessage>): Promise<IScheduledMessage[]>;
	insertAsync(message: Omit<IScheduledMessage, '_id'>): Promise<string>;
	findOneAsync(query: { _id: string }): Promise<IScheduledMessage | null>;
	updateAsync(query: { _id: string }, update: UpdateFilter<IScheduledMessage>): Promise<void>;
	removeAsync(query: { _id: string }): Promise<DeleteResult>;
}
