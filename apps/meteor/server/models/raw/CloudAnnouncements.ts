import type { Cloud, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICloudAnnouncementsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CloudAnnouncementsRaw extends BaseRaw<Cloud.Announcement> implements ICloudAnnouncementsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<Cloud.Announcement>>) {
		super(db, 'cloud_announcements', trash);
	}

	modelIndexes(): IndexDescription[] {
		return [{ key: { status: 1, expireAt: 1 } }];
	}
}
