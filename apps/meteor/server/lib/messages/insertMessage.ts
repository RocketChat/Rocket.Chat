import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';

import { parseUrlsInMessage } from './parseUrlsInMessage';
import { validateMessage, prepareMessageObject } from './sendMessage';

// Imported messages are assembled from optional attributes, and our mongo connection is configured with
// `ignoreUndefined: false` - which would store every attribute the imported message doesn't have as `null`.
const writeOptions = { ignoreUndefined: true };

// TODO: remove and move to Message.Service
export const insertMessage = async function (
	user: Pick<IUser, '_id' | 'username'>,
	message: IMessage,
	rid: IRoom['_id'],
	upsert = false,
): Promise<IMessage | boolean> {
	if (!user || !message || !rid) {
		return false;
	}

	await validateMessage(message, { _id: rid }, user);
	prepareMessageObject(message, rid, user);
	message.urls = parseUrlsInMessage(message);

	if (message._id && upsert) {
		const { _id, ...rest } = message;
		const existingMessage = await Messages.findOneById(_id);
		if (existingMessage) {
			await Messages.updateOne(
				{
					_id,
					'u._id': message.u._id,
				},
				{ $set: rest },
				writeOptions,
			);
		} else {
			await Messages.insertOne(
				{
					_id,
					...rest,
				},
				writeOptions,
			);
			await Rooms.incMsgCountById(rid, 1);
		}
		message._id = _id;
	} else {
		const result = await Messages.insertOne(message, writeOptions);
		message._id = result.insertedId;
		await Rooms.incMsgCountById(rid, 1);
	}

	return message;
};
