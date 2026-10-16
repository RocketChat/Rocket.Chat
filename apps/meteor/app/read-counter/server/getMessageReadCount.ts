import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { getAccessibleMessageForReadCounter } from './getAccessibleMessageForReadCounter';

export const getMessageReadCount = async (
	messageId: IMessage['_id'],
	userId: IUser['_id'],
): Promise<{ readCount: number } | null> => {
	const accessible = await getAccessibleMessageForReadCounter(messageId, userId);

	if (!accessible) {
		return null;
	}

	const { message } = accessible;

	if (!message.ts) {
		return { readCount: 0 };
	}

	const readCount = await Subscriptions.countReadersByRoomIdAndMessageTs(message.rid, message.ts, message.u?._id);

	return { readCount };
};
