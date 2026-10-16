import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { getAccessibleMessageForReadCounter } from './getAccessibleMessageForReadCounter';

export const getMessageReaders = async (
	messageId: IMessage['_id'],
	userId: IUser['_id'],
	limit = 50,
): Promise<{ readers: Array<Pick<IUser, '_id' | 'name' | 'username'>> } | null> => {
	const accessible = await getAccessibleMessageForReadCounter(messageId, userId);

	if (!accessible) {
		return null;
	}

	const { message } = accessible;

	if (!message.ts) {
		return { readers: [] };
	}

	const readers = await Subscriptions.findReaderUsersByRoomIdAndMessageTs(message.rid, message.ts, message.u?._id, limit);

	return { readers };
};
