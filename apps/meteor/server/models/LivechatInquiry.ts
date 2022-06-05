import { FindOneOptions, MongoDistinctPreferences, UpdateWriteOpResult } from 'mongodb';
import { IMessage, ILivechatInquiryRecord, LivechatInquiryStatus } from '@rocket.chat/core-typings';
import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatInquiry';

export class LivechatInquiry extends ModelClass<ILivechatInquiryRecord> implements ILivechatInquiryModel {
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

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatInquiryModel', new LivechatInquiry(col, trashCollection) as ILivechatInquiryModel);
