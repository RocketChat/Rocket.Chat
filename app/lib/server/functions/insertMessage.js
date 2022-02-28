import { Messages } from '../../../models/server';
import { validateMessage, prepareMessageObject } from './sendMessage';
import { parseUrlsInMessage } from './parseUrlsInMessage';

export const insertMessage = function (user, message, rid, upsert = false) {
	if (!user || !message || !rid) {
		return false;
	}

	validateMessage(message, { _id: rid }, user);
	prepareMessageObject(message, rid, user);
	parseUrlsInMessage(message);

	if (message._id && upsert) {
		const { _id } = message;
		delete message._id;
		Messages.upsert(
			{
				_id,
				'u._id': message.u._id,
			},
			message,
		);
		message._id = _id;
	} else {
		message._id = Messages.insert(message);
	}

	return message;
};
