import type { IRoom } from '@rocket.chat/core-typings';

import { withVisibleLastMessage } from '../../lib/messages/historyVisibility';
import { normalizeMessagesForUser } from '../../lib/utils/lib/normalizeMessagesForUser';

export async function composeRoomsWithLastMessage(rooms: IRoom[], userId: string) {
	return Promise.all(
		(await withVisibleLastMessage(userId, rooms)).map(async (room) => {
			if (room.lastMessage) {
				const [lastMessage] = await normalizeMessagesForUser([room.lastMessage], userId);
				room.lastMessage = lastMessage;
			}
			return room;
		}),
	);
}

export async function composeRoomWithLastMessage(room: IRoom, userId: string) {
	const [composed] = await composeRoomsWithLastMessage([room], userId);
	return composed;
}
