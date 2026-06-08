import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Authorization } from '@rocket.chat/core-services';
import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';

export const getMessageReadCount = async (
	messageId: IMessage['_id'],
	userId: IUser['_id'],
): Promise<{ readCount: number } | null> => {
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

	// Exclude DMs from read counter
	if (room.t === 'd') {
		return null;
	}

	// Ensure the requesting user can access the room
	if (!(await Authorization.canReadRoom(room, { _id: userId }))) {
		return null;
	}

	if (!message.ts) {
		return { readCount: 0 };
	}

	const excludeUserId = message.u?._id;

	const readCount = await Subscriptions.countReadersByRoomIdAndMessageTs(message.rid, message.ts, excludeUserId);

	return { readCount };
};

