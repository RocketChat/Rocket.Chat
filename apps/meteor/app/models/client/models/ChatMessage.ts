import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

class ChatMessageCollection extends Mongo.Collection<IMessage & { ignored?: boolean }> {
	constructor() {
		super(null);
	}

	findOneByRoomIdAndMessageId(rid: IRoom['_id'], messageId: IMessage['_id'], options?: Mongo.Options<IMessage>) {
		const query = {
			rid,
			_id: messageId,
		};

		return this.findOne(query, options);
	}

	public direct: Mongo.Collection<IMessage & { ignored?: boolean }>;

	public queries: unknown[];
}

export const ChatMessage = new ChatMessageCollection();
