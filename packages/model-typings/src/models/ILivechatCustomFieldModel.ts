import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatCustomFieldModel extends IBaseModel<ILivechatCustomField> {
	findByScope<T = ILivechatCustomField>(scope: ILivechatCustomField['scope'], options?: FindOptions<T>): FindCursor<T>;
	findByScope(scope: ILivechatCustomField['scope'], options?: FindOptions<ILivechatCustomField>): FindCursor<ILivechatCustomField>;
}
