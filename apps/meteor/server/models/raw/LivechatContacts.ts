import type {
	AtLeast,
	ILivechatContact,
	ILivechatContactChannel,
	ILivechatContactVisitorAssociation,
	ILivechatVisitor,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatContactsModel, InsertionModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
	Document,
	Collection,
	Db,
	RootFilterOperators,
	Filter,
	FindOptions,
	FindCursor,
	IndexDescription,
	UpdateResult,
	UpdateFilter,
	UpdateOptions,
	FindOneAndUpdateOptions,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatContactsRaw extends BaseRaw<ILivechatContact> implements ILivechatContactsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatContact>>) {
		super(db, 'livechat_contact', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: { name: 1 },
				unique: false,
				name: 'name_insensitive',
				collation: { locale: 'en', strength: 2, caseLevel: false },
			},
			{
				key: { 'emails.address': 1 },
				unique: false,
				name: 'emails_insensitive',
				partialFilterExpression: { emails: { $exists: true } },
				collation: { locale: 'en', strength: 2, caseLevel: false },
			},
			{
				key: { 'phones.phoneNumber': 1 },
				partialFilterExpression: { phones: { $exists: true } },
				unique: false,
			},
			{
				key: {
					'channels.visitor.visitorId': 1,
					'channels.visitor.source.type': 1,
					'channels.visitor.source.id': 1,
				},
				name: 'visitorAssociation',
				unique: false,
			},
			{
				key: {
					'channels.field': 1,
					'channels.value': 1,
					'channels.verified': 1,
				},
				partialFilterExpression: { 'channels.verified': true },
				name: 'verificationKey',
				unique: false,
			},
			{
				key: {
					preRegistration: 1,
				},
				sparse: true,
				unique: false,
			},
		];
	}

	async insertContact(
		data: InsertionModel<Omit<ILivechatContact, 'createdAt'>> & { createdAt?: ILivechatContact['createdAt'] },
	): Promise<ILivechatContact['_id']> {
		const result = await this.insertOne({
			createdAt: new Date(),
			...data,
			preRegistration: !data.channels.length,
		});

		return result.insertedId;
	}

	async updateContact(contactId: string, data: Partial<ILivechatContact>, options?: FindOneAndUpdateOptions): Promise<ILivechatContact> {
		const updatedValue = await this.findOneAndUpdate(
			{ _id: contactId },
			{ $set: { ...data, unknown: false, ...(data.channels && { preRegistration: !data.channels.length }) } },
			{ returnDocument: 'after', ...options },
		);
		return updatedValue.value as ILivechatContact;
	}

	updateById(contactId: string, update: UpdateFilter<ILivechatContact>, options?: UpdateOptions): Promise<Document | UpdateResult> {
		return this.updateOne({ _id: contactId }, update, options);
	}

	findPaginatedContacts(
		search: { searchText?: string; unknown?: boolean },
		options?: FindOptions,
	): FindPaginated<FindCursor<ILivechatContact>> {
		const { searchText, unknown = false } = search;
		const searchRegex = escapeRegExp(searchText || '');
		const match: Filter<ILivechatContact & RootFilterOperators<ILivechatContact>> = {
			$or: [
				{ name: { $regex: searchRegex, $options: 'i' } },
				{ 'emails.address': { $regex: searchRegex, $options: 'i' } },
				{ 'phones.phoneNumber': { $regex: searchRegex, $options: 'i' } },
			],
			unknown,
		};

		return this.findPaginated(
			{ ...match },
			{
				allowDiskUse: true,
				...options,
			},
		);
	}

	async findContactMatchingVisitor(visitor: AtLeast<ILivechatVisitor, 'visitorEmails' | 'phone'>): Promise<ILivechatContact | null> {
		const emails = visitor.visitorEmails?.map(({ address }) => address).filter((email) => Boolean(email)) || [];
		const phoneNumbers = visitor.phone?.map(({ phoneNumber }) => phoneNumber).filter((phone) => Boolean(phone)) || [];

		if (!emails?.length && !phoneNumbers?.length) {
			return null;
		}

		const query = {
			$and: [
				{
					$or: [
						...emails?.map((email) => ({ 'emails.address': email })),
						...phoneNumbers?.map((phone) => ({ 'phones.phoneNumber': phone })),
					],
				},
				{
					preRegistration: true,
				},
			],
		};

		return this.findOne(query);
	}

	private makeQueryForVisitor(
		visitor: ILivechatContactVisitorAssociation,
		extraFilters?: Filter<Required<ILivechatContact>['channels'][number]>,
	): Filter<ILivechatContact> {
		return {
			channels: {
				$elemMatch: {
					'visitor.visitorId': visitor.visitorId,
					'visitor.source.type': visitor.source.type,
					...(visitor.source.id ? { 'visitor.source.id': visitor.source.id } : {}),
					...extraFilters,
				},
			},
		};
	}

	async findOneByVisitor<T extends Document = ILivechatContact>(
		visitor: ILivechatContactVisitorAssociation,
		options: FindOptions<ILivechatContact> = {},
	): Promise<T | null> {
		return this.findOne<T>(this.makeQueryForVisitor(visitor), options);
	}

	async addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void> {
		await this.updateOne({ _id: contactId }, { $push: { channels: channel }, $set: { preRegistration: false } });
	}

	async updateLastChatById(
		contactId: string,
		visitor: ILivechatContactVisitorAssociation,
		lastChat: ILivechatContact['lastChat'],
	): Promise<UpdateResult> {
		return this.updateOne(
			{
				...this.makeQueryForVisitor(visitor),
				_id: contactId,
			},
			{ $set: { lastChat, 'channels.$.lastChat': lastChat } },
		);
	}

	async isChannelBlocked(visitor: ILivechatContactVisitorAssociation): Promise<boolean> {
		return Boolean(await this.findOne(this.makeQueryForVisitor(visitor, { blocked: true }), { projection: { _id: 1 } }));
	}

	async updateContactChannel(
		visitor: ILivechatContactVisitorAssociation,
		data: Partial<ILivechatContactChannel>,
		contactData?: Partial<Omit<ILivechatContact, 'channels'>>,
		options: UpdateOptions = {},
	): Promise<UpdateResult> {
		return this.updateOne(
			this.makeQueryForVisitor(visitor),
			{
				$set: {
					...contactData,
					...(Object.fromEntries(
						Object.keys(data).map((key) => [`channels.$.${key}`, data[key as keyof ILivechatContactChannel]]),
					) as UpdateFilter<ILivechatContact>['$set']),
				},
			},
			options,
		);
	}

	async findSimilarVerifiedContacts(
		{ field, value }: Pick<ILivechatContactChannel, 'field' | 'value'>,
		originalContactId: string,
		options?: FindOptions<ILivechatContact>,
	): Promise<ILivechatContact[]> {
		return this.find(
			{
				channels: {
					$elemMatch: {
						field,
						value,
						verified: true,
					},
				},
				_id: { $ne: originalContactId },
			},
			options,
		).toArray();
	}

	findAllByVisitorId(visitorId: string): FindCursor<ILivechatContact> {
		return this.find({
			'channels.visitor.visitorId': visitorId,
		});
	}

	async addEmail(contactId: string, email: string): Promise<ILivechatContact | null> {
		const updatedContact = await this.findOneAndUpdate({ _id: contactId }, { $addToSet: { emails: { address: email } } });

		return updatedContact.value;
	}
}
