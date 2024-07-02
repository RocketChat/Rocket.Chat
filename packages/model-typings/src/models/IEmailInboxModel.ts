import type { IEmailInbox } from '@rocket.chat/core-typings';
import type { FindCursor, InsertOneResult, ModifyResult, UpdateFilter } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IEmailInboxModel extends IBaseModel<IEmailInbox> {
	setDisabledById(id: IEmailInbox['_id']): Promise<ModifyResult<IEmailInbox>>;
	create(emailInbox: Omit<IEmailInbox, '_id'>): Promise<InsertOneResult<IEmailInbox>>;
	updateById(id: IEmailInbox['_id'], data: UpdateFilter<IEmailInbox>): Promise<ModifyResult<Pick<IEmailInbox, '_id'>>>;
	findActive(): FindCursor<IEmailInbox>;
	findByEmail(email: IEmailInbox['email']): Promise<IEmailInbox | null>;
}
