import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatCustomFieldModel extends IBaseModel<ILivechatCustomField> {
	findByScope<T extends Document = ILivechatCustomField>(
		scope: ILivechatCustomField['scope'],
		options?: FindOptions<T>,
		includeHidden?: boolean,
	): FindCursor<T>;
	findByScope(
		scope: ILivechatCustomField['scope'],
		options?: FindOptions<ILivechatCustomField>,
		includeHidden?: boolean,
	): FindCursor<ILivechatCustomField>;
	findMatchingCustomFields(
		scope: ILivechatCustomField['scope'],
		searchable: boolean,
		options?: FindOptions<ILivechatCustomField>,
	): FindCursor<ILivechatCustomField>;
	findMatchingCustomFieldsByIds(
		ids: ILivechatCustomField['_id'][],
		scope: ILivechatCustomField['scope'],
		searchable: boolean,
		options?: FindOptions<ILivechatCustomField>,
	): FindCursor<ILivechatCustomField>;
	createOrUpdateCustomField(
		_id: string,
		field: string,
		label: ILivechatCustomField['label'],
		scope: ILivechatCustomField['scope'],
		visibility: ILivechatCustomField['visibility'],
		extraData: any,
	): Promise<ILivechatCustomField>;
}
