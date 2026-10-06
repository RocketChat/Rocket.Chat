import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { isTruthy } from '@rocket.chat/tools';

import { roomAccessAttributes } from '../authorization';
import { canAccessRoomAsync } from '../authorization/canAccessRoom';

export async function filterMessagesByRoomAccess(messages: IMessage[], user: IUser | Pick<IUser, '_id'>): Promise<IMessage[]> {
	if (!messages.length) {
		return messages;
	}

	const rids = [...new Set(messages.map(({ rid }) => rid))];
	const rooms = await Rooms.findByIds(rids, { projection: roomAccessAttributes }).toArray();

	const accessibleRids = new Set(
		(await Promise.all(rooms.map(async (room) => ((await canAccessRoomAsync(room, user)) ? room._id : null)))).filter(isTruthy),
	);

	return messages.filter((message) => accessibleRids.has(message.rid));
}
