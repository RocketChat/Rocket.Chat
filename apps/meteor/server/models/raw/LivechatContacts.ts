import type { ILivechatContact, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatContactsModel } from '@rocket.chat/model-typings';
import type { Collection, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatContactsRaw extends BaseRaw<ILivechatContact> implements ILivechatContactsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatContact>>) {
		super(db, 'livechat_contact', trash);
	}
}
