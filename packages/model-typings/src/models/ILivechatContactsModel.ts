import type {
	AtLeast,
	ILivechatContact,
	ILivechatContactChannel,
	ILivechatContactVisitorAssociation,
	ILivechatVisitor,
} from '@rocket.chat/core-typings';
import type { Document, FindCursor, FindOneAndUpdateOptions, FindOptions, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	insertContact(
		data: InsertionModel<Omit<ILivechatContact, 'createdAt'>> & { createdAt?: ILivechatContact['createdAt'] },
	): Promise<ILivechatContact['_id']>;
	updateContact(contactId: string, data: Partial<ILivechatContact>, options?: FindOneAndUpdateOptions): Promise<ILivechatContact>;
	updateById(contactId: string, update: UpdateFilter<ILivechatContact>, options?: UpdateOptions): Promise<Document | UpdateResult>;
	addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void>;
	findPaginatedContacts(
		search: { searchText?: string; unknown?: boolean },
		options?: FindOptions<ILivechatContact>,
	): FindPaginated<FindCursor<ILivechatContact>>;
	updateLastChatById(
		contactId: string,
		visitor: ILivechatContactVisitorAssociation,
		lastChat: ILivechatContact['lastChat'],
	): Promise<UpdateResult>;
	findContactMatchingVisitor(visitor: AtLeast<ILivechatVisitor, 'visitorEmails' | 'phone'>): Promise<ILivechatContact | null>;
	findOneByVisitor<T extends Document = ILivechatContact>(
		visitor: ILivechatContactVisitorAssociation,
		options?: FindOptions<ILivechatContact>,
	): Promise<T | null>;
	isChannelBlocked(visitor: ILivechatContactVisitorAssociation): Promise<boolean>;
	updateContactChannel(
		visitor: ILivechatContactVisitorAssociation,
		data: Partial<ILivechatContactChannel>,
		contactData?: Partial<Omit<ILivechatContact, 'channels'>>,
		options?: UpdateOptions,
	): Promise<UpdateResult>;
	findSimilarVerifiedContacts(
		channel: Pick<ILivechatContactChannel, 'field' | 'value'>,
		originalContactId: string,
		options?: FindOptions<ILivechatContact>,
	): Promise<ILivechatContact[]>;
	findAllByVisitorId(visitorId: string): FindCursor<ILivechatContact>;
	addEmail(contactId: string, email: string): Promise<ILivechatContact | null>;
}
