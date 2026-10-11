import { Authorization } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';

type AccessibleMessageForReadCounter = {
	message: Pick<IMessage, '_id' | 'rid' | 'ts'> & { u?: Pick<IUser, '_id'> };
	room: Pick<IRoom, '_id' | 't'>;
};

export const getAccessibleMessageForReadCounter = async (
	messageId: IMessage['_id'],
	userId: IUser['_id'],
): Promise<AccessibleMessageForReadCounter | null> => {
	const message = await Messages.findOneById(messageId, {
		projection: { _id: 1, rid: 1, ts: 1, 'u._id': 1 },
	});

	if (!message) {
		return null;
	}

	const room = await Rooms.findOneById(message.rid, {
		projection: { _id: 1, t: 1 },
	});

	if (!room || room.t === 'd') {
		return null;
	}

	if (!(await Authorization.canReadRoom(room, { _id: userId }))) {
		return null;
	}

	return { message, room };
};
