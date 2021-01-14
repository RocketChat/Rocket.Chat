import { Db } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IMessageService, MessageFilter } from '../../sdk/types/IMessageService';
import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { MessageEnterprise } from '../../sdk';

export class MessageService extends ServiceClass implements IMessageService {
	protected name = 'message';

	private Messages: MessagesRaw;

	constructor(db: Db) {
		super();

		this.Messages = new MessagesRaw(db.collection('rocketchat_message'));
	}

	async get(userId: string, filter: MessageFilter): Promise<any[]> {
		// console.log('MessageService.get', rid);

		const result = await MessageEnterprise.get(userId, filter);
		console.log('result ->', result);
		if (result) {
			return result;
		}

		return this.Messages.findVisibleByRoomId(filter).toArray();
	}
}
