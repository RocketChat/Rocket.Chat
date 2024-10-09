import type { ILivechatContact } from '@rocket.chat/omnichannel-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
	findPaginatedContacts(searchText?: string, options?: FindOptions): FindPaginated<FindCursor<ILivechatContact>>;
}
