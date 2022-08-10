import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, FindOptions, DeleteResult } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatTagRaw extends BaseRaw<ILivechatTag> implements ILivechatTagModel {
	protected modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 }, unique: true }];
	}

	constructor(db: Db) {
		super(db, 'livechat_tag');
	}

	findOneById(_id: string, options: FindOptions<ILivechatTag> = {}): Promise<ILivechatTag | null> {
		const query = { _id };

		return this.findOne(query, options);
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
			this.update({ _id }, { $set: record });
		} else {
			_id = (await this.insertOne(record)).insertedId;
		}

		return Object.assign(record, { _id });
	}

	// REMOVE
	removeById(_id: string): Promise<DeleteResult> {
		const query = { _id };

		return this.deleteOne(query);
	}
}
