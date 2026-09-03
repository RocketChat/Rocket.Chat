import type { IRoom, IScheduledMessage, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IScheduledMessagesModel } from '@rocket.chat/model-typings';
import type { Collection, DeleteResult, Db, FindCursor, FindOptions, IndexDescription, MongoServerError } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const DUPLICATE_KEY_ERROR = 11000;

/** Statuses in which a message still holds on to its quota slot. */
const OCCUPYING_SLOT = ['scheduled', 'sending'] as const;

const isDuplicateKeyError = (error: unknown): boolean => (error as MongoServerError)?.code === DUPLICATE_KEY_ERROR;

export class ScheduledMessagesRaw extends BaseRaw<IScheduledMessage> implements IScheduledMessagesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IScheduledMessage>>) {
		super(db, 'scheduled_message', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			// the dispatcher's hot path: oldest due message still waiting to be delivered
			{ key: { status: 1, scheduledAt: 1 } },
			// listing a user's pending messages across every room, in delivery order
			{ key: { uid: 1, status: 1, scheduledAt: 1 } },
			// same listing scoped to one room; `rid` sits before `scheduledAt` so the sort stays indexed
			{ key: { uid: 1, rid: 1, status: 1, scheduledAt: 1 } },
			// sweeping claims left behind by an instance that died mid-delivery
			{ key: { status: 1, claimedAt: 1 } },
			// enforces Message_MaxScheduledMessagesPerUser in the database: concurrent requests competing
			// for the last slot cannot both win, because only one of them can hold a given uid+slot pair
			{ key: { uid: 1, slot: 1 }, unique: true, partialFilterExpression: { status: { $in: OCCUPYING_SLOT } } },
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

	public async findOccupiedSlotsByUserId(uid: IUser['_id']): Promise<number[]> {
		const occupying = await this.find({ uid, status: { $in: OCCUPYING_SLOT } }, { projection: { slot: 1 } }).toArray();

		return occupying.map(({ slot }) => slot);
	}

	public async insertPending(record: IScheduledMessage): Promise<boolean> {
		try {
			await this.insertOne(record);
			return true;
		} catch (error) {
			if (isDuplicateKeyError(error)) {
				return false;
			}

			throw error;
		}
	}

	public async findOneByIdAndUserId(id: IScheduledMessage['_id'], uid: IUser['_id']): Promise<IScheduledMessage | null> {
		return this.findOne({ _id: id, uid });
	}

	public async claimNextDue(now: Date, claimId: string): Promise<IScheduledMessage | null> {
		const claimedAt = new Date();

		const result = await this.col.findOneAndUpdate(
			{
				status: 'scheduled',
				scheduledAt: { $lte: now },
			},
			{
				$set: {
					status: 'sending',
					claimId,
					claimedAt,
					updatedAt: claimedAt,
				},
			},
			{
				sort: { scheduledAt: 1 },
				returnDocument: 'after',
			},
		);

		return result;
	}

	public async setAsSent(id: IScheduledMessage['_id'], claimId: string, messageId: string): Promise<boolean> {
		const { modifiedCount } = await this.updateOne(
			{ _id: id, claimId },
			{
				$set: {
					status: 'sent',
					messageId,
					updatedAt: new Date(),
				},
				$unset: { error: 1, claimId: 1, claimedAt: 1 },
			},
		);

		return modifiedCount === 1;
	}

	public async setAsFailed(id: IScheduledMessage['_id'], claimId: string, error: string): Promise<boolean> {
		const { modifiedCount } = await this.updateOne(
			{ _id: id, claimId },
			{
				$set: {
					status: 'failed',
					error,
					updatedAt: new Date(),
				},
				$unset: { claimId: 1, claimedAt: 1 },
			},
		);

		return modifiedCount === 1;
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
				claimedAt: { $lte: before },
			},
			{
				$set: {
					status: 'scheduled',
					updatedAt: new Date(),
				},
				$unset: { claimId: 1, claimedAt: 1 },
			},
		);
	}
}
