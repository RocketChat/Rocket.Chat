import { Messages, Rooms } from '@rocket.chat/models';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { validateMessage, prepareMessageObject } from './sendMessage';
import { parseUrlsInMessage } from './parseUrlsInMessage';

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
	parseUrlsInMessage(message);

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
			);
		}
		await Messages.insertOne({
			_id,
			// @ts-expect-error - seems it doesn't like this syntax :(
			'u._id': message.u._id,
			...rest,
		});
		if (!existingMessage) {
			await Rooms.incMsgCountById(rid, 1);
		}
		message._id = _id;
	} else {
		const result = await Messages.insertOne(message);
		message._id = result.insertedId;
		await Rooms.incMsgCountById(rid, 1);
	}

	return message;
};
