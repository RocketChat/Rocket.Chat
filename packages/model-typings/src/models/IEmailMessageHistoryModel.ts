import type { IEmailMessageHistory } from '@rocket.chat/core-typings';
import type { InsertOneResult, WithId } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IEmailMessageHistoryModel extends IBaseModel<IEmailMessageHistory> {
	create({ _id, email }: InsertionModel<IEmailMessageHistory>): Promise<InsertOneResult<WithId<IEmailMessageHistory>>>;
}
