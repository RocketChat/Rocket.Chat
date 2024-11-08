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
		];
	}

	async insertContact(
		data: InsertionModel<Omit<ILivechatContact, 'createdAt'>> & { createdAt?: ILivechatContact['createdAt'] },
	): Promise<ILivechatContact['_id']> {
		const result = await this.insertOne({
			createdAt: new Date(),
			...data,
		});

		return result.insertedId;
	}

	async upsertContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact | null> {
		const result = await this.findOneAndUpdate(
			{ _id: contactId },
			{ $set: data, $setOnInsert: { createdAt: new Date() } },
			{ upsert: true },
		);
		return result.value;
	}

	async updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact> {
		const updatedValue = await this.findOneAndUpdate(
			{ _id: contactId },
			{ $set: { ...data, unknown: false } },
			{ returnDocument: 'after' },
		);
		return updatedValue.value as ILivechatContact;
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
					$or: [
						{
							channels: { $exists: false },
						},
						{
							channels: { $size: 0 },
						},
					],
				},
			],
		};

		return this.findOne(query);
	}

	private makeQueryForVisitor(visitor: ILivechatContactVisitorAssociation): Filter<ILivechatContact> {
		return {
			'channels.visitor.visitorId': visitor.visitorId,
			'channels.visitor.source.type': visitor.source.type,
			...(visitor.source.id ? { 'channels.visitor.source.id': visitor.source.id } : {}),
		};
	}

	async findOneByVisitor<T extends Document = ILivechatContact>(
		visitor: ILivechatContactVisitorAssociation,
		options: FindOptions<ILivechatContact> = {},
	): Promise<T | null> {
		return this.findOne<T>(this.makeQueryForVisitor(visitor), options);
	}

	async addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void> {
		await this.updateOne({ _id: contactId }, { $push: { channels: channel } });
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
		return Boolean(
			await this.findOne(
				{
					channels: {
						$elemMatch: {
							'visitor.visitorId': visitor.visitorId,
							'visitor.source.type': visitor.source.type,
							'blocked': true,
							...(visitor.source.id ? { 'visitor.source.id': visitor.source.id } : {}),
						},
					},
				},
				{ projection: { _id: 1 } },
			),
		);
	}

	async updateContactChannel(
		visitor: ILivechatContactVisitorAssociation,
		data: Partial<ILivechatContactChannel>,
		contactData?: Partial<Omit<ILivechatContact, 'channels'>>,
	): Promise<UpdateResult> {
		return this.updateOne(this.makeQueryForVisitor(visitor), {
			$set: {
				...contactData,
				...(Object.fromEntries(
					Object.keys(data).map((key) => [`channels.$.${key}`, data[key as keyof ILivechatContactChannel]]),
				) as UpdateFilter<ILivechatContact>['$set']),
			},
		});
	}

	async findSimilarVerifiedContacts(
		{ field, value }: Pick<ILivechatContactChannel, 'field' | 'value'>,
		originalContactId: string,
		options?: FindOptions<ILivechatContact>,
	): Promise<ILivechatContact[]> {
		return this.find(
			{
				'channels.field': field,
				'channels.value': value,
				'channels.verified': true,
				'_id': { $ne: originalContactId },
			},
			options,
		).toArray();
	}

	findAllByVisitorId(visitorId: string): FindCursor<ILivechatContact> {
		return this.find({
			'channels.visitor.visitorId': visitorId,
		});
	}
}
