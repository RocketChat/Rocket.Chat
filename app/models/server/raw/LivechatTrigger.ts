import { Cursor, UpdateWriteOpResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ILivechatTrigger } from '../../../../definition/ILivechatTrigger';

export class LivechatTriggerRaw extends BaseRaw<ILivechatTrigger> {
	protected modelIndexes() {
		return [{ key: { enabled: 1 } }];
	}

	findEnabled(): Cursor<ILivechatTrigger> {
		return this.find({ enabled: true });
	}

	updateById(_id: string, data: ILivechatTrigger): Promise<UpdateWriteOpResult> {
		return this.updateOne({ _id }, { $set: data });
	}
}
