import { Messages, Rooms } from '../../../models/server';
import { validateMessage, prepareMessageObject } from './sendMessage';
import { parseUrlsInMessage } from './parseUrlsInMessage';
import { IMessage } from '../../../../definition/IMessage';
import { IUser } from '../../../../definition/IUser';

/* deprecated */
export const insertMessage = function (
	user: Pick<IUser, '_id' | 'username' | 'name'>,
	message: IMessage,
	rid: string,
	upsert = false,
): IMessage | false {
	if (!user || !message || !rid) {
		return false;
	}

	validateMessage(message, { _id: rid }, user);
	prepareMessageObject(message, rid, user);
	parseUrlsInMessage(message);

	if (message._id && upsert) {
		const { _id, ...msg } = message;
		const existingMessage = Messages.findOneById(_id);
		Messages.upsert(
			{
				_id,
				'u._id': msg.u._id,
			},
			msg,
		);
		if (!existingMessage) {
			Rooms.incMsgCountById(rid, 1);
		}
		return { ...message, _id };
	}

	message._id = Messages.insert(message);
	Rooms.incMsgCountById(rid, 1);

	return message;
};
