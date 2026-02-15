import type { IScheduledMessage, IUser, RoomID, ScheduledMessageStatus, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, IScheduledMessagesModel } from '@rocket.chat/model-typings';
import type {
	Collection,
	Db,
	Filter,
	FindCursor,
	FindOptions,
	IndexDescription,
	UpdateResult,
	DeleteResult,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ScheduledMessagesRaw extends BaseRaw<IScheduledMessage> implements IScheduledMessagesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IScheduledMessage>>) {
		super(db, 'scheduled_messages', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { rid: 1, scheduledAt: 1 } },
			{ key: { userId: 1, status: 1 } },
			{ key: { status: 1, scheduledAt: 1 } },
			{ key: { scheduledAt: 1 }, partialFilterExpression: { status: 'pending' } },
			{ key: { createdAt: 1 } },
		];
	}

	findReadyToSend(now: Date, options?: FindOptions<IScheduledMessage>): FindCursor<IScheduledMessage> {
		const query: Filter<IScheduledMessage> = {
			status: 'pending',
			scheduledAt: { $lte: now },
		};

		return this.find(query, options);
	}

	findByRoomId(rid: RoomID, options?: FindOptions<IScheduledMessage>): FindPaginated<FindCursor<IScheduledMessage>> {
		const query: Filter<IScheduledMessage> = { rid };
		return this.findPaginated(query, options);
	}

	findByUserId(userId: IUser['_id'], options?: FindOptions<IScheduledMessage>): FindPaginated<FindCursor<IScheduledMessage>> {
		const query: Filter<IScheduledMessage> = { userId };
		return this.findPaginated(query, options);
	}

	findByRoomIdAndUserId(
		rid: RoomID,
		userId: IUser['_id'],
		options?: FindOptions<IScheduledMessage>,
	): FindPaginated<FindCursor<IScheduledMessage>> {
		const query: Filter<IScheduledMessage> = { rid, userId };
		return this.findPaginated(query, options);
	}

	findByStatus(status: ScheduledMessageStatus, options?: FindOptions<IScheduledMessage>): FindCursor<IScheduledMessage> {
		const query: Filter<IScheduledMessage> = { status };
		return this.find(query, options);
	}

	async updateStatus(
		messageId: IScheduledMessage['_id'],
		status: ScheduledMessageStatus,
		sentAt?: Date,
		failureReason?: string,
	): Promise<UpdateResult> {
		const update: any = {
			$set: {
				status,
				updatedAt: new Date(),
			},
		};

		if (sentAt) {
			update.$set.sentAt = sentAt;
		}

		if (failureReason) {
			update.$set.failureReason = failureReason;
		}

		return this.updateOne({ _id: messageId }, update);
	}

	async updateScheduledAt(messageId: IScheduledMessage['_id'], scheduledAt: Date): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: messageId },
			{
				$set: {
					scheduledAt,
					updatedAt: new Date(),
				},
			},
		);
	}

	async cancelMessage(messageId: IScheduledMessage['_id'], userId: IUser['_id']): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: messageId, userId, status: 'pending' },
			{
				$set: {
					status: 'cancelled',
					updatedAt: new Date(),
				},
			},
		);
	}

	async deleteOldMessages(olderThan: Date): Promise<DeleteResult> {
		const query: Filter<IScheduledMessage> = {
			status: { $in: ['sent', 'cancelled', 'failed'] },
			updatedAt: { $lt: olderThan },
		};

		return this.deleteMany(query);
	}

	async countPendingByUserId(userId: IUser['_id']): Promise<number> {
		return this.col.countDocuments({ userId, status: 'pending' });
	}

	async countPendingByRoomId(rid: RoomID): Promise<number> {
		return this.col.countDocuments({ rid, status: 'pending' });
	}
}
