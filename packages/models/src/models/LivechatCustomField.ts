import type { ILivechatCustomField, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatCustomFieldModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Db, Collection, IndexDescription, FindCursor, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatCustomFieldRaw extends BaseRaw<ILivechatCustomField> implements ILivechatCustomFieldModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatCustomField>>) {
		super(db, 'livechat_custom_field', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { scope: 1 } }];
	}

	findByScope<T extends Document = ILivechatCustomField, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		scope: ILivechatCustomField['scope'],
		options?: O,
		includeHidden = true,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ scope, ...(includeHidden === true ? {} : { visibility: { $ne: 'hidden' } }) }, options);
	}

	findMatchingCustomFields<
		T extends Document = ILivechatCustomField,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(scope: ILivechatCustomField['scope'], searchable = true, options?: O): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			scope,
			searchable,
		};

		return this.find<T, O>(query, options);
	}

	findMatchingCustomFieldsByIds<
		T extends Document = ILivechatCustomField,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		ids: ILivechatCustomField['_id'][],
		scope: ILivechatCustomField['scope'],
		searchable = true,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			_id: { $in: ids },
			scope,
			searchable,
		};

		return this.find<T, O>(query, options);
	}

	async createOrUpdateCustomField(
		_id: string | null,
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
