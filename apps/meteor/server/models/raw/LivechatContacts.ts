import type { ILivechatContact, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatContactsModel } from '@rocket.chat/model-typings';
import type { Collection, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatContactsRaw extends BaseRaw<ILivechatContact> implements ILivechatContactsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatContact>>) {
		super(db, 'livechat_contact', trash);
	}

	async updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact> {
		await this.updateOne({ _id: contactId }, { $set: { ...data, unknown: true } });
		return this.findOneById(contactId) as Promise<ILivechatContact>;
	}

	async findVerifiedContactByEmail(email: string): Promise<ILivechatContact | null> {
		// TODO: find only contacts with verified channels
		return this.findOne({ emails: { $elemMatch: { address: email } }, channels: { $elemMatch: { verified: true } } });
	}
}
