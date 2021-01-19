import { Db } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { DiscussionArgs, IMessageService, MessageFilter, CustomQueryArgs } from '../../sdk/types/IMessageService';
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
		const result = await MessageEnterprise.get(userId, filter);
		console.log('result ->', result);
		if (result) {
			return result;
		}

		return this.Messages.findVisibleByRoomId(filter).toArray();
	}

	async getDiscussions(filter: DiscussionArgs): Promise<any[]> {
		const result = await MessageEnterprise.getDiscussions(filter.userId, filter);
		if (result) {
			return result;
		}

		return this.Messages.findDiscussionsByRoom(filter).toArray();
	}

	async customQuery(args: CustomQueryArgs): Promise<any[]> {
		const result = await MessageEnterprise.customQuery(args);
		if (result) {
			return result;
		}

		return this.Messages.find(args.query, args.queryOptions).toArray();
	}
}
