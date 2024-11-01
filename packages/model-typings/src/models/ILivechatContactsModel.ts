import type {
	AtLeast,
	ILivechatContact,
	ILivechatContactChannel,
	ILivechatContactVisitorAssociation,
	ILivechatVisitor,
} from '@rocket.chat/core-typings';
import type { Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	insertContact(
		data: InsertionModel<Omit<ILivechatContact, 'createdAt'>> & { createdAt?: ILivechatContact['createdAt'] },
	): Promise<ILivechatContact['_id']>;
	upsertContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact | null>;
	updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact>;
	addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void>;
	findPaginatedContacts(searchText?: string, options?: FindOptions): FindPaginated<FindCursor<ILivechatContact>>;
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
	): Promise<UpdateResult>;
	findSimilarVerifiedContacts(
		channel: Pick<ILivechatContactChannel, 'field' | 'value'>,
		originalContactId: string,
		options?: FindOptions<ILivechatContact>,
	): Promise<ILivechatContact[]>;
	findAllByVisitorId(visitorId: string): FindCursor<ILivechatContact>;
}
