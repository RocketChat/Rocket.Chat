import type { IRoom, IScheduledMessage, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IScheduledMessagesModel } from '@rocket.chat/model-typings';
import type { Collection, DeleteResult, Db, FindCursor, FindOptions, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ScheduledMessagesRaw extends BaseRaw<IScheduledMessage> implements IScheduledMessagesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IScheduledMessage>>) {
		super(db, 'scheduled_message', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			// the dispatcher's hot path: oldest due message still waiting to be delivered
			{ key: { status: 1, scheduledAt: 1 } },
			// listing a user's pending messages, optionally scoped to a room
			{ key: { uid: 1, rid: 1, scheduledAt: 1 } },
		];
	}

	public findPendingByUserId(
		uid: IUser['_id'],
		{ rid, ...options }: FindOptions<IScheduledMessage> & { rid?: IRoom['_id'] } = {},
	): FindCursor<IScheduledMessage> {
		return this.find(
			{
				uid,
				status: 'scheduled',
				...(rid && { rid }),
			},
			{
				sort: { scheduledAt: 1 },
				...options,
			},
		);
	}

	public async countPendingByUserId(uid: IUser['_id'], rid?: IRoom['_id']): Promise<number> {
		return this.countDocuments({
			uid,
			status: 'scheduled',
			...(rid && { rid }),
		});
	}

	public async findOneByIdAndUserId(id: IScheduledMessage['_id'], uid: IUser['_id']): Promise<IScheduledMessage | null> {
		return this.findOne({ _id: id, uid });
	}

	public async claimNextDue(now: Date): Promise<IScheduledMessage | null> {
		const result = await this.col.findOneAndUpdate(
			{
				status: 'scheduled',
				scheduledAt: { $lte: now },
			},
			{
				$set: {
					status: 'sending',
					updatedAt: new Date(),
				},
			},
			{
				sort: { scheduledAt: 1 },
				returnDocument: 'after',
			},
		);

		return result;
	}

	public async setAsSent(id: IScheduledMessage['_id'], messageId: string): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: id },
			{
				$set: {
					status: 'sent',
					messageId,
					updatedAt: new Date(),
				},
				$unset: { error: 1 },
			},
		);
	}

	public async setAsFailed(id: IScheduledMessage['_id'], error: string): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: id },
			{
				$set: {
					status: 'failed',
					error,
					updatedAt: new Date(),
				},
			},
		);
	}

	public async updatePendingById(
		id: IScheduledMessage['_id'],
		uid: IUser['_id'],
		{ msg, scheduledAt }: { msg?: string; scheduledAt?: Date },
	): Promise<IScheduledMessage | null> {
		const result = await this.col.findOneAndUpdate(
			{ _id: id, uid, status: 'scheduled' },
			{
				$set: {
					...(msg !== undefined && { msg }),
					...(scheduledAt !== undefined && { scheduledAt }),
					updatedAt: new Date(),
				},
			},
			{ returnDocument: 'after' },
		);

		return result;
	}

	public async deletePendingByIdAndUserId(id: IScheduledMessage['_id'], uid: IUser['_id']): Promise<DeleteResult> {
		return this.deleteOne({ _id: id, uid, status: 'scheduled' });
	}

	public async requeueStale(before: Date): Promise<void> {
		await this.updateMany(
			{
				status: 'sending',
				updatedAt: { $lte: before },
			},
			{
				$set: {
					status: 'scheduled',
					updatedAt: new Date(),
				},
			},
		);
	}
}
