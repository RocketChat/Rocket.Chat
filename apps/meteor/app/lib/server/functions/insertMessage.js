import { Messages, Rooms } from '@rocket.chat/models';

import { validateMessage, prepareMessageObject } from './sendMessage';
import { parseUrlsInMessage } from './parseUrlsInMessage';

export const insertMessage = async function (user, message, rid, upsert = false) {
	if (!user || !message || !rid) {
		return false;
	}

	await validateMessage(message, { _id: rid }, user);
	prepareMessageObject(message, rid, user);
	parseUrlsInMessage(message);

	if (message._id && upsert) {
		const { _id } = message;
		delete message._id;
		const existingMessage = await Messages.findOneById(_id);
		if (existingMessage) {
			await Messages.updateOne(
				{
					_id,
					'u._id': message.u._id,
				},
				{ $set: message },
			);
		}
		await Messages.insertOne({
			_id,
			'u._id': message.u._id,
			...message,
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
