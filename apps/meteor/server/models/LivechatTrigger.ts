import type { IndexSpecification, Cursor, UpdateWriteOpResult } from 'mongodb';
import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import type { ILivechatTriggerModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class LivechatTrigger extends ModelClass<ILivechatTrigger> implements ILivechatTriggerModel {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { enabled: 1 } }];
	}

	findEnabled(): Cursor<ILivechatTrigger> {
		return this.find({ enabled: true });
	}

	updateById(_id: string, data: ILivechatTrigger): Promise<UpdateWriteOpResult> {
		return this.updateOne({ _id }, { $set: data });
	}
}

const col = db.collection(`${prefix}livechat_trigger`);
registerModel('ILivechatTriggerModel', new LivechatTrigger(col, trashCollection) as ILivechatTriggerModel);
