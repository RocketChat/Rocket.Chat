import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatPriorityModel } from '@rocket.chat/model-typings';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatPriorityRaw extends BaseRaw<IRocketChatRecord> implements ILivechatPriorityModel {
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
