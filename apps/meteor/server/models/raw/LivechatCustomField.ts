import type { ILivechatCustomField, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatCustomFieldModel } from '@rocket.chat/model-typings';
import type { Db, Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatCustomFieldRaw extends BaseRaw<ILivechatCustomField> implements ILivechatCustomFieldModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatCustomField>>) {
		super(db, 'livechat_custom_field', trash);
	}
}
