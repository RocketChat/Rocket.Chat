import { FindOneOptions, MongoDistinctPreferences, UpdateWriteOpResult } from 'mongodb';
import { IMessage, ILivechatInquiryRecord, LivechatInquiryStatus } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class LivechatInquiryRaw extends BaseRaw<ILivechatInquiryRecord> {
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
}
