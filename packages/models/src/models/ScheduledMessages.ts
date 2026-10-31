import type { IScheduledMessage, RocketChatRecordDeleted, ScheduledMessageEditableFields } from '@rocket.chat/core-typings';
import type { FindPaginated, IScheduledMessagesModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, FindCursor, FindOptions, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

const editableStatus = { $in: ['pending', 'failed'] as IScheduledMessage['status'][] };

export class ScheduledMessagesRaw extends BaseRaw<IScheduledMessage> implements IScheduledMessagesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IScheduledMessage>>) {
		super(db, 'scheduled_message', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { status: 1, scheduledAt: 1 } }, { key: { 'u._id': 1, 'scheduledAt': 1 } }, { key: { 'rid': 1, 'u._id': 1 } }];
	}

	async findNextDueDate(): Promise<Date | undefined> {
		const next = await this.findOne({ status: 'pending' }, { sort: { scheduledAt: 1 }, projection: { scheduledAt: 1 } });
		return next?.scheduledAt;
	}

	claimNextDue(now: Date): Promise<IScheduledMessage | null> {
		return this.findOneAndUpdate(
			{ status: 'pending', scheduledAt: { $lte: now } },
			{ $set: { status: 'sending', claimedAt: now } },
			{ sort: { scheduledAt: 1 }, returnDocument: 'after' },
		);
	}

	claimByIdAndUserId(_id: IScheduledMessage['_id'], uid: string, now: Date): Promise<IScheduledMessage | null> {
		return this.findOneAndUpdate(
			{ _id, 'u._id': uid, 'status': editableStatus },
			{ $set: { status: 'sending', claimedAt: now }, $unset: { error: 1 } },
			{ returnDocument: 'after' },
		);
	}

	setFailedById(_id: IScheduledMessage['_id'], error: string): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: { status: 'failed', error } });
	}

	findPaginatedByUserId(
		uid: string,
		rid: string | undefined,
		options: FindOptions<IScheduledMessage>,
	): FindPaginated<FindCursor<IScheduledMessage>> {
		return this.findPaginated({ 'u._id': uid, ...(rid && { rid }) }, { sort: { scheduledAt: 1 }, ...options });
	}

	findStaleSending(claimedBefore: Date): FindCursor<IScheduledMessage> {
		return this.find({ status: 'sending', claimedAt: { $lt: claimedBefore } });
	}

	findByRoomId(rid: string): FindCursor<IScheduledMessage> {
		return this.find({ rid });
	}

	findByUserId(uid: string): FindCursor<IScheduledMessage> {
		return this.find({ 'u._id': uid });
	}

	findAll(): FindCursor<IScheduledMessage> {
		return this.find({});
	}

	countByUserId(uid: string): Promise<number> {
		return this.countDocuments({ 'u._id': uid });
	}

	findOneByIdAndUserId(_id: IScheduledMessage['_id'], uid: string): Promise<IScheduledMessage | null> {
		return this.findOne({ _id, 'u._id': uid });
	}

	updateEditableByIdAndUserId(
		_id: IScheduledMessage['_id'],
		uid: string,
		set: ScheduledMessageEditableFields,
	): Promise<IScheduledMessage | null> {
		return this.findOneAndUpdate(
			{ _id, 'u._id': uid, 'status': editableStatus },
			{ $set: { ...set, status: 'pending' }, $unset: { error: 1, claimedAt: 1 } },
			{ returnDocument: 'after' },
		);
	}

	deleteEditableByIdAndUserId(_id: IScheduledMessage['_id'], uid: string): Promise<DeleteResult> {
		return this.deleteOne({ _id, 'u._id': uid, 'status': editableStatus });
	}

	deleteByRoomId(rid: string): Promise<DeleteResult> {
		return this.deleteMany({ rid });
	}

	deleteByUserId(uid: string): Promise<DeleteResult> {
		return this.deleteMany({ 'u._id': uid });
	}
}
