import type {
	AtLeast,
	ILivechatContact,
	ILivechatContactChannel,
	ILivechatContactVisitorAssociation,
	ILivechatVisitor,
} from '@rocket.chat/core-typings';
import type { AggregationCursor, Document, FindCursor, FindOneAndUpdateOptions, UpdateFilter, UpdateOptions, UpdateResult } from 'mongodb';

import type { Updater } from '../updater';
import type { FindPaginated, IBaseModel, InsertionModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ILivechatContactsModel extends IBaseModel<ILivechatContact> {
	insertContact(
		data: InsertionModel<Omit<ILivechatContact, 'createdAt'>> & { createdAt?: ILivechatContact['createdAt'] },
	): Promise<ILivechatContact['_id']>;
	patchContact(
		contactId: string,
		data: {
			set?: Partial<ILivechatContact>;
			unset?: Partial<Record<keyof ILivechatContact, '' | 1>>;
		},
		options?: FindOneAndUpdateOptions,
	): Promise<ILivechatContact | null>;
	updateById(contactId: string, update: UpdateFilter<ILivechatContact>, options?: UpdateOptions): Promise<Document | UpdateResult>;
	addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void>;
	findPaginatedContacts<T extends Document = ILivechatContact, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		search: { searchText?: string; unknown?: boolean },
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;
	updateLastChatById(
		contactId: string,
		visitor: ILivechatContactVisitorAssociation,
		lastChat: ILivechatContact['lastChat'],
	): Promise<UpdateResult>;
	findContactMatchingVisitor(visitor: AtLeast<ILivechatVisitor, 'visitorEmails' | 'phone'>): Promise<ILivechatContact | null>;
	findContactByEmailAndContactManager(email: string): Promise<Pick<ILivechatContact, 'contactManager'> | null>;
	findOneByVisitor<T extends Document = ILivechatContact, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		visitor: ILivechatContactVisitorAssociation,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	isChannelBlocked(visitor: ILivechatContactVisitorAssociation): Promise<boolean>;
	updateFromUpdaterByAssociation(
		visitor: ILivechatContactVisitorAssociation,
		contactUpdater: Updater<ILivechatContact>,
		options?: UpdateOptions,
	): Promise<UpdateResult>;
	findSimilarVerifiedContacts<T extends Document = ILivechatContact, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		channel: Pick<ILivechatContactChannel, 'field' | 'value'>,
		originalContactId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O>[]>;
	findAllByVisitorId(visitorId: string): FindCursor<ILivechatContact>;
	addEmail(contactId: string, email: string): Promise<ILivechatContact | null>;
	isContactActiveOnPeriod(visitor: ILivechatContactVisitorAssociation, period: string): Promise<number>;
	markContactActiveForPeriod(visitor: ILivechatContactVisitorAssociation, period: string): Promise<UpdateResult>;
	countContactsOnPeriod(period: string): Promise<number>;
	setChannelBlockStatus(visitor: ILivechatContactVisitorAssociation, blocked: boolean): Promise<UpdateResult>;
	setChannelVerifiedStatus(visitor: ILivechatContactVisitorAssociation, verified: boolean): Promise<UpdateResult>;
	setVerifiedUpdateQuery(verified: boolean, contactUpdater: Updater<ILivechatContact>): Updater<ILivechatContact>;
	setFieldAndValueUpdateQuery(field: string, value: string, contactUpdater: Updater<ILivechatContact>): Updater<ILivechatContact>;
	countByContactInfo({ contactId, email, phone }: { contactId?: string; email?: string; phone?: string }): Promise<number>;
	countUnknown(): Promise<number>;
	countBlocked(): Promise<number>;
	countFullyBlocked(): Promise<number>;
	countVerified(): Promise<number>;
	countContactsWithoutChannels(): Promise<number>;
	getStatistics(): AggregationCursor<{ totalConflicts: number; avgChannelsPerContact: number }>;
	disableByVisitorId(visitorId: string): Promise<UpdateResult | Document>;
	disableByContactId(contactId: string): Promise<UpdateResult>;
	findOneEnabledById<P extends Document = ILivechatContact, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_id: ILivechatContact['_id'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
}
