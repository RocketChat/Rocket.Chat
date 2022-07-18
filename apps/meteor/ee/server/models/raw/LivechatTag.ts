import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatTagRaw extends BaseRaw<ILivechatTag> implements ILivechatTagModel {
	constructor(db: Db) {
		super(db, 'livechat_tag');
	}
}
