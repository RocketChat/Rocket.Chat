import type { FindOptions, DistinctOptions, Document, UpdateResult } from 'mongodb';
import type {
	IMessage,
	ILivechatInquiryRecord,
	LivechatInquiryStatus,
	OmnichannelSortingMechanismSettingType,
} from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';
// apps/meteor/ee/app/livechat-enterprise/server/definitions/settings

export interface ILivechatInquiryModel extends IBaseModel<ILivechatInquiryRecord> {
	findOneQueuedByRoomId(rid: string): Promise<(ILivechatInquiryRecord & { status: LivechatInquiryStatus.QUEUED }) | null>;
	findOneByRoomId<T = ILivechatInquiryRecord>(
		rid: string,
		options: FindOptions<T extends ILivechatInquiryRecord ? ILivechatInquiryRecord : T>,
	): Promise<T | null>;
	getDistinctQueuedDepartments(options: DistinctOptions): Promise<string[]>;
	setDepartmentByInquiryId(inquiryId: string, department: string): Promise<ILivechatInquiryRecord | null>;
	setLastMessageByRoomId(rid: string, message: IMessage): Promise<UpdateResult>;
	findNextAndLock(department?: string): Promise<ILivechatInquiryRecord | null>;
	unlock(inquiryId: string): Promise<UpdateResult>;
	unlockAll(): Promise<UpdateResult | Document>;
	getCurrentSortedQueueAsync(props: {
		inquiryId?: string;
		department: string;
		queueSortBy: OmnichannelSortingMechanismSettingType;
	}): Promise<Pick<ILivechatInquiryRecord, '_id' | 'rid' | 'name' | 'ts' | 'status' | 'department'> & { position: number }>;
}
