import type {
	AtLeast,
	ILivechatContact,
	ILivechatContactChannel,
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

	findPaginatedContacts(searchText?: string, options?: FindOptions): FindPaginated<FindCursor<ILivechatContact>> {
		const searchRegex = escapeRegExp(searchText || '');
		const match: Filter<ILivechatContact & RootFilterOperators<ILivechatContact>> = {
			$or: [
				{ name: { $regex: searchRegex, $options: 'i' } },
				{ 'emails.address': { $regex: searchRegex, $options: 'i' } },
				{ 'phones.phoneNumber': { $regex: searchRegex, $options: 'i' } },
			],
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

	async findOneByVisitorId<T extends Document = ILivechatContact>(
		visitorId: ILivechatVisitor['_id'],
		options: FindOptions<ILivechatContact> = {},
	): Promise<T | null> {
		const query = {
			'channels.visitorId': visitorId,
		};
		return this.findOne<T>(query, options);
	}

	async addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void> {
		await this.updateOne({ _id: contactId }, { $push: { channels: channel } });
	}

	async updateLastChatById(contactId: string, visitorId: string, lastChat: ILivechatContact['lastChat']): Promise<UpdateResult> {
		return this.updateOne({ '_id': contactId, 'channels.visitorId': visitorId }, { $set: { lastChat, 'channels.$.lastChat': lastChat } });
	}

	async isChannelBlocked(visitorId: ILivechatVisitor['_id']): Promise<boolean> {
		return Boolean(
			await this.findOne(
				{
					'channels.visitorId': visitorId,
					'channels.blocked': true,
				},
				{ projection: { _id: 1 } },
			),
		);
	}

	async updateContactChannel(
		visitorId: ILivechatVisitor['_id'],
		data: Partial<ILivechatContactChannel>,
		contactData?: Partial<Omit<ILivechatContact, 'channels'>>,
	): Promise<UpdateResult> {
		return this.updateOne(
			{
				'channels.visitorId': visitorId,
			},
			{
				$set: {
					...contactData,
					...(Object.fromEntries(
						Object.keys(data).map((key) => [`channels.$.${key}`, data[key as keyof ILivechatContactChannel]]),
					) as UpdateFilter<ILivechatContact>['$set']),
				},
			},
		);
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
}
