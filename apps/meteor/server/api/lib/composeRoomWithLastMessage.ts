import type { IRoom } from '@rocket.chat/core-typings';

import { normalizeMessagesForUser } from '../../lib/utils/lib/normalizeMessagesForUser';

export async function composeRoomWithLastMessage(room: IRoom, userId: string) {
	if (room.lastMessage) {
		const [lastMessage] = await normalizeMessagesForUser([room.lastMessage], userId);
		room.lastMessage = lastMessage;
	}
	return room;
}
