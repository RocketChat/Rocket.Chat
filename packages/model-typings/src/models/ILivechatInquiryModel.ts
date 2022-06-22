import type { FindOneOptions, MongoDistinctPreferences, UpdateWriteOpResult } from 'mongodb';
import type { IMessage, ILivechatInquiryRecord, LivechatInquiryStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatInquiryModel extends IBaseModel<ILivechatInquiryRecord> {
	findOneQueuedByRoomId(rid: string): Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null>;
	findOneByRoomId<T = ILivechatInquiryRecord>(
		rid: string,
		options: FindOneOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null>;
	getDistinctQueuedDepartments(options: MongoDistinctPreferences): Promise<string[]>;
	setDepartmentByInquiryId(inquiryId: string, department: string): Promise<ILivechatInquiryRecord | undefined>;
	setLastMessageByRoomId(rid: string, message: IMessage): Promise<UpdateWriteOpResult>;
}
