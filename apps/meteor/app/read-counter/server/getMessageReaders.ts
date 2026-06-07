import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Authorization } from '@rocket.chat/core-services';
import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

export const getMessageReaders = async (
	messageId: IMessage['_id'],
	userId: IUser['_id'],
	limit = 50,
): Promise<{ readers: Array<Pick<IUser, '_id' | 'name' | 'username'>> } | null> => {
	const message = await Messages.findOneById(messageId, {
		projection: { _id: 1, rid: 1, ts: 1, 'u._id': 1 },
	});

	if (!message) {
		return null;
	}

	const room = await Rooms.findOneById(message.rid as IRoom['_id'], {
		projection: { _id: 1, t: 1 },
	});

	if (!room) {
		return null;
	}

	if (room.t === 'd') {
		return null;
	}

	if (!(await Authorization.canReadRoom(room, { _id: userId }))) {
		return null;
	}

	if (!message.ts) {
		return { readers: [] };
	}

	const excludeUserId = message.u?._id;

	const readers = await Subscriptions.findReaderUsersByRoomIdAndMessageTs(message.rid, message.ts, excludeUserId, limit);

	return { readers };
};
