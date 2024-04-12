import type { ILivechatTrigger, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatTriggerModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, IndexDescription, UpdateFilter, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatTriggerRaw extends BaseRaw<ILivechatTrigger> implements ILivechatTriggerModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<ILivechatTrigger>>) {
		super('livechat_trigger', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { enabled: 1 } }];
	}

	findEnabled(): FindCursor<ILivechatTrigger> {
		return this.find({ enabled: true });
	}

	updateById(_id: string, data: Omit<ILivechatTrigger, '_id' | '_updatedAt'>): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: data } as UpdateFilter<ILivechatTrigger>); // TODO: remove this cast when TypeScript is updated
	}
}
