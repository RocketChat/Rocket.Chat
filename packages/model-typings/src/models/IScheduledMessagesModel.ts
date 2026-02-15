import type { IScheduledMessage, IUser, RoomID, ScheduledMessageStatus } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, UpdateResult, DeleteResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IScheduledMessagesModel extends IBaseModel<IScheduledMessage> {
	findReadyToSend(now: Date, options?: FindOptions<IScheduledMessage>): FindCursor<IScheduledMessage>;

	findByRoomId(rid: RoomID, options?: FindOptions<IScheduledMessage>): FindPaginated<FindCursor<IScheduledMessage>>;

	findByUserId(userId: IUser['_id'], options?: FindOptions<IScheduledMessage>): FindPaginated<FindCursor<IScheduledMessage>>;

	findByRoomIdAndUserId(
		rid: RoomID,
		userId: IUser['_id'],
		options?: FindOptions<IScheduledMessage>,
	): FindPaginated<FindCursor<IScheduledMessage>>;

	findByStatus(status: ScheduledMessageStatus, options?: FindOptions<IScheduledMessage>): FindCursor<IScheduledMessage>;

	updateStatus(
		messageId: IScheduledMessage['_id'],
		status: ScheduledMessageStatus,
		sentAt?: Date,
		failureReason?: string,
	): Promise<UpdateResult>;

	updateScheduledAt(messageId: IScheduledMessage['_id'], scheduledAt: Date): Promise<UpdateResult>;

	cancelMessage(messageId: IScheduledMessage['_id'], userId: IUser['_id']): Promise<UpdateResult>;

	deleteOldMessages(olderThan: Date): Promise<DeleteResult>;

	countPendingByUserId(userId: IUser['_id']): Promise<number>;

	countPendingByRoomId(rid: RoomID): Promise<number>;
}
