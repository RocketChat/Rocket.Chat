import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatCustomFieldModel extends IBaseModel<ILivechatCustomField> {
	findByScope<T = ILivechatCustomField>(scope: ILivechatCustomField['scope'], options?: FindOptions<T>): FindCursor<T>;
	findByScope(scope: ILivechatCustomField['scope'], options?: FindOptions<ILivechatCustomField>): FindCursor<ILivechatCustomField>;
	findMatchingCustomFields(
		scope: ILivechatCustomField['scope'],
		searchable: boolean,
		options: FindOptions<ILivechatCustomField>,
		extraFilter: { [key: string]: string | string[] | { [key: string]: string | string[] } },
	): Promise<ILivechatCustomField[]>;
	findMatchingCustomFieldsNames(scope: ILivechatCustomField['scope'], searchable: boolean, names: string[]): Promise<string[]>;
}
