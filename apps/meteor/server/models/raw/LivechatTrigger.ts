import type { ILivechatTrigger, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatTriggerModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription, UpdateResult } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from './BaseRaw';

export class LivechatTriggerRaw extends BaseRaw<ILivechatTrigger> implements ILivechatTriggerModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatTrigger>>) {
		super(db, getCollectionName('livechat_trigger'), trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { enabled: 1 } }];
	}

	findEnabled(): FindCursor<ILivechatTrigger> {
		return this.find({ enabled: true });
	}

	updateById(_id: string, data: ILivechatTrigger): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: data });
	}
}
