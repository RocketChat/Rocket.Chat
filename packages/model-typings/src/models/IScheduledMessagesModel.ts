import type { IRoom, IScheduledMessage, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IScheduledMessagesModel extends IBaseModel<IScheduledMessage> {
	findPendingByUserId(uid: IUser['_id'], options?: FindOptions<IScheduledMessage> & { rid?: IRoom['_id'] }): FindCursor<IScheduledMessage>;
	countPendingByUserId(uid: IUser['_id'], rid?: IRoom['_id']): Promise<number>;
	/** Quota slots the user currently holds, whether waiting to be delivered or already being delivered. */
	findOccupiedSlotsByUserId(uid: IUser['_id']): Promise<number[]>;
	/**
	 * Inserts a message into the slot it carries, returning `false` when another request took that slot
	 * first. The caller is expected to look for another free slot and try again.
	 */
	insertPending(record: IScheduledMessage): Promise<boolean>;
	findOneByIdAndUserId(id: IScheduledMessage['_id'], uid: IUser['_id']): Promise<IScheduledMessage | null>;
	/**
	 * Atomically claims one message whose delivery time has come, flipping it to `sending` and stamping
	 * it with `claimId` so that concurrent instances never pick up the same document.
	 */
	claimNextDue(now: Date, claimId: string): Promise<IScheduledMessage | null>;
	/** Resolves `false` when the claim was already taken over by another instance and the write was skipped. */
	setAsSent(id: IScheduledMessage['_id'], claimId: string, messageId: string): Promise<boolean>;
	/** Resolves `false` when the claim was already taken over by another instance and the write was skipped. */
	setAsFailed(id: IScheduledMessage['_id'], claimId: string, error: string): Promise<boolean>;
	updatePendingById(
		id: IScheduledMessage['_id'],
		uid: IUser['_id'],
		data: { msg?: string; scheduledAt?: Date },
	): Promise<IScheduledMessage | null>;
	deletePendingByIdAndUserId(id: IScheduledMessage['_id'], uid: IUser['_id']): Promise<DeleteResult>;
	/** Requeues messages left in `sending` by an instance that died mid-delivery. */
	requeueStale(before: Date): Promise<void>;
}
