import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

import type { MinimongoCollection } from '../../../../client/definitions/MinimongoCollection';

class ChatMessageCollection
	extends Mongo.Collection<IMessage & { ignored?: boolean }>
	implements MinimongoCollection<IMessage & { ignored?: boolean }>
{
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

	public declare _collection: MinimongoCollection<IMessage & { ignored?: boolean }>['_collection'];

	public declare queries: MinimongoCollection<IMessage & { ignored?: boolean }>['queries'];
}

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const ChatMessage = new ChatMessageCollection();
