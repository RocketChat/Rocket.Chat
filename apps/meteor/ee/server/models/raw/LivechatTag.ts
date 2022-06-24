import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';
import { getCollectionName } from '@rocket.chat/models';
import { Db } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatTagRaw extends BaseRaw<IRocketChatRecord> implements ILivechatTagModel {
	constructor(db: Db) {
		super(db, getCollectionName('livechat_tag'));
	}
}
