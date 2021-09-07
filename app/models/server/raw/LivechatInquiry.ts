import { FindOneOptions, MongoDistinctPreferences } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ILivechatInquiry, LivechatInquiryStatus } from '../../../../definition/ILivechatInquiry';

export class LivechatInquiryRaw extends BaseRaw<ILivechatInquiry> {
	findOneQueuedByRoomId(rid: string): Promise<ILivechatInquiry | null> {
		const query = {
			rid,
			status: LivechatInquiryStatus.QUEUED,
		};
		return this.findOne(query);
	}

	findOneByRoomId(rid: string, options: FindOneOptions<ILivechatInquiry>): Promise<ILivechatInquiry | null> {
		const query = {
			rid,
		};
		return this.findOne(query, options);
	}

	getDistinctQueuedDepartments(options?: MongoDistinctPreferences): Promise<any> {
		return this.col.distinct('department', { status: LivechatInquiryStatus.QUEUED }, options);
	}
}
