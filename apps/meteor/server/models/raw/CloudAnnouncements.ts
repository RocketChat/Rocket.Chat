import type { Cloud } from '@rocket.chat/core-typings';
import type { ICloudAnnouncementsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CloudAnnouncementsRaw extends BaseRaw<Cloud.Announcement> implements ICloudAnnouncementsModel {
	constructor(db: Db) {
		super(db, 'cloud_announcements');
	}
}
