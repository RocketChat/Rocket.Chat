import type { IEmailInbox } from '@rocket.chat/core-typings';
import type { FindCursor, InsertOneResult, WithId, UpdateFilter } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IEmailInboxModel extends IBaseModel<IEmailInbox> {
	setDisabledById(id: IEmailInbox['_id']): Promise<null | WithId<IEmailInbox>>;
	create(emailInbox: Omit<IEmailInbox, '_id'>): Promise<InsertOneResult<IEmailInbox>>;
	updateById(id: IEmailInbox['_id'], data: UpdateFilter<IEmailInbox>): Promise<null | WithId<Pick<IEmailInbox, '_id'>>>;
	findActive(): FindCursor<IEmailInbox>;
	findByEmail(email: IEmailInbox['email']): Promise<IEmailInbox | null>;
}
