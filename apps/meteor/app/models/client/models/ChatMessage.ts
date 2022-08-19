import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

class ChatMessageCollection extends Mongo.Collection<IMessage & { ignored?: boolean }> {
	direct: Mongo.Collection<IMessage, IMessage>;

	queries: unknown[];

	constructor() {
		super(null);
	}

	setReactions(messageId: IMessage['_id'], reactions: IMessage['reactions']) {
		return this.update({ _id: messageId }, { $set: { reactions } });
	}

	unsetReactions(messageId: IMessage['_id']) {
		return this.update({ _id: messageId }, { $unset: { reactions: 1 } });
	}

	findOneByRoomIdAndMessageId(rid: IRoom['_id'], messageId: IMessage['_id'], options?: Mongo.Options<IMessage>) {
		const query = {
			rid,
			_id: messageId,
		};

		return this.findOne(query, options);
	}
}

export const ChatMessage = new ChatMessageCollection();
