import type { ILivechatTag } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Db, DeleteResult, IndexDescription } from 'mongodb';

export class LivechatTagRaw extends BaseRaw<ILivechatTag> implements ILivechatTagModel {
	constructor(db: Db) {
		super(db, 'livechat_tag');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					name: 1,
				},
				unique: true,
			},
		];
	}

	async createOrUpdateTag(
		_id: string | undefined,
		{ name, description }: { name: string; description?: string },
		departments: string[] = [],
	): Promise<Omit<ILivechatTag, '_updatedAt'>> {
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

		// updateOne/insertOne mutate `record` by injecting `_updatedAt` (setUpdatedAt), so rebuild the declared shape
		return { _id, name, description, numDepartments: departments.length, departments };
	}

	// REMOVE
	override removeById(_id: string): Promise<DeleteResult> {
		const query = { _id };

		return this.deleteOne(query);
	}
}
