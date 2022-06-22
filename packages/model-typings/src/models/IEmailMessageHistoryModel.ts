import type { InsertOneWriteOpResult, WithId } from 'mongodb';
import type { IEmailMessageHistory } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IEmailMessageHistoryModel extends IBaseModel<IEmailMessageHistory> {
	create({ _id, email }: IEmailMessageHistory): Promise<InsertOneWriteOpResult<WithId<IEmailMessageHistory>>>;
}
