import type { ILivechatCustomField, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatCustomFieldModel } from '@rocket.chat/model-typings';
import type { Db, Collection, IndexDescription, FindOptions, FindCursor, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatCustomFieldRaw extends BaseRaw<ILivechatCustomField> implements ILivechatCustomFieldModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatCustomField>>) {
		super(db, 'livechat_custom_field', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { scope: 1 } }];
	}

	findByScope<T extends ILivechatCustomField>(
		scope: ILivechatCustomField['scope'],
		options?: FindOptions<ILivechatCustomField>,
		includeHidden = true,
	): FindCursor<T> {
		return this.find<T>({ scope, ...(includeHidden === true ? {} : { visibility: { $ne: 'hidden' } }) }, options);
	}

	findMatchingCustomFields(
		scope: ILivechatCustomField['scope'],
		searchable = true,
		options?: FindOptions<ILivechatCustomField>,
	): FindCursor<ILivechatCustomField> {
		const query = {
			scope,
			searchable,
		};

		return this.find(query, options);
	}

	findMatchingCustomFieldsByIds(
		ids: ILivechatCustomField['_id'][],
		scope: ILivechatCustomField['scope'],
		searchable = true,
		options?: FindOptions<ILivechatCustomField>,
	): FindCursor<ILivechatCustomField> {
		const query = {
			_id: { $in: ids },
			scope,
			searchable,
		};

		return this.find(query, options);
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

	findByIdsAndScope<T extends Document = ILivechatCustomField>(
		ids: ILivechatCustomField['_id'][],
		scope: ILivechatCustomField['scope'],
		options?: FindOptions<ILivechatCustomField>,
	): FindCursor<T> {
		return this.find<T>({ _id: { $in: ids }, scope }, options);
	}
}
