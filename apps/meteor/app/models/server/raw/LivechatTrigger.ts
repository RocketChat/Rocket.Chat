import { Cursor, UpdateWriteOpResult } from 'mongodb';
import type { ILivechatTrigger } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class LivechatTriggerRaw extends BaseRaw<ILivechatTrigger> {
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
