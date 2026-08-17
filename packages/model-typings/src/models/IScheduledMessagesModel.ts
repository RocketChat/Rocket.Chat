import type { IRoom, IScheduledMessage, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IScheduledMessagesModel extends IBaseModel<IScheduledMessage> {
	findPendingByUserId(uid: IUser['_id'], options?: FindOptions<IScheduledMessage> & { rid?: IRoom['_id'] }): FindCursor<IScheduledMessage>;
	countPendingByUserId(uid: IUser['_id'], rid?: IRoom['_id']): Promise<number>;
	findOneByIdAndUserId(id: IScheduledMessage['_id'], uid: IUser['_id']): Promise<IScheduledMessage | null>;
	/**
	 * Atomically claims one message whose delivery time has come, flipping it to `sending` so that
	 * concurrent instances never pick up the same document.
	 */
	claimNextDue(now: Date): Promise<IScheduledMessage | null>;
	setAsSent(id: IScheduledMessage['_id'], messageId: string): Promise<UpdateResult>;
	setAsFailed(id: IScheduledMessage['_id'], error: string): Promise<UpdateResult>;
	updatePendingById(
		id: IScheduledMessage['_id'],
		uid: IUser['_id'],
		data: { msg?: string; scheduledAt?: Date },
	): Promise<IScheduledMessage | null>;
	deletePendingByIdAndUserId(id: IScheduledMessage['_id'], uid: IUser['_id']): Promise<DeleteResult>;
	/** Requeues messages left in `sending` by an instance that died mid-delivery. */
	requeueStale(before: Date): Promise<void>;
}
