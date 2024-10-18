import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
	addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void>;
	findPaginatedContacts(searchText?: string, options?: FindOptions): FindPaginated<FindCursor<ILivechatContact>>;
	updateLastChatById(contactId: string, lastChat: ILivechatContact['lastChat']): Promise<UpdateResult>;
}
