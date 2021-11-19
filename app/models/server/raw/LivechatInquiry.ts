import { FindOneOptions, MongoDistinctPreferences } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ILivechatInquiryRecord, LivechatInquiryStatus } from '../../../../definition/IInquiry';

export class LivechatInquiryRaw extends BaseRaw<ILivechatInquiryRecord> {
	findOneQueuedByRoomId(rid: string): Promise<ILivechatInquiryRecord | null> {
		const query = {
			rid,
			status: LivechatInquiryStatus.QUEUED,
		};
		return this.findOne(query);
	}

	findOneByRoomId(rid: string, options: FindOneOptions<ILivechatInquiryRecord>): Promise<ILivechatInquiryRecord | null> {
		const query = {
			rid,
		};
		return this.findOne(query, options);
	}

	getDistinctQueuedDepartments(options: MongoDistinctPreferences): Promise<any> {
		return this.col.distinct('department', { status: LivechatInquiryStatus.QUEUED }, options);
	}
}
