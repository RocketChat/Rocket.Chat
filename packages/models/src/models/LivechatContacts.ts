import type {
	AtLeast,
	ILivechatContact,
	ILivechatContactChannel,
	ILivechatContactVisitorAssociation,
	ILivechatVisitor,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatContactsModel, InsertionModel, Updater } from '@rocket.chat/model-typings';
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
	AggregationCursor,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../readSecondaryPreferred';

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
			{
				key: { activity: 1 },
				sparse: true,
			},
			{
				key: { channels: 1 },
				unique: false,
			},
			{
				key: { 'channels.blocked': 1 },
				sparse: true,
			},
			{
				key: { 'channels.verified': 1 },
				sparse: true,
			},
			{
				key: { unknown: 1 },
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
		return updatedValue as ILivechatContact;
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

	async findContactByEmailAndContactManager(email: string): Promise<Pick<ILivechatContact, 'contactManager'> | null> {
		return this.findOne(
			{ emails: { $elemMatch: { address: email } }, contactManager: { $exists: true } },
			{ projection: { contactManager: 1 } },
		);
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

	setChannelBlockStatus(visitor: ILivechatContactVisitorAssociation, blocked: boolean): Promise<UpdateResult> {
		return this.updateOne(this.makeQueryForVisitor(visitor), { $set: { 'channels.$.blocked': blocked } });
	}

	setChannelVerifiedStatus(visitor: ILivechatContactVisitorAssociation, verified: boolean): Promise<UpdateResult> {
		return this.updateOne(this.makeQueryForVisitor(visitor), {
			$set: {
				'channels.$.verified': verified,
				...(verified && { 'channels.$.verifiedAt': new Date() }),
			},
		});
	}

	setVerifiedUpdateQuery(verified: boolean, contactUpdater: Updater<ILivechatContact>): Updater<ILivechatContact> {
		if (verified) {
			contactUpdater.set('channels.$.verifiedAt', new Date());
		}
		return contactUpdater.set('channels.$.verified', verified);
	}

	setFieldAndValueUpdateQuery(field: string, value: string, contactUpdater: Updater<ILivechatContact>): Updater<ILivechatContact> {
		contactUpdater.set('channels.$.field', field);
		return contactUpdater.set('channels.$.value', value);
	}

	updateFromUpdaterByAssociation(
		visitor: ILivechatContactVisitorAssociation,
		contactUpdater: Updater<ILivechatContact>,
		options: UpdateOptions = {},
	): Promise<UpdateResult> {
		return this.updateFromUpdater(this.makeQueryForVisitor(visitor), contactUpdater, options);
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

		return updatedContact;
	}

	isContactActiveOnPeriod(visitor: ILivechatContactVisitorAssociation, period: string): Promise<number> {
		const query = {
			...this.makeQueryForVisitor(visitor),
			activity: period,
		};

		return this.countDocuments(query);
	}

	markContactActiveForPeriod(visitor: ILivechatContactVisitorAssociation, period: string): Promise<UpdateResult> {
		const update = {
			$push: {
				activity: {
					$each: [period],
					$slice: -12,
				},
			},
		};

		return this.updateOne(this.makeQueryForVisitor(visitor), update);
	}

	countContactsOnPeriod(period: string): Promise<number> {
		return this.countDocuments({
			activity: period,
		});
	}

	countByContactInfo({ contactId, email, phone }: { contactId?: string; email?: string; phone?: string }): Promise<number> {
		const filter = {
			...(email && { 'emails.address': email }),
			...(phone && { 'phones.phoneNumber': phone }),
			...(contactId && { _id: contactId }),
		};

		return this.countDocuments(filter);
	}

	countUnknown(): Promise<number> {
		return this.countDocuments({ unknown: true }, { readPreference: readSecondaryPreferred() });
	}

	countBlocked(): Promise<number> {
		return this.countDocuments({ 'channels.blocked': true }, { readPreference: readSecondaryPreferred() });
	}

	countFullyBlocked(): Promise<number> {
		return this.countDocuments(
			{
				'channels.blocked': true,
				'channels': { $not: { $elemMatch: { $or: [{ blocked: false }, { blocked: { $exists: false } }] } } },
			},
			{ readPreference: readSecondaryPreferred() },
		);
	}

	countVerified(): Promise<number> {
		return this.countDocuments({ 'channels.verified': true }, { readPreference: readSecondaryPreferred() });
	}

	countContactsWithoutChannels(): Promise<number> {
		return this.countDocuments({ channels: { $size: 0 } }, { readPreference: readSecondaryPreferred() });
	}

	getStatistics(): AggregationCursor<{ totalConflicts: number; avgChannelsPerContact: number }> {
		return this.col.aggregate<{ totalConflicts: number; avgChannelsPerContact: number }>(
			[
				{
					$group: {
						_id: null,
						totalConflicts: {
							$sum: { $size: { $cond: [{ $isArray: '$conflictingFields' }, '$conflictingFields', []] } },
						},
						avgChannelsPerContact: {
							$avg: { $size: { $cond: [{ $isArray: '$channels' }, '$channels', []] } },
						},
					},
				},
			],
			{ allowDiskUse: true, readPreference: readSecondaryPreferred() },
		);
	}

	updateByVisitorId(visitorId: string, update: UpdateFilter<ILivechatContact>, options?: UpdateOptions): Promise<UpdateResult> {
		return this.updateOne({ 'channels.visitor.visitorId': visitorId }, update, options);
	}
}
