import type { ILivechatContact, ILivechatContactChannel, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatContactsModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Collection, Db, RootFilterOperators, Filter, FindOptions, FindCursor, IndexDescription, UpdateResult } from 'mongodb';

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

	async addChannel(contactId: string, channel: ILivechatContactChannel): Promise<void> {
		await this.updateOne({ _id: contactId }, { $push: { channels: channel } });
	}

	updateLastChatById(contactId: string, lastChat: ILivechatContact['lastChat']): Promise<UpdateResult> {
		return this.updateOne({ _id: contactId }, { $set: { lastChat } });
	}
}
