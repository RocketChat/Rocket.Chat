import { registerModel } from '@rocket.chat/models';
import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatPriorityModel } from '@rocket.chat/model-typings';

import { BaseRaw } from '../../../server/models/BaseRaw';
import MeteorModel from '../../app/models/server/models/LivechatPriority';

export class LivechatPriority extends BaseRaw<IRocketChatRecord> implements ILivechatPriorityModel {
	findOneByIdOrName(_idOrName: string, options = {}): any {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}
}

const col = (MeteorModel as any).model.rawCollection();
registerModel('ILivechatPriorityModel', new LivechatPriority(col) as ILivechatPriorityModel);
