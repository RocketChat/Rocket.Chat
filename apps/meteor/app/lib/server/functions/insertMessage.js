import { Rooms } from '@rocket.chat/models';

import { Messages } from '../../../models/server';
import { validateMessage, prepareMessageObject } from './sendMessage';
import { parseUrlsInMessage } from './parseUrlsInMessage';

export const insertMessage = async function (user, message, rid, upsert = false) {
	if (!user || !message || !rid) {
		return false;
	}

	validateMessage(message, { _id: rid }, user);
	prepareMessageObject(message, rid, user);
	parseUrlsInMessage(message);

	if (message._id && upsert) {
		const { _id } = message;
		delete message._id;
		const existingMessage = Messages.findOneById(_id);
		Messages.upsert(
			{
				_id,
				'u._id': message.u._id,
			},
			message,
		);
		if (!existingMessage) {
			await Rooms.incMsgCountById(rid, 1);
		}
		message._id = _id;
	} else {
		message._id = Messages.insert(message);
		await Rooms.incMsgCountById(rid, 1);
	}

	return message;
};
