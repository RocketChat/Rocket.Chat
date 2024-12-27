import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Db, DeleteResult, FindCursor, FindOptions, IndexDescription } from 'mongodb';

export class LivechatTagRaw extends BaseRaw<ILivechatTag> implements ILivechatTagModel {
	constructor(db: Db) {
		super(db, 'livechat_tag');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					name: 1,
				},
				unique: true,
			},
		];
	}

	findOneById(_id: string, options?: FindOptions<ILivechatTag>): Promise<ILivechatTag | null> {
		const query = { _id };

		return this.findOne(query, options);
	}

	findInIds(ids: string[], options?: FindOptions<ILivechatTag>): FindCursor<ILivechatTag> {
		const query = { _id: { $in: ids } };

		return this.find(query, options);
	}

	async createOrUpdateTag(
		_id: string | undefined,
		{ name, description }: { name: string; description?: string },
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

	// REMOVE
	removeById(_id: string): Promise<DeleteResult> {
		const query = { _id };

		return this.deleteOne(query);
	}
}
