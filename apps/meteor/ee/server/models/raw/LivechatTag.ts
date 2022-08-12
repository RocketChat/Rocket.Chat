import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatTagRaw extends BaseRaw<ILivechatTag> implements ILivechatTagModel {
	protected modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 }, unique: true }];
	}

	constructor(db: Db) {
		super(db, 'livechat_tag');
	}

	async createOrUpdateTag(
		_id: string,
		{ name, description }: Pick<ILivechatTag, 'name' | 'description'>,
		departments: string[] = [],
	): Promise<ILivechatTag> {
		const record = {
			name,
			description,
			numDepartments: departments.length,
			departments,
		};

		if (_id) {
			await this.updateOne({ _id }, { $set: record });
		} else {
			_id = (await this.insertOne(record)).insertedId;
		}

		return Object.assign(record, { _id });
	}
}
