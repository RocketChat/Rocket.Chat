import type { ILivechatMonitor } from '@rocket.chat/core-typings';
import type { ILivechatUnitMonitorsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatUnitMonitorsRaw extends BaseRaw<ILivechatMonitor> implements ILivechatUnitMonitorsModel {
	constructor(db: Db) {
		super(db, getCollectionName('livechat_unit_monitors'));
	}
}
