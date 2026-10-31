import type { IScheduledMessage, ScheduledMessageEditableFields } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IScheduledMessagesModel extends IBaseModel<IScheduledMessage> {
	findNextDueDate(): Promise<Date | undefined>;
	claimNextDue(now: Date): Promise<IScheduledMessage | null>;
	claimByIdAndUserId(_id: IScheduledMessage['_id'], uid: string, now: Date): Promise<IScheduledMessage | null>;
	setFailedById(_id: IScheduledMessage['_id'], error: string): Promise<UpdateResult>;
	findPaginatedByUserId(
		uid: string,
		rid: string | undefined,
		options: FindOptions<IScheduledMessage>,
	): FindPaginated<FindCursor<IScheduledMessage>>;
	findStaleSending(claimedBefore: Date): FindCursor<IScheduledMessage>;
	findByRoomId(rid: string): FindCursor<IScheduledMessage>;
	findByUserId(uid: string): FindCursor<IScheduledMessage>;
	findAll(): FindCursor<IScheduledMessage>;
	countByUserId(uid: string): Promise<number>;
	findOneByIdAndUserId(_id: IScheduledMessage['_id'], uid: string): Promise<IScheduledMessage | null>;
	updateEditableByIdAndUserId(
		_id: IScheduledMessage['_id'],
		uid: string,
		set: ScheduledMessageEditableFields,
	): Promise<IScheduledMessage | null>;
	deleteEditableByIdAndUserId(_id: IScheduledMessage['_id'], uid: string): Promise<DeleteResult>;
	deleteByRoomId(rid: string): Promise<DeleteResult>;
	deleteByUserId(uid: string): Promise<DeleteResult>;
}
