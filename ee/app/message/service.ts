import { Db } from 'mongodb';

import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { MessageFilter } from '../../../server/sdk/types/IMessageService';
import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import { IMessageEnterprise } from '../../../server/sdk/types/IMessageEnterprise';
import { hasLicense } from '../license/server/license';

export class MessageEnterprise extends ServiceClass implements IMessageEnterprise {
	protected name = 'ee-message';

	private Messages: MessagesRaw;

	constructor(db: Db) {
		super();

		this.Messages = new MessagesRaw(db.collection('rocketchat_message'));
	}

	async get(userId: string, filter: MessageFilter): Promise<any[] | undefined> {
		console.log('MessageEnterprise', userId, filter);

		if (!hasLicense('livechat-enterprise')) {
			return;
		}

		//filter.oldest = new Date(2021, 0, 14);
		console.log('enterprise filter');

		return this.Messages.findVisibleByRoomId(filter).toArray();
	}
}
