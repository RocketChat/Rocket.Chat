import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ILivechatCustomFieldModel extends IBaseModel<ILivechatCustomField> {
	findByScope<T extends Document = ILivechatCustomField, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		scope: ILivechatCustomField['scope'],
		options?: O,
		includeHidden?: boolean,
	): FindCursor<DocumentWithProjection<T, O>>;
	findMatchingCustomFields<
		T extends Document = ILivechatCustomField,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		scope: ILivechatCustomField['scope'],
		searchable: boolean,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findMatchingCustomFieldsByIds<
		T extends Document = ILivechatCustomField,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		ids: ILivechatCustomField['_id'][],
		scope: ILivechatCustomField['scope'],
		searchable: boolean,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	createOrUpdateCustomField(
		_id: string | null,
		field: string,
		label: ILivechatCustomField['label'],
		scope: ILivechatCustomField['scope'],
		visibility: ILivechatCustomField['visibility'],
		extraData: any,
	): Promise<ILivechatCustomField>;
}
