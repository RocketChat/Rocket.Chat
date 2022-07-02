import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';
import type { Collection, Db, FindOneOptions, MongoDistinctPreferences, UpdateWriteOpResult } from 'mongodb';
import { ILivechatInquiryRecord, IMessage, LivechatInquiryStatus, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class LivechatInquiryRaw extends BaseRaw<ILivechatInquiryRecord> implements ILivechatInquiryModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatInquiryRecord>>) {
		super(db, getCollectionName('livechat_inquiry'), trash);
	}

	findOneQueuedByRoomId(rid: string): Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null> {
		const query = {
			rid,
			status: LivechatInquiryStatus.QUEUED,
		};
		return this.findOne(query) as unknown as Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null>;
	}

	findOneByRoomId<T = ILivechatInquiryRecord>(
		rid: string,
		options: FindOneOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null> {
		const query = {
			rid,
		};
		return this.findOne(query, options);
	}

	getDistinctQueuedDepartments(options: MongoDistinctPreferences): Promise<string[]> {
		return this.col.distinct('department', { status: LivechatInquiryStatus.QUEUED }, options);
	}

	async setDepartmentByInquiryId(inquiryId: string, department: string): Promise<ILivechatInquiryRecord | undefined> {
		const updated = await this.findOneAndUpdate({ _id: inquiryId }, { $set: { department } }, { returnDocument: 'after' });
		return updated.value;
	}

	async setLastMessageByRoomId(rid: string, message: IMessage): Promise<UpdateWriteOpResult> {
		return this.updateOne({ rid }, { $set: { lastMessage: message } });
	}

	async findNextAndLock(department?: string): Promise<ILivechatInquiryRecord | undefined> {
		const date = new Date();
		const result = await this.col.findOneAndUpdate(
			{
				status: LivechatInquiryStatus.QUEUED,
				...(department && { department }),
				$or: [
					{
						locked: true,
						lockedAt: {
							$lte: new Date(date.getTime() - 5000),
						},
					},
					{
						locked: false,
					},
					{
						locked: { $exists: false },
					},
				],
			},
			{
				$set: {
					locked: true,
					// apply 5 secs lock lifetime
					lockedAt: new Date(),
				},
			},
			{
				sort: {
					queueOrder: 1,
					estimatedWaitingTimeQueue: 1,
					estimatedServiceTimeAt: 1,
				},
			},
		);

		return result.value;
	}

	async unlock(inquiryId: string): Promise<UpdateWriteOpResult> {
		return this.updateOne({ _id: inquiryId }, { $unset: { locked: 1, lockedAt: 1 } });
	}

	async unlockAll(): Promise<UpdateWriteOpResult> {
		return this.updateMany({}, { $unset: { locked: 1, lockedAt: 1 } });
	}
}
