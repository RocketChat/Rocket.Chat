import type { ILivechatContact } from '@rocket.chat/core-typings';
import type { ModifyResult, FindCursor, FindOptions } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	upsertContact(contactId: string, data: Partial<ILivechatContact>): Promise<ModifyResult<ILivechatContact>>;
	updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
	findPaginatedContacts(searchText?: string, options?: FindOptions): FindPaginated<FindCursor<ILivechatContact>>;
}
