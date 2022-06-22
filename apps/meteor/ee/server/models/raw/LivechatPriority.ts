import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatPriorityModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

// TODO need to define type for LivechatPriority object
export class LivechatPriorityRaw extends BaseRaw<IRocketChatRecord> implements ILivechatPriorityModel {
	constructor(db: Db) {
		super(db, getCollectionName('livechat_priority'));
	}

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
