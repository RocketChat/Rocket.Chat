import type { ILivechatContact, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatContactsModel } from '@rocket.chat/model-typings';
import type { Collection, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatContactsRaw extends BaseRaw<ILivechatContact> implements ILivechatContactsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatContact>>) {
		super(db, 'livechat_contact', trash);
	}

	async updateContact(contactId: string, data: Partial<ILivechatContact>): Promise<ILivechatContact> {
		const updatedValue = await this.findOneAndUpdate(
			{ _id: contactId },
			{ $set: { ...data, unknown: false } },
			{ returnDocument: 'after' },
		);
		return updatedValue.value as ILivechatContact;
	}
}
