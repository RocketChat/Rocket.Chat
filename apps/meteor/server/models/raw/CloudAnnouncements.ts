import type { Cloud, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICloudAnnouncentsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CloudAnnouncementsRaw extends BaseRaw<Cloud.Announcement> implements ICloudAnnouncentsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<Cloud.Announcement>>) {
		super(db, 'cloud_announcements', trash);
	}

	modelIndexes(): IndexDescription[] {
		return [{ key: { status: 1, expireAt: 1 } }];
	}
}
