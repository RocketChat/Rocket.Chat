import type { ILivechatCustomField, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatCustomFieldModel } from '@rocket.chat/model-typings';
import type { Db, Collection, IndexDescription, FindOptions, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatCustomFieldRaw extends BaseRaw<ILivechatCustomField> implements ILivechatCustomFieldModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatCustomField>>) {
		super(db, 'livechat_custom_field', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { scope: 1 } }];
	}

	findByScope(scope: ILivechatCustomField['scope'], options?: FindOptions<ILivechatCustomField>): FindCursor<ILivechatCustomField> {
		return this.find({ scope }, options || {});
	}

	async createOrUpdateCustomField(
		_id: string,
		field: string,
		label: ILivechatCustomField['label'],
		scope: ILivechatCustomField['scope'],
		visibility: ILivechatCustomField['visibility'],
		extraData: any,
	) {
		const record = {
			label,
			scope,
			visibility,
			...extraData,
		};

		if (_id) {
			await this.updateOne({ _id }, { $set: record });
		} else {
			record._id = field;
			await this.insertOne(record);
		}

		return record;
	}
}
